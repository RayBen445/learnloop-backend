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
  sendVerificationSuccessEmail,
  hashToken
} from '../utils/emailVerification.js';

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
// Dummy hash for timing attack prevention (bcrypt hash of "dummy_password_for_timing_attack_prevention")
const DUMMY_HASH = '$2b$10$LXvkVgpvb0MHrKXQYUuqkeekDAntWE3/Ja4kO6/1IFiK6xGO4RLyy';

/**
 * Register a new user
 * 
 * Requirements:
 * - Unique email
 * - Unique username
 * - Password must be at least 8 characters
 * - Password is hashed before storage
 * 
 * Feature Flag: REQUIRE_EMAIL_VERIFICATION
 * - When "true": Creates unverified user (isVerified: false), generates token, sends verification email
 * - When not "true" (default): Auto-verifies user (isVerified: true), no email sent
 * 
 * - No auto-login (token not returned in either case)
 */
export async function register(req, res) {
  try {
    const { email, username, password } = req.body;

    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({
        error: 'Email, username, and password are required',
        message: 'Please provide all required fields to create your account.',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
        message: 'Please enter a valid email address.',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate username (alphanumeric and underscores only, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3-30 characters and contain only letters, numbers, and underscores',
        message: 'Please choose a username between 3-30 characters using only letters, numbers, and underscores.',
        code: 'INVALID_USERNAME'
      });
    }

    // Reject weak passwords
    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
        message: `Please choose a stronger password with at least ${MIN_PASSWORD_LENGTH} characters.`,
        code: 'WEAK_PASSWORD'
      });
    }

    // Check for common weak patterns
    if (/^(.)\1+$/.test(password)) {
      return res.status(400).json({
        error: 'Password is too weak (repeated characters)',
        message: 'Please choose a stronger password without repeated characters.',
        code: 'WEAK_PASSWORD'
      });
    }

    if (/^(password|12345678|qwerty)$/i.test(password)) {
      return res.status(400).json({
        error: 'Password is too weak (common password)',
        message: 'This password is too common. Please choose a unique, stronger password.',
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return res.status(409).json({
        error: 'Email already registered',
        message: 'This email is already in use. Please use a different email or try logging in.',
        code: 'EMAIL_EXISTS'
      });
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUsername) {
      return res.status(409).json({
        error: 'Username already taken',
        message: 'This username is already in use. Please choose a different username.',
        code: 'USERNAME_EXISTS'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Feature flag: REQUIRE_EMAIL_VERIFICATION controls whether email verification is required
    // When disabled (not "true"), auto-verify users on registration
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    const emailVerified = !requireEmailVerification;

    // Create user with isVerified and emailVerified
    const user = await prisma.user.create({
      data: {
        email,
        username,
        hashedPassword,
        learningScore: 0,
        isVerified: emailVerified,
        emailVerified: emailVerified
      },
      select: {
        id: true,
        email: true,
        username: true,
        learningScore: true,
        isVerified: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Only send verification email if email verification is required
    if (requireEmailVerification) {
      // Delete any existing verification tokens for this user (ensure one active token)
      await prisma.verificationToken.deleteMany({
        where: { userId: user.id }
      });

      // Generate verification token
      const token = generateVerificationToken();
      const hashedToken = hashToken(token);
      const expiresAt = getTokenExpiration(15); // 15 minutes

      // Store hashed verification token
      await prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          expiresAt
        }
      });

      // Send verification email with plain token
      await sendVerificationEmail(email, username, token);

      // Return user without JWT token (no auto-login)
      return res.status(201).json({
        message: 'Verification email sent. Please check your inbox.',
        user
      });
    }

    // If verification is disabled, return success message
    return res.status(201).json({
      message: 'Registration successful. You can now log in.',
      user
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle unique constraint violation (race condition)
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(409).json({
          error: 'Email already registered',
          message: 'This email is already in use. Please use a different email or try logging in.',
          code: 'EMAIL_EXISTS'
        });
      }
      if (field === 'username') {
        return res.status(409).json({
          error: 'Username already taken',
          message: 'This username is already in use. Please choose a different username.',
          code: 'USERNAME_EXISTS'
        });
      }
    }
    
    return res.status(500).json({
      error: 'Internal server error during registration',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * Login user
 * 
 * Requirements:
 * - Email + password authentication
 * 
 * Feature Flag: REQUIRE_EMAIL_VERIFICATION
 * - When "true": Email must be verified (emailVerified: true) to login
 * - When not "true" (default): Email verification check is skipped
 * 
 * - Returns JWT token on success
 * - Token includes userId only
 */
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required',
        message: 'Please provide both email and password to log in.',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Timing attack prevention: Always perform hash comparison
    // If user not found, use a dummy hash to simulate the work
    const targetHash = user ? user.hashedPassword : DUMMY_HASH;
    const isValidPassword = await bcrypt.compare(password, targetHash);

    if (!user || !isValidPassword) {
      return res.status(401).json({
        error: 'Invalid email or password',
        message: 'The email or password you entered is incorrect. Please try again.',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Feature flag: REQUIRE_EMAIL_VERIFICATION controls whether email verification is required
    // Only check email verification if the feature flag is enabled
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    
    if (requireEmailVerification && !user.emailVerified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: 'Please verify your email before logging in. Check your inbox for the verification link.',
        code: 'EMAIL_NOT_VERIFIED'
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
        isVerified: user.isVerified,
        emailVerified: user.emailVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error during login',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * Verify email with token
 * 
 * Requirements:
 * - Validate verification token (hashed)
 * - Check token expiration
 * - Check if token was already used
 * - Mark user as verified
 * - Mark token as used (set usedAt)
 */
export async function verifyEmail(req, res) {
  try {
    // Support both query param (GET) and body (POST)
    const token = req.query.token || req.body.token;

    // Validation
    if (!token) {
      return res.status(400).json({
        error: 'Verification token is required',
        message: 'Please provide a verification token from your email.',
        code: 'MISSING_TOKEN'
      });
    }

    // Hash the token to compare with stored hash
    const hashedToken = hashToken(token);

    // Find verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token: hashedToken },
      include: { user: true }
    });

    if (!verificationToken) {
      return res.status(400).json({
        error: 'Invalid verification token',
        message: 'This verification link is invalid. Please request a new verification email.',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token was already used
    if (verificationToken.usedAt) {
      return res.status(200).json({
        message: 'Email is already verified'
      });
    }

    // Check if token has expired
    if (isTokenExpired(verificationToken.expiresAt)) {
      return res.status(400).json({
        error: 'Verification token has expired',
        message: 'This verification link has expired. Please request a new verification email.',
        code: 'TOKEN_EXPIRED'
      });
    }

    // Check if user is already verified
    if (verificationToken.user.emailVerified) {
      // Mark token as used
      await prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() }
      });

      return res.status(200).json({
        message: 'Email is already verified'
      });
    }

    // Mark user as verified and mark token as used (transaction for data consistency)
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { 
          isVerified: true,
          emailVerified: true 
        }
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() }
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
      error: 'Internal server error during email verification',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
}

/**
 * Resend verification email
 * 
 * Requirements:
 * - Find user by email
 * - Check if already verified
 * - Delete old tokens (ensure one active token per user)
 * - Generate new verification token (hashed)
 * - Send new verification email
 */
export async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
        message: 'Please provide your email address to resend the verification email.',
        code: 'MISSING_EMAIL'
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
    if (user.emailVerified) {
      return res.status(400).json({
        error: 'Email is already verified',
        message: 'Your email has already been verified. You can log in now.',
        code: 'ALREADY_VERIFIED'
      });
    }

    // Delete any existing verification tokens for this user (ensure one active token)
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate new verification token
    const token = generateVerificationToken();
    const hashedToken = hashToken(token);
    const expiresAt = getTokenExpiration(15); // 15 minutes

    // Store new hashed verification token
    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt
      }
    });

    // Send verification email with plain token
    await sendVerificationEmail(user.email, user.username, token);

    return res.status(200).json({
      message: 'Verification email sent. Please check your inbox.'
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    return res.status(500).json({
      error: 'Internal server error while sending verification email',
      message: 'An unexpected error occurred. Please try again later.',
      code: 'SERVER_ERROR'
    });
  }
}
