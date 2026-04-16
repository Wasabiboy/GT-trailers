const nodemailer = require('nodemailer');

/**
 * Netlify background function — fires automatically on every verified form submission.
 * Sends a notification to the GT Trailers sales team via Rackspace SMTP,
 * and an auto-reply acknowledgement back to the customer.
 *
 * Required environment variables (set in Netlify UI → Site configuration → Environment variables):
 *   SMTP_HOST   — e.g. secure.emailsrvr.com
 *   SMTP_PORT   — e.g. 587
 *   SMTP_USER   — e.g. sales@gttrailers.co.nz
 *   SMTP_PASS   — Rackspace mailbox password
 *   NOTIFY_TO   — e.g. sales@gttrailers.co.nz
 */

exports.handler = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid payload' };
  }

  const { data, form_name: formName } = body.payload || {};

  if (!data) {
    return { statusCode: 400, body: 'No form data found' };
  }

  const firstName = data['first-name'] || '';
  const lastName  = data['last-name']  || '';
  const email     = data['email']      || '';
  const phone     = data['phone']      || '';
  const message   = data['message']   || '';
  const fullName  = `${firstName} ${lastName}`.trim();

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'secure.emailsrvr.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const notifyTo   = process.env.NOTIFY_TO || 'sales@gttrailers.co.nz';
  const fromSender = `"GT Trailers Website" <${process.env.SMTP_USER}>`;

  // ── 1. Notification email to sales team ──────────────────────────────────
  await transporter.sendMail({
    from:    fromSender,
    to:      notifyTo,
    replyTo: email || undefined,
    subject: `New website enquiry from ${fullName || 'a visitor'}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#1d3557;padding:24px 32px;">
          <img src="https://gttrailers.co.nz/images/GT-TRAILERS-LOGO.webp"
               alt="GT Trailers" height="50" style="display:block;">
        </div>
        <div style="padding:32px;background:#f5f5f5;">
          <h2 style="color:#1d3557;margin-top:0;">New Website Enquiry</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px 12px;font-weight:bold;width:120px;vertical-align:top;">Name</td>
              <td style="padding:8px 12px;">${fullName}</td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Email</td>
              <td style="padding:8px 12px;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Phone</td>
              <td style="padding:8px 12px;"><a href="tel:${phone}">${phone}</a></td>
            </tr>
            <tr style="background:#fff;">
              <td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Message</td>
              <td style="padding:8px 12px;white-space:pre-wrap;">${message}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;font-weight:bold;vertical-align:top;">Form</td>
              <td style="padding:8px 12px;">${formName}</td>
            </tr>
          </table>
          <p style="margin-top:24px;font-size:13px;color:#666;">
            Hit Reply to respond directly to the customer.
          </p>
        </div>
        <div style="padding:16px 32px;background:#1d3557;color:rgba(255,255,255,0.5);font-size:12px;">
          GT Trailers &mdash; 305D Neilson Street, Onehunga, Auckland 1061
        </div>
      </div>
    `,
  });

  // ── 2. Auto-reply to customer (only if email address provided) ────────────
  if (email) {
    await transporter.sendMail({
      from:    `"GT Trailers" <${process.env.SMTP_USER}>`,
      to:      email,
      subject: `Thanks for your enquiry — GT Trailers`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#1d3557;padding:24px 32px;">
            <img src="https://gttrailers.co.nz/images/GT-TRAILERS-LOGO.webp"
                 alt="GT Trailers" height="50" style="display:block;">
          </div>
          <div style="padding:32px;background:#f5f5f5;">
            <h2 style="color:#1d3557;margin-top:0;">Thanks for getting in touch, ${firstName}!</h2>
            <p>We've received your enquiry and one of our team will be in touch with you shortly.</p>
            <p>In the meantime, if you need to speak with us urgently you can reach us on:</p>
            <ul>
              <li><strong>Phone:</strong> <a href="tel:096367437">09 636 7437</a></li>
              <li><strong>Email:</strong> <a href="mailto:sales@gttrailers.co.nz">sales@gttrailers.co.nz</a></li>
              <li><strong>Hours:</strong> Mon – Fri, 7.30am – 4.30pm</li>
            </ul>
            <p style="color:#666;font-size:13px;border-top:1px solid #ddd;margin-top:24px;padding-top:16px;">
              Your message:<br>
              <em style="white-space:pre-wrap;">${message}</em>
            </p>
          </div>
          <div style="padding:16px 32px;background:#1d3557;color:rgba(255,255,255,0.5);font-size:12px;">
            GT Trailers &mdash; 305D Neilson Street, Onehunga, Auckland 1061 &mdash;
            <a href="https://gttrailers.co.nz" style="color:rgba(255,255,255,0.5);">gttrailers.co.nz</a>
          </div>
        </div>
      `,
    });
  }

  return { statusCode: 200 };
};
