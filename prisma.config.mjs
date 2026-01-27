/**
 * Prisma Configuration for Migrations
 * 
 * Prisma 7+ requires database connection URL to be in a separate config file
 * instead of in schema.prisma. This file is used by Prisma CLI commands:
 * - prisma migrate deploy
 * - prisma migrate dev
 * - prisma db push
 * - prisma generate
 * 
 * The DATABASE_URL environment variable must be set before running these commands.
 * On Render and other production platforms, this is injected automatically.
 * 
 * For local development, set DATABASE_URL in your .env file.
 */

export default {
  datasource: {
    url: process.env.DATABASE_URL
  }
};
