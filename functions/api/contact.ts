interface Env {
  MAILER?: Fetcher;
  CONTACT_RATE_KV?: KVNamespace;
  TURNSTILE_SECRET_KEY?: string;
}

// The JSON body workers/contact-mailer/src/index.ts expects.
interface Submission {
  name: string;
  email: string;
  clientType: string;
  service: string;
  message: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  clientType?: string;
  service?: string;
  message?: string;
  'cf-turnstile-response'?: string;
  company_website?: string;
  elapsedMs?: number;
}

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_SECONDS = 600;
const MIN_SUBMIT_MS = 2500;

// Rejections carry no `error` text, so the form shows its own localized generic message.
const rejected = (status: number) => Response.json({ success: false }, { status });

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

async function isRateLimited(kv: KVNamespace, ip: string): Promise<boolean> {
  // Hashed so raw visitor IPs are never stored.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const hash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  const key = `contact:${hash}`;

  const count = Number(await kv.get(key)) || 0;
  if (count >= RATE_LIMIT_MAX) return true;
  await kv.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });
  return false;
}

async function handleSubmission({ request, env }: EventContext<Env, string, unknown>): Promise<Response> {

  const ip = request.headers.get('CF-Connecting-IP');
  if (env.CONTACT_RATE_KV && ip) {
    try {
      if (await isRateLimited(env.CONTACT_RATE_KV, ip)) return rejected(429);
    } catch {
      // KV outage shouldn't take the form down -- fail open; Turnstile still applies.
    }
  }

  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return rejected(400);
  }

  const { name, email, clientType, service, message } = payload;
  const turnstileToken = payload['cf-turnstile-response'];

  // Honeypot: report success so scrapers can't tell they were caught.
  if (payload.company_website) {
    return Response.json({ success: true });
  }

  if (typeof payload.elapsedMs !== 'number' || payload.elapsedMs < MIN_SUBMIT_MS) {
    return rejected(400);
  }

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return rejected(400);
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return rejected(400);
  }

  // Fails closed: a missing secret must not turn bot verification off.
  if (!env.TURNSTILE_SECRET_KEY || !turnstileToken) {
    return rejected(400);
  }
  if (!(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip))) {
    return rejected(400);
  }

  const submission: Submission = {
    name: name.trim(),
    email: email.trim(),
    clientType: clientType ?? 'individual',
    service: service ?? 'unspecified',
    message: message.trim(),
  };

  // A failed send must not look like success: the form's error message points visitors to the phone.
  try {
    if (!env.MAILER) throw new Error('MAILER binding missing');
    // The hostname is ignored: a service binding always reaches the Worker.
    const res = await env.MAILER.fetch('https://contact-mailer/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
    if (!res.ok) throw new Error(`contact-mailer responded ${res.status}`);
  } catch (err) {
    console.error('[contact] email delivery failed:', err);
    return rejected(502);
  }

  return Response.json({ success: true });
}

export const onRequestPost: PagesFunction<Env> = (context) => {
  // Covers the whole handler, not just the send, so a visitor closing the tab during the Turnstile
  // check can't lose the enquiry either. The response still waits for the outcome.
  const result = handleSubmission(context);
  context.waitUntil(result);
  return result;
};
