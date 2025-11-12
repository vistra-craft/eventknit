# Secrets Configuration Guide

This guide explains which secrets in `.env.development` should be changed for real/production use.

## 🔴 Critical Secrets (MUST Change)

### 1. JWT Secrets

**What they are:** Used to sign and verify JWT tokens. If compromised, attackers can create valid tokens.

**Current (Development):**

```env
JWT_SECRET=dev-jwt-secret-key-change-in-production-min-32-characters-long
JWT_REFRESH_SECRET=dev-refresh-secret-key-change-in-production-min-32-characters-long
```

**What to use:**

- **Minimum 32 characters** (recommended: 64+ characters)
- **Random, unpredictable strings**
- **Different values for production vs development**

**How to generate:**

```bash
# Option 1: Using OpenSSL
openssl rand -base64 64

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

**Example (Real Secret):**

```env
JWT_SECRET=K8mP2qR7vT9wX3yZ5aB8cD1eF4gH6jK9lM2nO5pQ8rS1tU4vW7xY0zA3bC6dE9fG
JWT_REFRESH_SECRET=M5nP8qR2vT6wX9yZ3aB7cD0eF4gH8jK2lM6nO9pQ3rS7tU1vW5xY9zA2bC5dE8fG
```

---

### 2. Database Password

**What it is:** PostgreSQL database user password.

**Current (Development):**

```env
POSTGRES_PASSWORD=eventknit123
```

**What to use:**

- **Strong password** (min 16 characters recommended)
- **Mix of uppercase, lowercase, numbers, special characters**
- **Never commit to version control**

**Example (Real Password):**

```env
POSTGRES_PASSWORD=MyStr0ng!P@ssw0rd#2024$Secure
```

**Update `DATABASE_URL` accordingly:**

```env
DATABASE_URL="postgresql://eventknit:MyStr0ng!P@ssw0rd#2024$Secure@postgres:5432/eventknit?schema=public"
```

---

### 3. SMTP/Email Credentials

**What they are:** Email service credentials for sending verification and password reset emails.

**Current (Development):**

```env
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**What to use:**

#### For Gmail:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the generated 16-character password

**Example:**

```env
SMTP_USER=youractualemail@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # Your generated app password
```

#### For Other Providers (SendGrid, Mailgun, etc.):

Use your provider's SMTP credentials:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.your-actual-sendgrid-api-key
```

---

### 4. Superadmin Password (for seeding)

**What it is:** Initial superadmin password created by seed script.

**Current (Development):**

```env
SUPERADMIN_PASSWORD=change-me-in-production
```

**What to use:**

- **Very strong password** (the superadmin account has full access)
- **Store securely** (password manager recommended)
- **Change immediately after first login**

**Example:**

```env
SUPERADMIN_PASSWORD=SuperAdmin!2024#Secure$Password@123
```

---

## 🟡 Important Secrets (Should Change)

### 5. PgAdmin Password (Development only)

**What it is:** Password for PgAdmin web interface (only for development).

**Current:**

```env
PGADMIN_PASSWORD=admin
```

**What to use:**

- Strong password for development too
- This is only for local development access

**Example:**

```env
PGADMIN_PASSWORD=DevPgAdmin!2024
```

---

## 📋 Complete Example `.env.development` with Real Secrets

```env
# Server
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# Database (PostgreSQL)
DATABASE_URL="postgresql://eventknit:MyStr0ng!P@ssw0rd#2024@postgres:5432/eventknit?schema=public"
POSTGRES_USER=eventknit
POSTGRES_PASSWORD=MyStr0ng!P@ssw0rd#2024
POSTGRES_DB=eventknit
POSTGRES_PORT=5432

# JWT (Generated secure secrets)
JWT_SECRET=K8mP2qR7vT9wX3yZ5aB8cD1eF4gH6jK9lM2nO5pQ8rS1tU4vW7xY0zA3bC6dE9fG
JWT_REFRESH_SECRET=M5nP8qR2vT6wX9yZ3aB7cD0eF4gH8jK2lM6nO9pQ3rS7tU1vW5xY9zA2bC5dE8fG
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (Your actual Gmail credentials)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop
EMAIL_FROM=noreply@eventknit.com

# Superadmin Seed
SUPERADMIN_EMAIL=admin@eventknit.com
SUPERADMIN_PASSWORD=SuperAdmin!2024#Secure$Password

# Other settings...
```

---

## ✅ Security Checklist

Before deploying to production, ensure:

- [ ] All JWT secrets are 32+ characters and randomly generated
- [ ] Database password is strong and unique
- [ ] Email credentials are valid and working
- [ ] Superadmin password is changed after first login
- [ ] `.env` files are in `.gitignore` (never commit secrets!)
- [ ] Production secrets are different from development
- [ ] All secrets are stored securely (password manager, secret manager)

---

## 🔒 Best Practices

1. **Never commit `.env` files to git**

   - Verify `.env*` is in `.gitignore`
   - Only commit `.env.example` (without real secrets)

2. **Use different secrets for each environment**

   - Development, staging, and production should have different secrets

3. **Rotate secrets regularly**

   - Especially if there's any suspicion of compromise
   - Rotate JWT secrets every 6-12 months

4. **Use environment-specific files**

   - `.env.development` for local development
   - `.env.staging` for staging environment
   - `.env.production` for production (use secret manager)

5. **For Production:**
   - Use secret management services (AWS Secrets Manager, HashiCorp Vault, etc.)
   - Never store production secrets in files
   - Use CI/CD environment variables

---

## 🚨 If Secrets are Compromised

1. **Immediately rotate all secrets**
2. **Revoke all existing tokens** (users will need to re-login)
3. **Change database password**
4. **Review access logs** for unauthorized access
5. **Notify affected users** if necessary

---

## Quick Secret Generation Commands

```bash
# Generate JWT secrets (64 characters)
openssl rand -base64 64

# Generate database password (32 characters)
openssl rand -base64 32

# Generate superadmin password (32 characters)
openssl rand -base64 32 | tr -d '\n'
```


