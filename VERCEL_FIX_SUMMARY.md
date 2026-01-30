# Fix Summary: 404 Not Found on Vercel

## Problem
Getting 404 errors when deploying the LearnLoop application to Vercel. The backend API endpoints (like `/api/auth/login`, `/api/posts`, etc.) were not accessible.

## Root Cause
The original `vercel.json` configuration was only deploying the Next.js frontend from the `/frontend` directory. The Express backend API at the root level was not being deployed, causing all API requests to return 404.

Additionally, if the Vercel project settings had "Root Directory" set to "frontend", Vercel would not detect the `/api` directory at the repository root.

## Solution Implemented

### 1. Created Backend Serverless Function
- Created `/api/[[...path]].js` - a catch-all serverless function that wraps the Express app
- This allows Vercel to deploy the Express backend as a serverless function

### 2. Updated Server for Serverless Compatibility
- Modified `server.js` to detect when running in Vercel (via `process.env.VERCEL`)
- Skips calling `app.listen()` in serverless environments since Vercel handles request routing
- Bootstraps system users during cold start in serverless mode

### 3. Configured Routing
- Updated `vercel.json` with proper routing rules:
  - `/api/*` → Routes to `/api/[[...path]]` (Express backend)
  - `/health` → Routes to `/api/[[...path]]` (Express backend)
  - `/*` → Routes to `/frontend/$1` (Next.js frontend)

### 4. Created Documentation
- `VERCEL_DEPLOYMENT.md` - Complete step-by-step deployment guide
- Updated `DEPLOYMENT.md` - Added Vercel deployment option alongside Render option

## How to Deploy

### Quick Steps:

1. **Go to Vercel Dashboard**
   - Import your repository
   - **CRITICAL**: Set Root Directory to `.` (dot) or leave empty - NOT "frontend"

2. **Set Environment Variables**
   ```
   DATABASE_URL=your-postgresql-connection-string
   JWT_SECRET=your-random-secret-key
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   ```

3. **Deploy**
   - Click "Deploy"
   - Vercel will build both frontend and backend

4. **Run Migrations**
   ```bash
   vercel link
   vercel env pull .env.local
   npx prisma migrate deploy
   ```

### Test Your Deployment:
- Frontend: `https://your-project.vercel.app/`
- Health Check: `https://your-project.vercel.app/health`
- API: `https://your-project.vercel.app/api/topics`

## Files Changed

1. `/api/[[...path]].js` - Created (serverless function wrapper)
2. `server.js` - Modified (serverless compatibility)
3. `vercel.json` - Updated (routing configuration)
4. `VERCEL_DEPLOYMENT.md` - Created (deployment guide)
5. `DEPLOYMENT.md` - Updated (added Vercel option)

## Key Configuration

**Most Important**: In Vercel project settings, Root Directory must be `.` or empty, NOT "frontend".

If you set it to "frontend", Vercel won't see the `/api` directory and you'll get 404 errors.

## Troubleshooting

If still getting 404 errors:

1. ✅ Check Vercel Settings → General → Root Directory is `.` or empty
2. ✅ Check Environment Variables are set (DATABASE_URL, JWT_SECRET)
3. ✅ Check Build Logs for errors
4. ✅ Redeploy the project
5. ✅ See `VERCEL_DEPLOYMENT.md` for detailed troubleshooting

## Alternative: Separate Deployments

If you prefer to keep frontend and backend separate:

- **Frontend**: Deploy `/frontend` to Vercel (set Root Directory to "frontend")
- **Backend**: Deploy root Express app to Render or Railway
- Update frontend config to point to the separate backend URL

This separation is actually recommended for production for better scalability and independent scaling.

## Testing

The changes maintain backward compatibility:
- ✅ Local development still works (`npm start` or `npm run dev`)
- ✅ Render deployment still works (using existing `render.yaml`)
- ✅ Vercel deployment now works (using new `/api/[[...path]].js`)

## Next Steps

1. Follow the deployment instructions in `VERCEL_DEPLOYMENT.md`
2. Configure Vercel project settings correctly (Root Directory = `.`)
3. Set environment variables
4. Deploy and test
5. Run database migrations
