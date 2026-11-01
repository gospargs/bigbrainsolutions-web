interface Env {
  EMAIL?: { send: (msg: unknown) => Promise<unknown> };
  CONTACT_RATE_KV?: KVNamespace;
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
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

// Bot rejections carry no `error` text, so the form shows its own localized generic message.
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

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
    return Response.json({ success: false, error: 'Invalid request.' }, { status: 400 });
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
    return Response.json({ success: false, error: 'Please fill in all required fields.' }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return Response.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  // Fails closed: a missing secret must not turn bot verification off.
  if (!env.TURNSTILE_SECRET_KEY || !turnstileToken) {
    return rejected(400);
  }
  if (!(await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip))) {
    return rejected(400);
  }

  const submission = {
    name: name.trim(),
    email: email.trim(),
    clientType: clientType ?? 'individual',
    service: service ?? 'unspecified',
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  };

  // Email delivery is not configured in production yet -- see docs/decisions.md
  // (SECURITY-001). Until it is, tell the visitor the send failed so the form's error
  // message sends them to the phone number, rather than claiming a message was received.
  if (env.EMAIL && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL) {
    await env.EMAIL.send({
      to: env.CONTACT_TO_EMAIL,
      from: { email: env.CONTACT_FROM_EMAIL, name: 'Big Brain Solutions website' },
      subject: `New contact form submission from ${submission.name.replace(/[\r\n]+/g, ' ')}`,
      text: [
        `Name: ${submission.name}`,
        `Email: ${submission.email}`,
        `Client type: ${submission.clientType}`,
        `Service: ${submission.service}`,
        '',
        submission.message,
      ].join('\n'),
      html: `<p><strong>Name:</strong> ${escapeHtml(submission.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(submission.email)}</p>
        <p><strong>Client type:</strong> ${escapeHtml(submission.clientType)}</p>
        <p><strong>Service:</strong> ${escapeHtml(submission.service)}</p>
        <p>${escapeHtml(submission.message).replace(/\n/g, '<br>')}</p>`,
    });
  } else {
    console.log('[contact] submission received (email delivery not yet configured):', submission);
    return rejected(503);
  }

  return Response.json({ success: true });
};
