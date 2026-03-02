# Archived Files

## .env (deprecated)

The `.env` file has been **deprecated** as of March 2026.

### What to use instead

Use **`.env.development`** for all development work.

### Why this change?

- **Clearer intent**: `.env.development` makes it obvious this is for development
- **Better organization**: Separate configs for different environments
- **Prevents confusion**: No more wondering which file takes precedence
- **Follows best practices**: Environment-specific config files are standard

### Configuration loading

The system now loads configuration based on `NODE_ENV`:
- `development` → `.env.development`
- `production` → `.env.production`
- `staging` → `.env.staging`

**No fallback to `.env`**

### Need to restore settings?

1. Check `_archived/.env` for any custom configuration
2. Copy relevant settings to `.env.development`
3. Delete this archive once migration is complete
