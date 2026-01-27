/**
 * Prisma Client Configuration
 * 
 * This file provides a single, clean import point for the Prisma Client.
 * Import this file wherever you need database access:
 * 
 * import prisma from './prisma.js';
 * 
 * The client is configured to:
 * - Use the DATABASE_URL from environment variables (via adapter)
 * - Log errors only (can be adjusted for development)
 * 
 * Note: Using @prisma/adapter-pg for PostgreSQL connection pooling.
 */

import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma Client with adapter
const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

export default prisma;

