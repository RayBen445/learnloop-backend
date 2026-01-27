/**
 * Authentication Controller
 * 
 * Handles user registration and login.
 * Phase 2: Authentication only - no post/comment functionality yet.
 */

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../../prisma.js';

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

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        hashedPassword,
        learningScore: 0
      },
      select: {
        id: true,
        email: true,
        username: true,
        learningScore: true,
        createdAt: true
      }
    });

    // Return user without token (no auto-login)
    return res.status(201).json({
      message: 'User registered successfully',
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
        learningScore: user.learningScore
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Internal server error during login'
    });
  }
}
