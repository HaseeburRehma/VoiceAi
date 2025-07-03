// server/utils/mailer.ts
import nodemailer from "nodemailer";

// Use Gmail's built-in service configuration for simplicity
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,             // e.g. marketing@alevdigital.com
    pass: process.env.SMTP_PASSWORD,         // Gmail App Password when 2FA is enabled
  },
  debug: true,   // show SMTP logs
});

// Verify configuration at startup
transporter.verify((error, success) => {
  if (error) {
    console.error('⚠️ SMTP transporter verification failed:', error);
  } else {
    console.log('✅ SMTP transporter is ready to send messages');
  }
});

/**
 * Send a notification email when a note is created or updated.
 * @param to - recipient email or list of emails
 * @param subject - email subject
 * @param html - email HTML body
 */
export async function sendNoteNotification({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  await transporter.sendMail({
    from: `"VOICE AI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}
