// Pages Functions have no send_email binding, so functions/api/contact.ts calls this Worker
// through a service binding. Sending to a verified destination needs only Email Routing, which
// the zone already has, so this adds no DNS records.
const TO = 'gospargs@gmail.com'; // Also enforced by destination_address on the binding.
const FROM = { email: 'contact-form@bigbrain-solutions.com', name: 'Big Brain Solutions website' };

interface Env {
  EMAIL: { send: (msg: unknown) => Promise<{ messageId: string }> };
}

export interface Submission {
  name: string;
  email: string;
  clientType: string;
  service: string;
  message: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method !== 'POST') return new Response('Not found', { status: 404 });

    const { name, email, clientType, service, message } = (await request.json()) as Submission;
    try {
      const sending = env.EMAIL.send({
        to: TO,
        from: FROM,
        replyTo: email,
        subject: `New contact form submission from ${name.replace(/[\r\n]+/g, ' ')}`,
        text: [
          `Name: ${name}`,
          `Email: ${email}`,
          `Client type: ${clientType}`,
          `Service: ${service}`,
          '',
          message,
        ].join('\n'),
        html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Client type:</strong> ${escapeHtml(clientType)}</p>
          <p><strong>Service:</strong> ${escapeHtml(service)}</p>
          <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`,
      });
      ctx.waitUntil(sending);
      const { messageId } = await sending;
      console.log('[contact-mailer] sent', messageId);
      return new Response('Sent');
    } catch (err) {
      console.error('[contact-mailer] send failed', (err as { code?: string }).code, (err as Error).message);
      return new Response('Send failed', { status: 502 });
    }
  },
};
