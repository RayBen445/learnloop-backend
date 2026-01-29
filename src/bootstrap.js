/**
 * Bootstrap Script
 * 
 * Creates system users on server startup.
 * Must be idempotent - safe to run multiple times.
 */

import bcrypt from 'bcrypt';
import prisma from '../prisma.js';

const SALT_ROUNDS = 10;

// Weak passwords to warn about in production
const WEAK_PASSWORDS = [
  'change-this-in-production',
  'REPLACE_WITH_STRONG_PASSWORD_BEFORE_DEPLOYING',
  'password',
  'admin',
  'test',
  '123456'
];

/**
 * Validate password strength for production environments
 * 
 * @param {string} password - Password to validate
 * @param {string} userType - Type of user (for logging)
 * @returns {boolean} True if password is acceptable
 */
function validateProductionPassword(password, userType) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) {
    return true; // Allow any password in development
  }
  
  // Check for weak/default passwords
  if (WEAK_PASSWORDS.includes(password)) {
    console.error(`❌ CRITICAL: Default/weak password detected for ${userType} in PRODUCTION!`);
    console.error(`   Please update the password in your environment variables before deploying.`);
    return false;
  }
  
  // Enforce minimum length in production
  if (password.length < 16) {
    console.error(`❌ CRITICAL: ${userType} password is too short for PRODUCTION (min 16 chars)!`);
    return false;
  }
  
  return true;
}

/**
 * Bootstrap system users (SYSTEM and BOT)
 * 
 * Creates two special users if they don't exist:
 * 1. System user (from SYSTEM_USER_EMAIL env)
 *    - username: from SYSTEM_USER_USERNAME env (default: "LearnLoop")
 *    - role: SYSTEM
 *    - emailVerified: true
 * 
 * 2. Bot user (from BOT_USER_EMAIL env)
 *    - username: from BOT_USER_USERNAME env (default: "LearnLoop Bot")
 *    - role: BOT
 *    - emailVerified: true
 * 
 * Both users are exempt from rate limiting.
 * Passwords are hashed using bcrypt.
 * Function is idempotent - safe to run multiple times.
 */
export async function bootstrapSystemUsers() {
  try {
    console.log('Starting system users bootstrap...');

    // Get environment variables
    const systemUserEmail = process.env.SYSTEM_USER_EMAIL;
    const systemUserPassword = process.env.SYSTEM_USER_PASSWORD;
    const systemUserUsername = process.env.SYSTEM_USER_USERNAME || 'LearnLoop';
    const botUserEmail = process.env.BOT_USER_EMAIL;
    const botUserPassword = process.env.BOT_USER_PASSWORD;
    const botUserUsername = process.env.BOT_USER_USERNAME || 'LearnLoop Bot';

    // Validate required environment variables for system user
    if (!systemUserEmail || !systemUserPassword) {
      console.warn('SYSTEM_USER_EMAIL or SYSTEM_USER_PASSWORD not set. Skipping system user creation.');
    } else {
      // Validate password strength in production
      if (!validateProductionPassword(systemUserPassword, 'SYSTEM user')) {
        console.error('System user creation aborted due to weak password in production.');
      } else {
        // Check if system user already exists by email
        const existingSystemUser = await prisma.user.findUnique({
          where: { email: systemUserEmail }
        });

        if (existingSystemUser) {
          console.log(`System user already exists: ${systemUserEmail}`);
        } else {
          // Check if username is already taken
          const existingUsername = await prisma.user.findUnique({
            where: { username: systemUserUsername }
          });

          if (existingUsername) {
            console.error(`❌ Cannot create system user: username "${systemUserUsername}" is already taken.`);
            console.error(`   Please set SYSTEM_USER_USERNAME environment variable to a different value.`);
          } else {
            // Create system user
            const hashedPassword = await bcrypt.hash(systemUserPassword, SALT_ROUNDS);
            
            await prisma.user.create({
              data: {
                email: systemUserEmail,
                username: systemUserUsername,
                hashedPassword,
                role: 'SYSTEM',
                emailVerified: true,
                isVerified: true
              }
            });

            console.log(`✓ Created system user: ${systemUserEmail} (username: ${systemUserUsername})`);
          }
        }
      }
    }

    // Validate bot user environment variables
    if (!botUserEmail || !botUserPassword) {
      console.warn('BOT_USER_EMAIL or BOT_USER_PASSWORD not set. Skipping bot user creation.');
    } else {
      // Validate password strength in production
      if (!validateProductionPassword(botUserPassword, 'BOT user')) {
        console.error('Bot user creation aborted due to weak password in production.');
      } else {
        // Check if bot user already exists by email
        const existingBotUser = await prisma.user.findUnique({
          where: { email: botUserEmail }
        });

        if (existingBotUser) {
          console.log(`Bot user already exists: ${botUserEmail}`);
        } else {
          // Check if username is already taken
          const existingUsername = await prisma.user.findUnique({
            where: { username: botUserUsername }
          });

          if (existingUsername) {
            console.error(`❌ Cannot create bot user: username "${botUserUsername}" is already taken.`);
            console.error(`   Please set BOT_USER_USERNAME environment variable to a different value.`);
          } else {
            // Create bot user
            const hashedPassword = await bcrypt.hash(botUserPassword, SALT_ROUNDS);
            
            await prisma.user.create({
              data: {
                email: botUserEmail,
                username: botUserUsername,
                hashedPassword,
                role: 'BOT',
                emailVerified: true,
                isVerified: true
              }
            });

            console.log(`✓ Created bot user: ${botUserEmail} (username: ${botUserUsername})`);
          }
        }
      }
    }

    console.log('System users bootstrap completed successfully.');

  } catch (error) {
    console.error('Error during system users bootstrap:', error);
    // Don't throw - allow server to start even if bootstrap fails
    // This prevents startup failures due to database issues
  }
}
