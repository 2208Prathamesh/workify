const nodemailer   = require('nodemailer');
const SmtpSettings = require('../models/SmtpSettings');

/**
 * Creates a nodemailer transporter.
 * Priority: DB SMTP settings → Ethereal (dev-only fallback)
 */
async function getTransporter() {
  try {
    const settings = await SmtpSettings.findOne().lean();
    if (settings?.host && settings?.username && settings?.password && settings.password !== '••••••••') {
      console.log(`[SMTP] Using configured SMTP: ${settings.host}:${settings.port}`);
      return {
        transporter: nodemailer.createTransport({
          host:   settings.host,
          port:   settings.port || 587,
          secure: !!settings.secure,
          auth:   { user: settings.username, pass: settings.password },
        }),
        from:       `"${settings.sender_name || 'Workify'}" <${settings.sender_email || settings.username}>`,
        isEthereal: false,
      };
    }
  } catch (err) {
    console.warn('[SMTP] Could not read DB settings, falling back to Ethereal:', err.message);
  }

  // Fallback: Ethereal (only in development)
  if (process.env.NODE_ENV === 'production') {
    console.error('[SMTP] No SMTP configured in production! Emails will not be sent.');
    return null;
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });
    console.log(`[SMTP] Using Ethereal test SMTP (${testAccount.user})`);
    return {
      transporter,
      from:       '"Workify (Dev)" <notifications@workify.dev>',
      isEthereal: true,
    };
  } catch (err) {
    console.error('[SMTP] Failed to create Ethereal fallback:', err.message);
    return null;
  }
}

/**
 * Wraps a message body in Workify branded HTML envelope.
 */
function wrapTemplate(htmlMsg) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #4CAF50, #2E7D32); padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 1px;">Workify</h1>
        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px;">Find Work. Hire Fast.</p>
      </div>
      <div style="padding: 28px 32px; color: #333; line-height: 1.7;">
        ${htmlMsg}
      </div>
      <div style="background: #f9f9f9; padding: 16px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee;">
        <p style="margin: 0 0 4px">You received this email because you are registered on Workify.</p>
        <p style="margin: 0">Please do not reply directly to this automated email.</p>
      </div>
    </div>
  `;
}

/**
 * Sends an email with Workify wrapper.
 */
async function sendEmail(to, subject, htmlMsg) {
  if (!to || !to.includes('@')) {
    console.log(`[SMTP] Skipped invalid recipient: ${to}`);
    return { ok: false };
  }

  const ctx = await getTransporter();
  if (!ctx) return { ok: false };

  try {
    const info = await ctx.transporter.sendMail({
      from:    ctx.from,
      to,
      subject,
      html:    wrapTemplate(htmlMsg),
    });

    console.log(`[SMTP] Message sent: ${info.messageId}`);
    const previewUrl = ctx.isEthereal ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) console.log(`[SMTP] Preview URL: ${previewUrl}`);

    return { ok: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[SMTP] Error sending to ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

/**
 * Sends a raw HTML email WITHOUT the Workify wrapper (for admin custom emails).
 */
async function sendRawEmail(to, subject, html) {
  if (!to || !to.includes('@')) return { ok: false };

  const ctx = await getTransporter();
  if (!ctx) return { ok: false, error: 'SMTP not configured' };

  try {
    const info = await ctx.transporter.sendMail({ from: ctx.from, to, subject, html });
    console.log(`[SMTP] Raw message sent: ${info.messageId}`);
    const previewUrl = ctx.isEthereal ? nodemailer.getTestMessageUrl(info) : null;
    return { ok: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[SMTP] Raw send error:`, err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { sendEmail, sendRawEmail, wrapTemplate };
