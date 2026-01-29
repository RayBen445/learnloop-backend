/**
 * Email Service Module
 * 
 * Provides a modular interface for sending emails via SMTP.
 * Can be easily replaced with other services (SendGrid, AWS SES, Resend, etc.)
 * 
 * Configuration via environment variables:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
 * - SMTP_PORT: SMTP server port (e.g., 587 for TLS)
 * - SMTP_USER: SMTP username/email
 * - SMTP_PASSWORD: SMTP password/app password
 * - SMTP_FROM_NAME: Sender name (e.g., "Cool Shot Systems")
 * - SMTP_FROM_EMAIL: Sender email address
 */

import nodemailer from 'nodemailer';

/**
 * Create and configure SMTP transporter
 * 
 * @returns {Object|null} Nodemailer transporter or null if not configured
 */
function createTransporter() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASSWORD,
    SMTP_FROM_EMAIL
  } = process.env;

  // Check if SMTP is configured
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
    console.log('[Email Service] SMTP not configured - emails will be logged to console');
    return null;
  }

  const port = parseInt(SMTP_PORT || '587', 10);
  
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: port,
    secure: port === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASSWORD,
    },
  });

  // Use SMTP_FROM_EMAIL if configured, otherwise fall back to SMTP_USER
  transporter.fromEmail = SMTP_FROM_EMAIL || SMTP_USER;

  return transporter;
}

/**
 * Send an email
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @param {string} options.replyTo - Reply-To email address (optional)
 * @returns {Promise<Object>} Result object with success status and info
 */
export async function sendEmail({ to, subject, text, html, replyTo }) {
  const transporter = createTransporter();
  const fromName = process.env.SMTP_FROM_NAME || 'Cool Shot Systems';

  // If SMTP is not configured, log to console (development mode)
  if (!transporter) {
    console.log('\n========== EMAIL (Console Mode) ==========');
    console.log(`From: ${fromName}`);
    console.log(`To: ${to}`);
    if (replyTo) {
      console.log(`Reply-To: ${replyTo}`);
    }
    console.log(`Subject: ${subject}`);
    console.log('---');
    console.log(text);
    console.log('==========================================\n');
    
    return { success: true, mode: 'console' };
  }

  // Send email via SMTP
  try {
    const mailOptions = {
      from: `"${fromName}" <${transporter.fromEmail}>`,
      to,
      subject,
      text,
      html: html || text, // Use HTML if provided, otherwise fall back to text
    };

    // Add Reply-To header if provided
    if (replyTo) {
      mailOptions.replyTo = replyTo;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`[Email Service] Email sent successfully to ${to} - Message ID: ${info.messageId}`);
    
    return { success: true, mode: 'smtp', info };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error.message);
    console.error('[Email Service] To:', to);
    console.error('[Email Service] Subject:', subject);
    
    // Return failure but don't throw - allow app to continue
    return { success: false, mode: 'smtp', error: error.message };
  }
}

/**
 * Verify SMTP connection (optional health check)
 * 
 * @returns {Promise<boolean>} True if connection successful
 */
export async function verifyConnection() {
  const transporter = createTransporter();
  
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    console.log('[Email Service] SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP connection verification failed:', error.message);
    return false;
  }
}
