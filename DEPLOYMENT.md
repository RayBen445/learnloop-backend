# Deployment Guide

This guide explains how to deploy the **LearnLoop** application. You have two deployment options:

## Option 1: Full Vercel Deployment (Recommended for Simplicity)
- **Frontend + Backend:** Vercel (serverless functions for backend API)
- **Database:** External PostgreSQL (Neon, Supabase, or Railway)

## Option 2: Separate Deployments (Recommended for Scalability)
- **Frontend:** Vercel (best for Next.js)
- **Backend:** Render (best for Node.js + PostgreSQL)
- **Database:** Render PostgreSQL

---

## Full Vercel Deployment (Option 1)

This option deploys both the frontend and backend API to Vercel in a single deployment.

### Prerequisites
1.  **PostgreSQL Database:** Set up a PostgreSQL database on:
    - [Neon](https://neon.tech) (free tier available)
    - [Supabase](https://supabase.com) (free tier available)
    - [Railway](https://railway.app)
    - Or any other PostgreSQL provider

2.  **Get Database URL:** Copy the connection string (e.g., `postgresql://user:password@host:5432/database`)

### Deploy to Vercel

1.  **Push your code** to GitHub.

2.  **Log in to Vercel** (vercel.com) and click **"Add New..."** -> **"Project"**.

3.  **Import your repository**.

4.  **Configure Project:**
    - **Framework Preset:** Other (Vercel will auto-detect the monorepo)
    - **Root Directory:** Leave as `.` (root)
    - **Build Command:** `npm run build`
    - **Output Directory:** Leave default

5.  **Environment Variables (REQUIRED):**
    Add these in the Vercel project settings:
    ```
    DATABASE_URL=postgresql://user:password@host:5432/database
    JWT_SECRET=your-random-secret-key-here
    JWT_EXPIRES_IN=7d
    NODE_ENV=production
    ```
    
    Optional environment variables:
    ```
    ALLOWED_ORIGINS=https://your-custom-domain.com
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your-email@gmail.com
    SMTP_PASSWORD=your-app-password
    EMAIL_FROM=noreply@yourdomain.com
    ENABLE_EMAIL_VERIFICATION=true
    SYSTEM_USER_EMAIL=system@yourdomain.com
    SYSTEM_USER_PASSWORD=secure-password
    BOT_USER_EMAIL=bot@yourdomain.com
    BOT_USER_PASSWORD=secure-password
    ```

6.  **Deploy:** Click "Deploy".

7.  **Run Database Migrations:**
    After the first deployment, you need to run Prisma migrations:
    - In Vercel dashboard, go to your project
    - Click on "Settings" -> "Functions"
    - Or use Vercel CLI: `vercel env pull && npx prisma migrate deploy`

8.  **URL:** Vercel will give you a URL (e.g., `your-project.vercel.app`).
    - Frontend: `https://your-project.vercel.app`
    - Backend API: `https://your-project.vercel.app/api/*`
    - Health Check: `https://your-project.vercel.app/health`

### How It Works

The `vercel.json` configuration:
- Deploys the Next.js frontend from the `/frontend` directory
- Deploys the Express backend as a serverless function via `/api/index.js`
- Routes `/api/*` and `/health` requests to the backend serverless function
- Routes all other requests to the Next.js frontend

### Important Notes for Vercel Deployment

1.  **Cold Starts:** Serverless functions may have cold start delays (1-3 seconds) on the first request.

2.  **Timeouts:** Vercel serverless functions have a 10-second timeout on the Hobby plan (60 seconds on Pro).

3.  **Database Connections:** Use connection pooling for PostgreSQL (Prisma handles this automatically).

4.  **Environment Variables:** Make sure to set all required environment variables in Vercel project settings.

---

## Separate Vercel + Render Deployment (Option 2)

### Deploy Frontend Only to Vercel

1.  **Push your code** to GitHub.
2.  **Log in to Vercel** (vercel.com) and click **"Add New..."** -> **"Project"**.
3.  **Import your repository**.
4.  **Configure Project:**
    - **Framework Preset:** Next.js (should be auto-detected)
    - **Root Directory:** Click "Edit" and select `frontend`.
5.  **Environment Variables:**
    - Add `NEXT_PUBLIC_API_URL` pointing to your Render backend URL
6.  **Deploy:** Click "Deploy".
7.  **URL:** Vercel will give you a URL (e.g., `learnloop.vercel.app`).

### Deploy Backend to Render

1.  **Log in to Render** (render.com).
2.  **Blueprints:**
    - Click **"New"** -> **"Blueprint"**.
    - Connect your GitHub repository.
    - Render will detect the `render.yaml` file in your repo.
3.  **Apply Blueprint:**
    - Click **"Apply"**.
    - Render will automatically:
      - Create a **PostgreSQL Database** (`learnloop-db`).
      - Create a **Web Service** (`learnloop-backend`).
      - Link them together using the `DATABASE_URL`.
4.  **Wait for Build:** It may take a few minutes.
5.  **Success:** Your backend will be live!

### Manual Backend Deployment (Alternative)
If you don't want to use Blueprints:
1.  **New Web Service:** Connect repo.
2.  **Root Directory:** `.` (default).
3.  **Build Command:** `npm install && npx prisma generate`
4.  **Start Command:** `npm start`
5.  **Environment Variables:**
    - `DATABASE_URL`: Connection string from your Render Postgres DB (create one first).
    - `JWT_SECRET`: A random secret key.

---

## 4. Redeploying on Render

Render supports **Auto-Deploy** by default.
- Whenever you push changes to your `main` branch, Render will detect the change and redeploy the backend automatically.

**To trigger a manual redeploy:**
1.  Go to your Dashboard -> Select `learnloop-backend`.
2.  Click **"Manual Deploy"** -> **"Deploy latest commit"**.
