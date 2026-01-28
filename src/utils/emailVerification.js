/**
 * Email Verification Utilities
 * 
 * Provides token generation and email sending functionality for email verification.
 * For development/testing, emails are logged to console instead of being sent.
 */

import crypto from 'crypto';

/**
 * Generate a secure random verification token
 * 
 * @returns {string} A 32-character hexadecimal token
 */
export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Calculate token expiration time
 * 
 * @param {number} hours - Hours until expiration (default: 24)
 * @returns {Date} Expiration timestamp
 */
export function getTokenExpiration(hours = 24) {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + hours);
  return expiresAt;
}

/**
 * Check if a token has expired
 * 
 * @param {Date} expiresAt - Token expiration timestamp
 * @returns {boolean} True if token has expired
 */
export function isTokenExpired(expiresAt) {
  return new Date() > new Date(expiresAt);
}

/**
 * Send verification email
 * 
 * In production, this would integrate with an email service (e.g., SendGrid, AWS SES).
 * For development, emails are logged to console.
 * 
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @param {string} token - Verification token
 * @returns {Promise<boolean>} True if email was "sent" successfully
 */
export async function sendVerificationEmail(email, username, token) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  // In production, replace this with actual email sending
  // Example: await emailService.send(...)
  
  console.log('\n========== EMAIL VERIFICATION ==========');
  console.log(`To: ${email}`);
  console.log(`Subject: Verify your LearnLoop account`);
  console.log('---');
  console.log(`Hi ${username},`);
  console.log('');
  console.log('Thank you for registering with LearnLoop!');
  console.log('');
  console.log('Please verify your email address by clicking the link below:');
  console.log(verificationUrl);
  console.log('');
  console.log('This link will expire in 24 hours.');
  console.log('');
  console.log('If you did not create an account, please ignore this email.');
  console.log('');
  console.log('Best regards,');
  console.log('The LearnLoop Team');
  console.log('========================================\n');
  
  return true;
}

/**
 * Send verification success email
 * 
 * Notifies user that their email has been verified.
 * 
 * @param {string} email - Recipient email address
 * @param {string} username - User's username
 * @returns {Promise<boolean>} True if email was "sent" successfully
 */
export async function sendVerificationSuccessEmail(email, username) {
  console.log('\n========== EMAIL VERIFIED ==========');
  console.log(`To: ${email}`);
  console.log(`Subject: Email verified successfully`);
  console.log('---');
  console.log(`Hi ${username},`);
  console.log('');
  console.log('Your email address has been verified successfully!');
  console.log('');
  console.log('You can now access all features of LearnLoop.');
  console.log('');
  console.log('Best regards,');
  console.log('The LearnLoop Team');
  console.log('====================================\n');
  
  return true;
}
