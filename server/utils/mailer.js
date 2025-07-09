const nodemailer = require('nodemailer');

// Use Gmail's built-in service configuration
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  debug: true,
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
 */
async function sendNoteNotification({ to, subject, html }) {
  await transporter.sendMail({
    from: `"VOICE AI" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
}

module.exports = { sendNoteNotification };