const nodemailer = require('nodemailer');
const config = require('../config/env');

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

const sendVerificationEmail = async (email, token, name) => {
  const verificationUrl = `${config.frontendUrl}/verify-email/${token}`;

  const mailOptions = {
    from: `"IdeaConnect" <${config.smtp.user}>`,
    to: email,
    subject: 'Verify Your Email - IdeaConnect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to IdeaConnect, ${name}!</h2>
        <p>Thank you for registering. Please verify your email address to get started.</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Verify Email</a>
        <p>Or copy this link: ${verificationUrl}</p>
        <p>This link expires in 24 hours.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendResetEmail = async (email, token, name) => {
  const resetUrl = `${config.frontendUrl}/reset-password/${token}`;

  const mailOptions = {
    from: `"IdeaConnect" <${config.smtp.user}>`,
    to: email,
    subject: 'Reset Your Password - IdeaConnect',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset</h2>
        <p>Hello ${name},</p>
        <p>You requested to reset your password. Click the button below to proceed.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

const sendNotificationEmail = async (email, subject, message) => {
  const mailOptions = {
    from: `"IdeaConnect" <${config.smtp.user}>`,
    to: email,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">${subject}</h2>
        <p>${message}</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendResetEmail,
  sendNotificationEmail,
};
