const nodemailer = require('nodemailer');
const config = require('../config/env');

// If no real SMTP credentials are configured, emails are skipped in dev/test
// (they're logged instead of sent). Set SMTP_* env vars to enable real sending.
// Placeholder values from .env.example ("your-*", "sk-*") don't count as configured.
const isPlaceholder = (v) =>
  !v || /^your-|^sk-|^change-|placeholder/i.test(String(v));

const smtpConfigured = Boolean(
  config.smtp.host &&
    !isPlaceholder(config.smtp.user) &&
    !isPlaceholder(config.smtp.pass)
);

let transporter = null;
if (smtpConfigured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: false,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
}

const deliver = async (email, subject, html, devUrl) => {
  if (!transporter) {
    // Demo/test mode — don't attempt a real send, just log it.
    console.log(`[email:skipped] to=${email} subject="${subject}" (SMTP not configured)`);
    // Surface action URLs in demo mode so flows remain testable without SMTP
    if (devUrl) {
      console.log(`[email:demo-link] ${devUrl}`);
    }
    return { skipped: true };
  }
  return transporter.sendMail({
    from: `"IdeaConnect" <${config.smtp.user}>`,
    to: email,
    subject,
    html,
  });
};

/**
 * A mail client cannot open a custom-scheme link, and the web router cannot
 * read a query param, so these emails carry BOTH: the web link is the primary
 * button, the app deep link is a secondary link for someone who has the app
 * installed. The token is a path segment for the web (which routes
 * /reset-password/:token) and a query param for the app (which reads it via
 * useLocalSearchParams).
 */
const buildVerificationUrls = (frontendUrl, scheme, token) => {
  const web = `${frontendUrl}/verify-email/${token}`;
  return { web, app: scheme ? `${scheme}://verify-email?token=${token}` : web };
};

const buildResetUrls = (frontendUrl, scheme, token) => {
  const web = `${frontendUrl}/reset-password/${token}`;
  return { web, app: scheme ? `${scheme}://reset-password?token=${token}` : web };
};

const appLinkBlock = (label, appUrl, webUrl) => `
        <p style="margin: 24px 0 8px;">
          <a href="${appUrl}" style="color: #6366f1;">${label}</a>
        </p>
        <p style="font-size: 12px; color: #6b7280; margin: 0;">
          Not using the app? <a href="${webUrl}" style="color: #6b7280;">Use the web version</a>.
        </p>`;

const sendVerificationEmail = (email, token, name) => {
  const { web: verificationUrl, app: appUrl } = buildVerificationUrls(
    config.frontendUrl,
    config.mobileScheme,
    token
  );

  return deliver(
    email,
    'Verify Your Email - IdeaConnect',
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to IdeaConnect, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address to get started.</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
        ${appLinkBlock('Open in the IdeaConnect app', appUrl, verificationUrl)}
      </div>
    `,
    verificationUrl
  );
};

const sendResetEmail = (email, token, name) => {
  const { web: resetUrl, app: appUrl } = buildResetUrls(
    config.frontendUrl,
    config.mobileScheme,
    token
  );

  return deliver(
    email,
    'Reset Your Password - IdeaConnect',
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the button below to proceed.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        ${appLinkBlock('Open in the IdeaConnect app', appUrl, resetUrl)}
      </div>
    `,
    resetUrl
  );
};

const sendNotificationEmail = (email, subject, message) =>
  deliver(
    email,
    subject,
    `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">${subject}</h2>
        <p>${message}</p>
      </div>
    `
  );

module.exports = {
  sendVerificationEmail,
  sendResetEmail,
  sendNotificationEmail,
  buildVerificationUrls,
  buildResetUrls,
};
