# Docker Build Fix Summary

## Problem

Docker build was failing with two main issues:

### Issue 1: TypeScript Compilation Failed

**Error**: `npm run build` failed because TypeScript couldn't find types from `@prisma/client`

**Root Cause**: `tsconfig.json` was excluded by `.dockerignore`, so TypeScript couldn't compile properly.

**Fix**: Removed `tsconfig.json` from `.dockerignore` since it's required for the build.

### Issue 2: Production Stage Failed

**Error**: `npm ci --only=production` failed because `postinstall` script tried to run `prisma:generate` but scripts and Prisma schema weren't available yet.

**Root Cause**: The `postinstall` script runs during `npm ci`, but required files weren't copied yet.

**Fix**:

1. Copy Prisma schema and scripts **before** running `npm ci`
2. Use `--ignore-scripts` flag in production stage since Prisma Client is already generated in builder stage

## Changes Made

### 1. Updated `.dockerignore`

```diff
- tsconfig.json
- tsconfig.*.json
+ # Note: tsconfig.json is NEEDED for Docker build (TypeScript compilation)
+ # tsconfig.json
+ # tsconfig.*.json
```

**Why**: TypeScript needs `tsconfig.json` to know how to compile the code.

### 2. Updated Dockerfile (Production Stage)

**Before:**

```dockerfile
# Copy package files
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm ci --only=production --prefer-offline --no-audit
```

**After:**

```dockerfile
# Copy package files
COPY --from=builder /app/package*.json ./

# Copy Prisma schema and scripts (needed for postinstall script)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Install production dependencies only
# Use --ignore-scripts since Prisma Client is already generated in builder stage
RUN npm ci --only=production --ignore-scripts --prefer-offline --no-audit
```

**Why**:

- Copying scripts/schema first ensures they're available if needed
- `--ignore-scripts` prevents `postinstall` from running (Prisma Client already generated)

### 3. Updated Dockerfile (Builder Stage - File Order)

**Before:**

```dockerfile
# Copy Prisma schema
COPY prisma ./prisma
# Copy scripts
COPY scripts ./scripts
# Generate Prisma Client
RUN npm run prisma:generate
# Copy everything else
COPY . .
# Build
RUN npm run build
```

**After:**

```dockerfile
# Copy Prisma schema
COPY prisma ./prisma
# Copy scripts
COPY scripts ./scripts
# Copy everything else (including tsconfig.json)
COPY . .
# Generate Prisma Client
RUN npm run prisma:generate
# Build
RUN npm run build
```

**Why**: Ensures `tsconfig.json` is available before running TypeScript build.

## Build Process Flow

### Builder Stage

1. ✅ Install dependencies
2. ✅ Copy Prisma schema
3. ✅ Copy scripts
4. ✅ Copy all source files (including `tsconfig.json`)
5. ✅ Generate Prisma Client
6. ✅ Compile TypeScript to JavaScript
7. ✅ Prune dev dependencies

### Production Stage

1. ✅ Copy package files
2. ✅ Copy Prisma schema and scripts (preemptively)
3. ✅ Install production dependencies (with `--ignore-scripts`)
4. ✅ Copy built `dist` folder
5. ✅ Copy Prisma Client (already generated)
6. ✅ Set permissions
7. ✅ Start application

## Verification

```bash
# Build succeeds
docker compose build eventknit-server

# Services start correctly
docker compose up -d

# Check logs
docker compose logs eventknit-server
```

## Key Learnings

1. **`.dockerignore` is powerful but can break builds** - Don't exclude build-required files like `tsconfig.json`

2. **`npm postinstall` scripts run during `npm ci`** - If your `postinstall` needs files, copy them first OR use `--ignore-scripts`

3. **Prisma Client generation** - Must happen before TypeScript compilation, but after all source files are copied

4. **Multi-stage builds** - Production stage needs access to files from builder stage, plan copy order carefully

## Current Status

✅ Docker build works  
✅ TypeScript compiles successfully  
✅ Prisma Client generates correctly  
✅ Production stage completes  
✅ Ready for `docker compose up`








