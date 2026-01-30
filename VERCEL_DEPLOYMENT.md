# Vercel Deployment Instructions

## Important: Vercel Dashboard Configuration

To avoid 404 errors, you MUST configure Vercel correctly in the dashboard:

### Step 1: Import Project
1. Go to [vercel.com](https://vercel.com) and log in
2. Click "Add New..." → "Project"
3. Import your GitHub repository

### Step 2: Configure Build Settings

**CRITICAL**: Do NOT set a Root Directory. Leave it empty or set to `.` (dot)

In the project configuration:

- **Framework Preset**: Other (or leave as detected)
- **Root Directory**: **.** (dot) or leave **EMPTY** - DO NOT set to "frontend"
- **Build Command**: Leave as default or empty (vercel.json handles this)
- **Output Directory**: Leave as default or empty (vercel.json handles this)
- **Install Command**: Leave as default or empty (vercel.json handles this)

### Step 3: Set Environment Variables

Add these environment variables in Vercel project settings:

**Required:**
```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-random-secret-key
JWT_EXPIRES_IN=7d
NODE_ENV=production
```

**Optional:**
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

### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Step 5: Run Database Migrations

After the first successful deployment, run Prisma migrations:

**Option A - Using Vercel CLI (Recommended):**
```bash
# Install Vercel CLI
npm install -g vercel

# Link to your project
vercel link

# Pull environment variables
vercel env pull .env.local

# Run migrations
npx prisma migrate deploy
```

**Option B - Direct Database Access:**
If you have direct database access and your database allows external connections, you can connect directly and run migrations. However, this is not recommended for production environments.

**Option C - Manual SQL Execution:**
Connect to your database using a tool like pgAdmin or psql and manually run the SQL from the `prisma/migrations` directory.

### Step 6: Test Your Deployment

Test these endpoints to verify everything works:

- Frontend: `https://your-project.vercel.app/`
- Health Check: `https://your-project.vercel.app/health`
- API Example: `https://your-project.vercel.app/api/topics`

## How It Works

The deployment structure:
- **Frontend**: Deployed from `/frontend` directory (Next.js app)
- **Backend API**: Deployed from `/api/[[...path]].js` (Express app as serverless function)
- **Routing**: Configured in `vercel.json`:
  - `/api/*` → Routes to the Express backend
  - `/health` → Routes to the Express backend
  - `/*` → Routes to the Next.js frontend

## Troubleshooting

### Still Getting 404 Errors?

1. **Check Root Directory Setting**: In Vercel dashboard → Settings → General, make sure "Root Directory" is set to `.` or is empty, NOT "frontend"

2. **Check Build Logs**: In Vercel dashboard → Deployments → Click on your deployment → View build logs
   - Look for errors during build
   - Verify both frontend and API builds succeeded

3. **Check Function Logs**: In Vercel dashboard → Deployments → Click on your deployment → Functions
   - Check if the API function is listed
   - Click on it to see logs

4. **Verify Environment Variables**: Settings → Environment Variables
   - Make sure DATABASE_URL and JWT_SECRET are set
   - Make sure they're available for Production environment

5. **Redeploy**: Sometimes a fresh deployment helps
   - Deployments → Click ⋯ → Redeploy

### Common Issues

**Issue**: "Module not found" errors in API
**Solution**: Make sure all dependencies are in the root `package.json`, not just in `frontend/package.json`

**Issue**: Database connection errors
**Solution**: Verify DATABASE_URL is correct and the database accepts connections from Vercel's IP ranges

**Issue**: API works locally but not on Vercel
**Solution**: Check that VERCEL environment variable detection works - the Express server checks `process.env.VERCEL` to know it's running serverless

## Alternative: Deploy Backend Separately

If you continue to have issues deploying both together, consider:

1. **Frontend on Vercel**: Deploy only the `/frontend` directory
   - Set Root Directory to `frontend`
   - Remove the `/api` directory from the repo

2. **Backend on Render**: Deploy the backend separately
   - Follow instructions in `DEPLOYMENT.md`
   - Update frontend to point to the Render backend URL

This separation is actually the recommended production setup for better scalability.
