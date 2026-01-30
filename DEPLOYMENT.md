# Deployment Guide

This guide explains how to deploy the **LearnLoop** application. The recommended setup is:
- **Frontend:** Vercel (best for Next.js)
- **Backend:** Render (best for Node.js + PostgreSQL)
- **Auth & Data:** Firebase (Auth, Realtime Database)

---

## 1. Firebase Setup (Prerequisite)

Before deploying, ensure your Firebase project is configured:

1.  **Authentication:**
    - Go to Firebase Console -> Authentication -> Sign-in method.
    - Enable **Email/Password**.
    - Enable **Google** (setup OAuth consent screen if needed).

2.  **Realtime Database:**
    - Go to Firebase Console -> Realtime Database.
    - Create a database.
    - **Rules:** For development/testing, you can start with these rules (but secure them later!):
      ```json
      {
        "rules": {
          ".read": true,
          ".write": true
        }
      }
      ```

---

## 2. Deploy Frontend to Vercel

1.  **Push your code** to GitHub.
2.  **Log in to Vercel** (vercel.com) and click **"Add New..."** -> **"Project"**.
3.  **Import your repository**.
4.  **Configure Project:**
    - **Framework Preset:** Next.js (should be auto-detected)
    - **Root Directory:** Click "Edit" and select `frontend`.
5.  **Environment Variables:**
    - You don't need any special env vars for the frontend unless you have custom ones. The Firebase config is currently hardcoded in `frontend/lib/firebase.ts`. *Note: For production, it's better to use env vars.*
6.  **Deploy:** Click "Deploy".
7.  **URL:** Vercel will give you a URL (e.g., `learnloop.vercel.app`).

---

## 3. Deploy Backend to Render

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
