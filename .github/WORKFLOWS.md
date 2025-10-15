# GitHub Workflows Documentation

This repository uses separate CI/CD workflows for client and server to support independent deployment and scaling.

## 🔄 Workflow Structure

```
.github/workflows/
├── client-ci.yml              # Client testing & building
├── client-deploy-staging.yml   # Client staging deployment
├── client-deploy-production.yml # Client production deployment
├── server-ci.yml              # Server testing & building
├── server-deploy-staging.yml   # Server staging deployment
└── server-deploy-production.yml # Server production deployment
```

## 🎯 Workflow Triggers

### Client Workflows

- **Triggers on**: Changes to `client/**` directory
- **Branches**: `main`, `development`, `staging`
- **Independent**: Client changes don't trigger server builds

### Server Workflows

- **Triggers on**: Changes to `server/**` directory
- **Branches**: `main`, `development`, `staging`
- **Independent**: Server changes don't trigger client builds

## 🚀 Deployment Environments

### Staging Environment

- **Trigger**: Push to `staging` branch
- **Client**: Deploys to staging CDN/hosting
- **Server**: Deploys to staging server infrastructure

### Production Environment

- **Trigger**: Push to `main` branch
- **Client**: Deploys to production CDN/hosting
- **Server**: Deploys to production server infrastructure

## 🔧 Required Secrets

### Server Secrets

```
STAGING_MONGODB_URI
STAGING_JWT_SECRET
STAGING_PORT
STAGING_CLIENT_URL
STAGING_REDIS_URL
STAGING_SERVER_URL

PRODUCTION_MONGODB_URI
PRODUCTION_JWT_SECRET
PRODUCTION_PORT
PRODUCTION_CLIENT_URL
PRODUCTION_REDIS_URL
PRODUCTION_SERVER_URL
```

### Client Secrets

```
STAGING_SERVER_URL
STAGING_CLIENT_URL

PRODUCTION_SERVER_URL
PRODUCTION_CLIENT_URL
```

### Optional Deployment Secrets

```
VERCEL_TOKEN          # For Vercel deployment
NETLIFY_TOKEN         # For Netlify deployment
AWS_ACCESS_KEY_ID     # For AWS S3 deployment
AWS_SECRET_ACCESS_KEY # For AWS S3 deployment
CLOUDFLARE_API_TOKEN  # For Cloudflare Pages deployment
```

## 📋 Workflow Steps

### CI Workflows (Both Client & Server)

1. **Checkout code**
2. **Setup Node.js** with caching
3. **Install dependencies**
4. **Run linter**
5. **Run type checking**
6. **Run tests**
7. **Build project**
8. **Upload artifacts**

### Deployment Workflows

1. **Checkout code**
2. **Setup Node.js** with caching
3. **Setup environment variables**
4. **Install dependencies**
5. **Run tests**
6. **Build project**
7. **Deploy to environment**
8. **Health check**
9. **Notify success**

## 🎛️ Customization

### Adding New Deployment Targets

1. **Edit the deployment workflow** (e.g., `client-deploy-production.yml`)
2. **Add deployment commands** in the "Deploy to production" step
3. **Add required secrets** to GitHub repository settings
4. **Test with staging** environment first

### Example Deployment Commands

#### Client Deployment Examples

```bash
# Vercel
vercel --prod --token ${{ secrets.VERCEL_TOKEN }}

# Netlify
netlify deploy --prod --dir=client/dist --token ${{ secrets.NETLIFY_TOKEN }}

# AWS S3
aws s3 sync client/dist/ s3://${{ secrets.PRODUCTION_S3_BUCKET }} --delete

# Cloudflare Pages
wrangler pages publish client/dist --project-name=${{ secrets.PRODUCTION_CLOUDFLARE_PROJECT }}
```

#### Server Deployment Examples

```bash
# Heroku
git subtree push --prefix=server heroku main

# AWS ECS
aws ecs update-service --cluster production --service eventknit-server

# DigitalOcean App Platform
doctl apps create-deployment $SERVER_APP_ID

# Railway
railway up --environment production --service server

# Docker Compose
docker-compose -f server/docker-compose.yml --env-file server/.env.production up -d
```

## 🔍 Monitoring & Debugging

### Workflow Status

- Check workflow runs in GitHub Actions tab
- View logs for each step
- Monitor deployment health checks

### Common Issues

1. **Missing secrets**: Add required secrets to repository settings
2. **Path filters**: Ensure workflows trigger on correct file changes
3. **Environment variables**: Verify environment-specific configurations
4. **Health checks**: Update health check URLs for your deployment targets

## 🚀 Benefits of Separate Workflows

- ✅ **Independent deployments**: Deploy client and server separately
- ✅ **Faster CI**: Only build what changed
- ✅ **Resource efficiency**: Scale CI/CD resources independently
- ✅ **Team productivity**: Frontend/backend teams work independently
- ✅ **Flexible scaling**: Scale services based on demand
- ✅ **Technology-specific**: Optimized for Vite (client) vs Node.js (server)
