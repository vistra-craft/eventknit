# Test Setup Guide

## Option 1: Use Same Database (Quickest)

Tests will use your existing database but clean up after themselves.

1. **Make sure PostgreSQL is running:**

   ```bash
   docker compose --env-file .env.development up -d postgres
   ```

2. **Create `.env.test` file:**

   ```bash
   cp .env.development .env.test
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

## Option 2: Use Separate Test Database (Recommended)

Create a separate database for tests to avoid affecting development data.

1. **Create test database:**

   ```bash
   # If using Docker
   docker exec -it eventknit-postgres psql -U eventknit -d postgres -c "CREATE DATABASE eventknit_test;"

   # If using local PostgreSQL
   sudo -u postgres psql -c "CREATE DATABASE eventknit_test;"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE eventknit_test TO eventknit;"
   ```

2. **Create `.env.test` file:**

   ```bash
   cp .env.development .env.test
   ```

3. **Update `.env.test` with test database:**

   ```env
   DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit_test?schema=public"
   ```

4. **Run migrations on test database:**

   ```bash
   DATABASE_URL="postgresql://eventknit:eventknit123@localhost:5432/eventknit_test?schema=public" npm run prisma:migrate
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Troubleshooting

### "Can't reach database server"

- Make sure PostgreSQL is running: `docker ps | grep postgres`
- Check DATABASE_URL in `.env.test`
- Verify database exists: `docker exec eventknit-postgres psql -U eventknit -l`

### Tests timing out

- Increase timeout in `setup.ts` if needed
- Check database connection is stable


