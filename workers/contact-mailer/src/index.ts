import { WorkerEntrypoint } from 'cloudflare:workers';

// Pages Functions have no send_email binding, so functions/api/contact.ts calls this Worker
// through a service binding. Sending to a verified destination needs only Email Routing, which
// the zone already has, so this adds no DNS records.
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

export default class ContactMailer extends WorkerEntrypoint<Env> {
  async fetch(): Promise<Response> {
    return new Response('Not found', { status: 404 });
  }

  async send(submission: Submission): Promise<void> {
    const { name, email, clientType, service, message } = submission;
    const { messageId } = await this.env.EMAIL.send({
      // `to` omitted: the binding's destination_address is the only possible recipient.
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
    console.log('[contact-mailer] sent', messageId);
  }
}
