# Deployment Guide: Render (Server) + Netlify (Client)

This guide explains how to deploy the EventKnit application with the server on Render and the client on Netlify.

## Architecture Overview

- **Backend (Server)**: Deployed on Render
  - Node.js/Express API
  - PostgreSQL database (Render managed or external)
  - Handles all API requests

- **Frontend (Client)**: Deployed on Netlify
  - React/Vite SPA
  - Static site hosting
  - Makes API calls to Render server

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
3. **GitHub Repository**: Your code should be in a GitHub repository
4. **Domain (Optional)**: Custom domain for production

## Part 1: Deploy Server on Render

### Step 1: Create PostgreSQL Database

1. Go to Render Dashboard → New → PostgreSQL
2. Configure:
   - **Name**: `eventknit-db`
   - **Database**: `eventknit`
   - **User**: `eventknit`
   - **Region**: Choose closest to your users
   - **Plan**: Starter (or Free for testing)
3. Copy the **Internal Database URL** (you'll use this later)

### Step 2: Create Web Service

1. Go to Render Dashboard → New → Web Service
2. Connect your GitHub repository
3. Configure:
   - **Name**: `eventknit-server`
   - **Region**: Same as database
   - **Branch**: `main` or `development`
   - **Root Directory**: `server` (important!)
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run prisma:generate && npm run build && npm run prisma:migrate:deploy`
   - **Start Command**: `npm start`

### Step 3: Set Environment Variables

In the Render dashboard, go to your web service → Environment → Add Environment Variable:

#### Required Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=10000
HOST=0.0.0.0

# Database (use Internal Database URL from Step 1)
DATABASE_URL=<Internal Database URL from PostgreSQL service>

# JWT Secrets (generate strong random strings, min 32 chars)
JWT_SECRET=<generate-strong-random-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-strong-random-secret-min-32-chars>

# CORS - Set to your Netlify URL (update after deploying client)
CORS_ORIGIN=https://your-app.netlify.app
CORS_CREDENTIALS=true

# Frontend URL - Set to your Netlify URL
FRONTEND_URL=https://your-app.netlify.app

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@eventknit.com

# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_live_xxxxx
PAYSTACK_PUBLIC_KEY=pk_live_xxxxx

# Rate Limiting (optional, defaults provided)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
GUEST_REGISTRATION_WINDOW_MS=3600000
GUEST_REGISTRATION_MAX=10
GUEST_PAYMENT_WINDOW_MS=3600000
GUEST_PAYMENT_MAX=10
```

#### Generate JWT Secrets

You can generate secure secrets using:
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use online tool: https://randomkeygen.com/
```

### Step 4: Link Database to Web Service

1. In your web service settings, go to **Connections**
2. Add the PostgreSQL database you created
3. Render will automatically set `DATABASE_URL` if you use the connection feature

### Step 5: Deploy

1. Click **Save Changes**
2. Render will automatically build and deploy
3. Wait for deployment to complete
4. Copy your service URL (e.g., `https://eventknit-server.onrender.com`)

### Step 6: Run Database Migrations

The build command includes `npm run prisma:migrate:deploy`, which should run automatically. If migrations fail:

1. Go to your web service → Shell
2. Run: `npm run prisma:migrate:deploy`

## Part 2: Deploy Client on Netlify

### Step 1: Create New Site

1. Go to Netlify Dashboard → Add new site → Import an existing project
2. Connect your GitHub repository
3. Configure:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

### Step 2: Set Environment Variables

Go to Site settings → Environment variables → Add variable:

```bash
# API Base URL - Your Render server URL
VITE_API_BASE_URL=https://eventknit-server.onrender.com/api/v1

# Frontend URL - Your Netlify URL (update after first deploy)
VITE_FRONTEND_URL=https://your-app.netlify.app
```

**Important**: 
- Netlify will provide a URL like `https://random-name-12345.netlify.app`
- After first deployment, update `VITE_FRONTEND_URL` to match
- Also update `CORS_ORIGIN` and `FRONTEND_URL` in Render to match

### Step 3: Deploy

1. Click **Deploy site**
2. Wait for build to complete
3. Copy your site URL

### Step 4: Update CORS Settings

After getting your Netlify URL:

1. Go back to Render → Your web service → Environment
2. Update:
   - `CORS_ORIGIN` = Your Netlify URL
   - `FRONTEND_URL` = Your Netlify URL
3. Redeploy the service (Render will auto-redeploy)

## Part 3: Post-Deployment Configuration

### Update Environment Variables

1. **In Render**: Update `CORS_ORIGIN` and `FRONTEND_URL` with your Netlify URL
2. **In Netlify**: Update `VITE_FRONTEND_URL` with your Netlify URL

### Test the Deployment

1. Visit your Netlify URL
2. Check browser console for any CORS errors
3. Test API connectivity:
   - Try logging in
   - Check network tab for API calls
   - Verify API calls go to Render URL

### Custom Domain (Optional)

#### Netlify:
1. Go to Domain settings → Add custom domain
2. Follow DNS configuration instructions
3. Update `VITE_FRONTEND_URL` and Render's `CORS_ORIGIN`/`FRONTEND_URL`

#### Render:
1. Go to your web service → Settings → Custom Domains
2. Add your custom domain
3. Update DNS records as instructed

## Troubleshooting

### CORS Errors

**Symptom**: Browser console shows CORS errors

**Solution**:
1. Verify `CORS_ORIGIN` in Render matches your Netlify URL exactly (including `https://`)
2. Check that `CORS_CREDENTIALS=true` in Render
3. Ensure no trailing slashes in URLs

### Database Connection Errors

**Symptom**: Server logs show database connection failures

**Solution**:
1. Verify `DATABASE_URL` is set correctly in Render
2. If using Render PostgreSQL, use **Internal Database URL** (not external)
3. Check database service is running
4. Verify database credentials are correct

### Build Failures

**Symptom**: Build fails on Render or Netlify

**Solution**:
1. **Render**: Check build logs for errors
   - Verify `Root Directory` is set to `server`
   - Check Node version compatibility
   - Ensure all dependencies are in `package.json`

2. **Netlify**: Check build logs
   - Verify `Base directory` is set to `client`
   - Check `Publish directory` is `dist`
   - Ensure Vite build completes successfully

### API Calls Fail

**Symptom**: Frontend can't reach backend API

**Solution**:
1. Verify `VITE_API_BASE_URL` in Netlify matches Render URL
2. Check Render service is running (visit health endpoint: `https://your-server.onrender.com/health`)
3. Check browser network tab for actual request URLs
4. Verify CORS is configured correctly

### Environment Variables Not Working

**Symptom**: Variables not being read correctly

**Solution**:
1. **Netlify**: Vite requires `VITE_` prefix for client-side variables
2. **Render**: Restart service after adding new variables
3. Check for typos in variable names
4. Verify no extra spaces or quotes

## Monitoring

### Render
- View logs: Service → Logs
- Monitor metrics: Service → Metrics
- Set up alerts for downtime

### Netlify
- View build logs: Deploys → Click deploy
- Monitor analytics: Analytics tab
- Set up notifications for failed builds

## Security Checklist

- [ ] JWT secrets are strong (32+ characters, random)
- [ ] Database credentials are secure
- [ ] CORS is restricted to your Netlify domain only
- [ ] SMTP credentials are secure (use app passwords for Gmail)
- [ ] Paystack keys are production keys (not test keys)
- [ ] Environment variables are not committed to git
- [ ] HTTPS is enabled (automatic on both platforms)

## Cost Estimation

### Render (Free Tier)
- Web Service: Free (spins down after 15 min inactivity)
- PostgreSQL: Free (limited to 90 days, then $7/month)

### Render (Starter Tier)
- Web Service: $7/month (always on)
- PostgreSQL: $7/month

### Netlify
- Free tier: 100GB bandwidth, 300 build minutes/month
- Pro tier: $19/month (unlimited builds, better performance)

## Next Steps

1. Set up monitoring and alerts
2. Configure custom domains
3. Set up CI/CD for automatic deployments
4. Configure backup strategy for database
5. Set up staging environment
6. Configure error tracking (Sentry, etc.)

## Support

- Render Docs: https://render.com/docs
- Netlify Docs: https://docs.netlify.com
- Project Issues: Check GitHub issues



