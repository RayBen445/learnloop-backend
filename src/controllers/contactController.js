/**
 * Contact Form Controller
 * 
 * Handles contact form submissions via email.
 */

import { sendEmail } from '../utils/emailService.js';

// Maximum length constraints
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 255;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 5000;

/**
 * Escape HTML special characters to prevent XSS in email templates
 * 
 * @param {string} text - Text to escape
 * @returns {string} HTML-safe text
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Submit contact form
 * 
 * POST /api/contact
 * 
 * Body:
 * - name: string (required, max 100 chars)
 * - email: string (required, valid email format, max 255 chars)
 * - subject: string (required, max 200 chars)
 * - message: string (required, max 5000 chars)
 * 
 * Sends email to CONTACT_EMAIL_TO address.
 * Does not store messages in database.
 */
export async function submitContactForm(req, res) {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'All fields (name, email, subject, message) are required'
      });
    }

    // Trim inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    // Validate non-empty after trimming
    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      return res.status(400).json({
        error: 'Invalid input',
        message: 'All fields must contain non-empty values'
      });
    }

    // Validate length constraints
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        error: 'Invalid input',
        message: `Name must not exceed ${MAX_NAME_LENGTH} characters`
      });
    }

    if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      return res.status(400).json({
        error: 'Invalid input',
        message: `Email must not exceed ${MAX_EMAIL_LENGTH} characters`
      });
    }

    if (trimmedSubject.length > MAX_SUBJECT_LENGTH) {
      return res.status(400).json({
        error: 'Invalid input',
        message: `Subject must not exceed ${MAX_SUBJECT_LENGTH} characters`
      });
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({
        error: 'Invalid input',
        message: `Message must not exceed ${MAX_MESSAGE_LENGTH} characters`
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        error: 'Invalid email',
        message: 'Please provide a valid email address'
      });
    }

    // Check for CONTACT_EMAIL_TO environment variable
    const contactEmailTo = process.env.CONTACT_EMAIL_TO;
    if (!contactEmailTo) {
      console.error('CONTACT_EMAIL_TO environment variable not set');
      return res.status(500).json({
        error: 'Configuration error',
        message: 'Contact form is not properly configured. Please try again later.'
      });
    }

    // Escape HTML to prevent XSS in email
    const escapedName = escapeHtml(trimmedName);
    const escapedEmail = escapeHtml(trimmedEmail);
    const escapedSubject = escapeHtml(trimmedSubject);
    const escapedMessage = escapeHtml(trimmedMessage);

    // Prepare email content
    const emailSubject = `[LearnLoop Contact] ${trimmedSubject}`;
    const emailText = `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\nMessage:\n${trimmedMessage}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Contact Form Submission</h2>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${escapedName}</p>
          <p><strong>Email:</strong> ${escapedEmail}</p>
        </div>
        <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h3 style="color: #555; margin-top: 0;">Message:</h3>
          <p style="white-space: pre-wrap;">${escapedMessage}</p>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
        <p style="color: #666; font-size: 12px;">
          To reply to this message, click reply or send an email to: ${escapedEmail}
        </p>
      </div>
    `;

    // Send email using emailService
    try {
      const result = await sendEmail({
        to: contactEmailTo,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
        replyTo: trimmedEmail
      });

      if (!result.success) {
        console.error('Error sending contact form email:', result.error);
        return res.status(500).json({
          error: 'Email sending failed',
          message: 'Unable to send your message at this time. Please try again later.'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Your message has been sent successfully. We will get back to you soon.'
      });

    } catch (emailError) {
      console.error('Error sending contact form email:', emailError);
      
      return res.status(500).json({
        error: 'Email sending failed',
        message: 'Unable to send your message at this time. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
}
