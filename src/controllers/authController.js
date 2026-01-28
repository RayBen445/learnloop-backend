/**
 * Authentication Controller
 * 
 * Handles user registration and login.
 * Phase 2: Authentication only - no post/comment functionality yet.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma.js';
import {
  generateVerificationToken,
  getTokenExpiration,
  isTokenExpired,
  sendVerificationEmail,
  sendVerificationSuccessEmail
} from '../utils/emailVerification.js';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Register a new user
 * 
 * Requirements:
 * - Unique email
 * - Unique username
 * - Password must be at least 8 characters
 * - Password is hashed before storage
 * - Creates unverified user (isVerified: false)
 * - Generates verification token
 * - Sends verification email
 * - No auto-login (token not returned)
 */
export async function register(req, res) {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        error: 'Email, username, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format'
      });
    }

    // Validate username (alphanumeric and underscores only, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
      });
    }

    // Reject weak passwords
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`
      });
    }

    // Check for common weak patterns
    if (/^(.)\1+$/.test(password)) {
      return res.status(400).json({
        error: 'Password is too weak (repeated characters)'
      });
    }

    if (/^(password|12345678|qwerty)$/i.test(password)) {
      return res.status(400).json({
        error: 'Password is too weak (common password)'
      });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already taken'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with isVerified: false
    const user = await prisma.user.create({
      data: {
        email,
        username,
        hashedPassword,
        learningScore: 0,
        isVerified: false
      },
      select: {
        id: true,
        email: true,
        username: true,
        learningScore: true,
        isVerified: true,
        createdAt: true
      }
    });

    // Generate verification token
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiration(24); // 24 hours

    // Store verification token
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    // Send verification email
    await sendVerificationEmail(email, username, token);

    // Return user without JWT token (no auto-login)
    return res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Internal server error during registration'
    });
  }
}

/**
 * Login user
 * 
 * Requirements:
 * - Email + password authentication
 * - Returns JWT token on success
 * - Token includes userId only
 * - Allows login for unverified users (they can read but not write)
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token (userId only)
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Return token and user info
    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        learningScore: user.learningScore,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error during login'
    });
  }
}

/**
 * Verify email with token
 * 
 * Requirements:
 * - Validate verification token
 * - Check token expiration
 * - Mark user as verified
 * - Invalidate token after use
 */
export async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    // Validation
    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required'
      });
    }

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!verificationToken) {
      return res.status(400).json({
        error: 'Invalid verification token'
      });
    }

    // Check if token has expired
    if (isTokenExpired(verificationToken.expiresAt)) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id }
      });

      return res.status(400).json({
        error: 'Verification token has expired. Please request a new one.'
      });
    }

    // Check if user is already verified
    if (verificationToken.user.isVerified) {
      // Delete token since user is already verified
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id }
      });

      return res.status(200).json({
        message: 'Email is already verified'
      });
    }

    // Mark user as verified and delete token (transaction for data consistency)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isVerified: true }
      }),
      prisma.verificationToken.delete({
        where: { id: verificationToken.id }
      })
    ]);

    // Send success email
    await sendVerificationSuccessEmail(
      verificationToken.user.email,
      verificationToken.user.username
    );

    return res.status(200).json({
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      error: 'Internal server error during email verification'
    });
  }
}

/**
 * Resend verification email
 * 
 * Requirements:
 * - Find user by email
 * - Check if already verified
 * - Delete old tokens
 * - Generate new verification token
 * - Send new verification email
 */
export async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        message: 'If the email exists, a verification link has been sent.'
      });
    }

    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        error: 'Email is already verified'
      });
    }

    // Delete any existing verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate new verification token
    const token = generateVerificationToken();
    const expiresAt = getTokenExpiration(24); // 24 hours

    // Store new verification token
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt
      }
    });

    // Send verification email
    await sendVerificationEmail(user.email, user.username, token);

    return res.status(200).json({
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({
      error: 'Internal server error while sending verification email'
    });
  }
}
