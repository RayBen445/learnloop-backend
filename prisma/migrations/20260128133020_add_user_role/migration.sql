-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SYSTEM', 'BOT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'USER';
