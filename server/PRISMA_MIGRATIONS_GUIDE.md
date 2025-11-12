# Prisma Migrations Guide

## What Are Prisma Migrations?

Prisma Migrations are **database schema version control**. They transform your database structure to match your Prisma schema (`schema.prisma`).

Think of them like Git commits, but for your database structure.

## What Migrations Do

### 1. **Create Migration Files**

When you run `prisma migrate dev`, Prisma:

- Compares your current `schema.prisma` with the database
- Generates SQL migration files in `prisma/migrations/`
- Each migration has a unique name and timestamp

### 2. **Apply Changes to Database**

Migrations apply SQL statements to:

- Create tables
- Add/remove columns
- Create indexes
- Add constraints
- Modify data types
- etc.

### 3. **Track Migration History**

Prisma creates a `_prisma_migrations` table in your database to track:

- Which migrations have been applied
- When they were applied
- Migration checksums (for validation)

## When to Run Migrations

### Development: `prisma migrate dev`

**Use this when:**

- ✅ You've changed `schema.prisma` (added/removed models, fields, etc.)
- ✅ You're developing locally
- ✅ You want Prisma to generate migration files automatically

**Command:**

```bash
npm run prisma:migrate
# or
npx prisma migrate dev
```

**What it does:**

1. Detects schema changes
2. Prompts you to name the migration
3. Generates SQL migration file
4. Applies migration to database
5. Regenerates Prisma Client automatically
6. Runs seed script if configured

**Example:**

```bash
# After adding a new field to User model:
$ npm run prisma:migrate

✔ Generated migration file: prisma/migrations/20240101120000_add_phone_verification/migration.sql
The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20240101120000_add_phone_verification/
    └─ migration.sql

✔ The migration has been applied to the database.
✔ Generated Prisma Client
```

### Production: `prisma migrate deploy`

**Use this when:**

- ✅ Deploying to production/staging
- ✅ CI/CD pipelines
- ✅ Applying existing migrations to a database

**Command:**

```bash
npm run prisma:migrate:deploy
# or
npx prisma migrate deploy
```

**What it does:**

1. Reads existing migration files from `prisma/migrations/`
2. Checks which migrations haven't been applied yet
3. Applies only pending migrations
4. Does NOT regenerate Prisma Client (must run separately)
5. Fails if schema doesn't match migrations (safety check)

**Key Differences:**

| Feature                | `migrate dev`             | `migrate deploy` |
| ---------------------- | ------------------------- | ---------------- |
| **Creates migrations** | ✅ Yes                    | ❌ No            |
| **Generates Client**   | ✅ Yes                    | ❌ No            |
| **Runs seed**          | ✅ Yes                    | ❌ No            |
| **Interactive**        | ✅ Yes (names migrations) | ❌ No            |
| **Use case**           | Development               | Production/CI    |
| **Rollback**           | ✅ Can reset              | ❌ One-way       |

## Migration File Structure

After running migrations, your `prisma/` folder looks like:

```
prisma/
├── schema.prisma          # Your schema definition
├── seed.ts                # Seed script
└── migrations/            # Migration history
    ├── 20240101120000_init/
    │   └── migration.sql   # Creates User, RefreshToken, etc.
    ├── 20240115140000_add_phone_verification/
    │   └── migration.sql   # Adds PhoneVerification table
    └── 20240115200000_remove_phone_verification/
        └── migration.sql   # Removes PhoneVerification table
```

Each migration folder contains:

- `migration.sql` - The actual SQL statements
- Metadata (timestamp, checksum)

## Example Migration SQL

When you remove phone verification, Prisma generates:

```sql
-- Migration: remove_phone_verification
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isPhoneVerified",
DROP COLUMN "phoneVerifiedAt";

-- DropTable
DROP TABLE IF EXISTS "PhoneVerification";
```

## Workflow Examples

### Example 1: Adding a New Field

**Step 1:** Edit `schema.prisma`

```prisma
model User {
  // ... existing fields
  profileImage String?  // NEW FIELD
}
```

**Step 2:** Run migration

```bash
npm run prisma:migrate
# Name: add_profile_image
```

**Result:**

- Creates migration: `prisma/migrations/xxx_add_profile_image/migration.sql`
- Applies: `ALTER TABLE "User" ADD COLUMN "profileImage" TEXT;`
- Regenerates Prisma Client

### Example 2: Removing a Table

**Step 1:** Edit `schema.prisma`

```prisma
// Remove PhoneVerification model entirely
```

**Step 2:** Run migration

```bash
npm run prisma:migrate
# Name: remove_phone_verification
```

**Result:**

- Creates migration with DROP TABLE statements
- Applies changes to database
- Updates Prisma Client (removes types)

### Example 3: Production Deployment

**In CI/CD or Production:**

```bash
# 1. Generate Prisma Client (required)
npm run prisma:generate

# 2. Apply pending migrations
npm run prisma:migrate:deploy

# 3. Start application
npm start
```

## Important Commands

### Check Migration Status

```bash
npx prisma migrate status
```

Shows which migrations are applied vs pending.

### Reset Database (Development Only)

```bash
npx prisma migrate reset
```

⚠️ **WARNING**: Deletes all data! Only use in development.

- Drops database
- Recreates database
- Applies all migrations
- Runs seed script

### Create Empty Migration

```bash
npx prisma migrate dev --create-only
```

Creates migration file without applying it (for custom SQL).

### Format Schema

```bash
npx prisma format
```

Formats `schema.prisma` file (auto-fixes formatting).

## Best Practices

### ✅ Do's

1. **Run `migrate dev` after schema changes** (development)

   ```bash
   # 1. Edit schema.prisma
   # 2. Run migration
   npm run prisma:migrate
   ```

2. **Name migrations descriptively**

   ```
   add_user_avatar
   remove_old_analytics_table
   add_email_verification_index
   ```

3. **Review generated SQL** before applying (especially production)

   - Check `prisma/migrations/xxx/migration.sql`
   - Verify it does what you expect

4. **Commit migration files** to version control

   - Migration files should be in Git
   - Enables team to apply same changes

5. **Use `migrate deploy` in production**

   - Never use `migrate dev` in production
   - Use `migrate deploy` in CI/CD

6. **Test migrations before production**
   - Run on staging first
   - Backup production database before migrating

### ❌ Don'ts

1. **Don't edit migration files manually** (unless necessary)

   - Prisma generates them - editing can cause issues

2. **Don't delete migration files** (once applied)

   - Migration history must be preserved
   - Deleting breaks migration tracking

3. **Don't run `migrate reset` in production**

   - It deletes all data!

4. **Don't skip migrations**

   - Always apply migrations in order
   - Skipping can break database consistency

5. **Don't modify applied migrations**
   - Create new migrations instead

## Common Scenarios

### Scenario 1: Multiple Developers

**Developer A:**

```bash
# Makes schema change
# Runs: npm run prisma:migrate
# Commits: schema.prisma + migration files
git commit -m "Add user profile fields"
git push
```

**Developer B:**

```bash
# Pulls changes
git pull

# Applies new migrations
npm run prisma:migrate:deploy  # or just migrate dev
```

### Scenario 2: Production Deployment

```bash
# In CI/CD pipeline or deployment script:
npm ci                                    # Install dependencies
npm run prisma:generate                   # Generate Prisma Client
npm run prisma:migrate:deploy             # Apply migrations
npm run build                             # Build application
npm start                                 # Start server
```

### Scenario 3: Schema Conflict

If schema doesn't match database:

```bash
# Option 1: Reset (dev only, loses data!)
npx prisma migrate reset

# Option 2: Create migration to sync
npx prisma migrate dev --name sync_schema
```

## Migration vs Prisma Client Generation

### `prisma generate`

- Generates TypeScript types from schema
- Creates `@prisma/client` package
- **Does NOT change database**
- Safe to run anytime
- Required after schema changes or `npm install`

### `prisma migrate`

- **Changes database structure**
- Creates/applies SQL migrations
- Updates migration history
- Can include data loss if not careful

**Both are needed:**

```bash
# After schema change:
npm run prisma:migrate        # Updates database + generates client
# OR
npm run prisma:migrate:deploy # Updates database only
npm run prisma:generate       # Generates client separately
```

## Current EventKnit Setup

### Migration Scripts in `package.json`:

```json
{
  "prisma:migrate": "prisma migrate dev", // Development
  "prisma:migrate:deploy": "prisma migrate deploy", // Production
  "prisma:generate": "node scripts/prisma-generate.js"
}
```

### Post-Install Hook:

```json
{
  "postinstall": "node scripts/prisma-generate.js"
}
```

This ensures Prisma Client is generated after `npm install` (even without database connection).

## Example: Removing Phone Verification

**Current State:**

- Schema has `PhoneVerification` model (removed in code)
- Database might still have the table

**Migration Steps:**

```bash
# 1. Schema already updated (PhoneVerification removed)
# 2. Create and apply migration
npm run prisma:migrate
# Name: remove_phone_verification

# Prisma will:
# - Detect PhoneVerification model is missing
# - Generate DROP TABLE migration
# - Apply to database
# - Regenerate Prisma Client
```

**Generated SQL:**

```sql
-- AlterTable
ALTER TABLE "User" DROP COLUMN IF EXISTS "isPhoneVerified",
                   DROP COLUMN IF EXISTS "phoneVerifiedAt";

-- DropTable
DROP TABLE IF EXISTS "PhoneVerification";
```

## Troubleshooting

### "Migration failed to apply"

```bash
# Check migration status
npx prisma migrate status

# View error details
npx prisma migrate deploy --verbose
```

### "Database is out of sync"

```bash
# Option 1: Create migration to sync
npx prisma migrate dev --name sync

# Option 2: Reset (dev only!)
npx prisma migrate reset
```

### "Prisma Client types not found"

```bash
# Regenerate client
npm run prisma:generate
```

## Summary

| Command           | When                            | What It Does                                  |
| ----------------- | ------------------------------- | --------------------------------------------- |
| `migrate dev`     | After schema changes (dev)      | Creates + applies migration, generates client |
| `migrate deploy`  | Production/CI/CD                | Applies existing migrations only              |
| `migrate reset`   | Reset dev database              | Drops DB, recreates, applies all migrations   |
| `migrate status`  | Anytime                         | Shows migration state                         |
| `prisma generate` | After schema changes or install | Generates TypeScript client                   |

**Key Takeaway**: Migrations are your database's version control. Use `dev` for development, `deploy` for production!








