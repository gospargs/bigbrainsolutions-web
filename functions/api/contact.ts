interface Env {
  EMAIL?: { send: (msg: unknown) => Promise<unknown> };
  CONTACT_RATE_LIMIT?: { limit: (opts: { key: string }) => Promise<{ success: boolean }> };
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
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  const ip = request.headers.get('CF-Connecting-IP');
  if (env.CONTACT_RATE_LIMIT && ip) {
    try {
      const { success } = await env.CONTACT_RATE_LIMIT.limit({ key: ip });
      if (!success) {
        return Response.json({ success: false, error: 'Too many requests. Please try again in a minute.' }, { status: 429 });
      }
    } catch {
      // Rate limiter binding not configured in this environment (e.g. local dev) -- fail open, not closed.
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

  if (!name?.trim() || !email?.trim() || !message?.trim()) {
    return Response.json({ success: false, error: 'Please fill in all required fields.' }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return Response.json({ success: false, error: 'Please enter a valid email address.' }, { status: 400 });
  }

  if (env.TURNSTILE_SECRET_KEY) {
    if (!turnstileToken) {
      return Response.json({ success: false, error: 'Bot verification failed. Please try again.' }, { status: 400 });
    }
    const humanVerified = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY, ip);
    if (!humanVerified) {
      return Response.json({ success: false, error: 'Bot verification failed. Please try again.' }, { status: 400 });
    }
  }

  const submission = {
    name: name.trim(),
    email: email.trim(),
    clientType: clientType ?? 'individual',
    service: service ?? 'unspecified',
    message: message.trim(),
    receivedAt: new Date().toISOString(),
  };

  // Email delivery is wired but intentionally inert until the production domain is
  // onboarded to Cloudflare Email Sending (requires adding DNS records to the live
  // zone -- deferred until DEPLOY-001 per the owner's no-DNS-changes-before-cutover
  // instruction). Until CONTACT_FROM_EMAIL is set, submissions are accepted and
  // logged but not emailed -- see docs/decisions.md.
  if (env.EMAIL && env.CONTACT_TO_EMAIL && env.CONTACT_FROM_EMAIL) {
    await env.EMAIL.send({
      to: env.CONTACT_TO_EMAIL,
      from: { email: env.CONTACT_FROM_EMAIL, name: 'Big Brain Solutions website' },
      subject: `New contact form submission from ${submission.name}`,
      text: [
        `Name: ${submission.name}`,
        `Email: ${submission.email}`,
        `Client type: ${submission.clientType}`,
        `Service: ${submission.service}`,
        '',
        submission.message,
      ].join('\n'),
      html: `<p><strong>Name:</strong> ${submission.name}</p>
        <p><strong>Email:</strong> ${submission.email}</p>
        <p><strong>Client type:</strong> ${submission.clientType}</p>
        <p><strong>Service:</strong> ${submission.service}</p>
        <p>${submission.message.replace(/\n/g, '<br>')}</p>`,
    });
  } else {
    console.log('[contact] submission received (email delivery not yet configured):', submission);
  }

  return Response.json({ success: true });
};
