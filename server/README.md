# EventKnit Auth Service

A robust authentication service built with Node.js, Express, TypeScript, and MongoDB for the EventKnit platform.

## 🚀 Features

- **JWT Authentication**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with configurable rounds
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive request validation
- **Security Headers**: Helmet.js for security best practices
- **Database Integration**: MongoDB with Mongoose ODM
- **TypeScript**: Full type safety and better developer experience
- **Testing**: Jest and Supertest for comprehensive testing
- **Docker Support**: Containerized deployment ready
- **CI/CD**: GitHub Actions for automated testing and deployment

## 📋 Prerequisites

- Node.js 20+
- MongoDB 7.0+
- npm or yarn
- Docker (optional)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/vistra-craft/eventknit-auth.git
   cd eventknit-auth
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**

   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0

   # Or start your local MongoDB service
   ```

5. **Development**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Database models
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── __tests__/      # Test files
└── index.ts        # Application entry point
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the application for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript type checking

## 🌿 Branching Strategy

We follow GitFlow branching strategy:

- **`main`** - Production-ready code
- **`staging`** - Pre-production testing
- **`development`** - Integration branch for features
- **`feature/*`** - Feature development branches
- **`hotfix/*`** - Critical production fixes

### Workflow

1. **Feature Development**

   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   # Create PR to development
   ```

2. **Release Process**

   ```bash
   git checkout development
   git pull origin development
   git checkout -b staging
   git push origin staging
   # Deploy to staging environment
   # After testing, merge to main
   ```

3. **Hotfix Process**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-fix
   # Make critical fix
   git commit -m "hotfix: critical production fix"
   git push origin hotfix/critical-fix
   # Create PR to main
   ```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflows

1. **CI Pipeline** (`.github/workflows/ci.yml`)

   - Triggers on push/PR to `main`, `development`, `staging`
   - Runs linting, type checking, tests, and build
   - Uses MongoDB service for integration tests

2. **Staging Deployment** (`.github/workflows/deploy-staging.yml`)

   - Triggers on push to `staging` branch
   - Deploys to staging environment
   - Includes health checks

3. **Production Deployment** (`.github/workflows/deploy-production.yml`)
   - Triggers on push to `main` branch
   - Deploys to production environment
   - Includes health checks

### Required Secrets

Add these secrets to your GitHub repository:

- `STAGING_MONGODB_URI`
- `STAGING_JWT_SECRET`
- `STAGING_PORT`
- `STAGING_URL`
- `PRODUCTION_MONGODB_URI`
- `PRODUCTION_JWT_SECRET`
- `PRODUCTION_PORT`
- `PRODUCTION_URL`

## 🐳 Docker Deployment

### Multi-Environment Setup

The project supports three environments with dedicated configurations:

#### **Development Environment**

```bash
# Using the docker manager script
./docker-manager.sh dev up

# Or manually
docker-compose --env-file .env.development up -d
```

**Features:**

- Hot reload with volume mounting (`./src:/app/src`)
- Mongo Express admin interface (port 8081)
- Relaxed security settings for development
- No restart policy (manual control)

#### **Staging Environment**

```bash
# Using the docker manager script
./docker-manager.sh staging up

# Or manually
docker-compose --env-file .env.staging up -d
```

**Features:**

- Production-like configuration
- Stricter security settings
- No volume mounting (compiled code)
- `unless-stopped` restart policy
- Separate database (`eventknit-auth-staging`)

#### **Production Environment**

```bash
# Using the docker manager script
./docker-manager.sh prod up

# Or manually
docker-compose --env-file .env.production up -d
```

**Features:**

- Maximum security settings
- No volume mounting (compiled code)
- `always` restart policy
- Separate database (`eventknit-auth-prod`)
- Reduced rate limits for security

### Docker Manager Script

Use the `docker-manager.sh` script for easy environment management:

```bash
# Start development environment
./docker-manager.sh dev up

# View staging logs
./docker-manager.sh staging logs

# Build production services
./docker-manager.sh prod build

# Restart development services
./docker-manager.sh dev restart

# Stop production environment
./docker-manager.sh prod down
```

### Environment-Specific Features

| Feature         | Development          | Staging                  | Production            |
| --------------- | -------------------- | ------------------------ | --------------------- |
| Hot Reload      | ✅                   | ❌                       | ❌                    |
| Mongo Express   | ✅                   | ❌                       | ❌                    |
| Volume Mounting | ✅                   | ❌                       | ❌                    |
| Restart Policy  | `no`                 | `unless-stopped`         | `always`              |
| BCrypt Rounds   | 10                   | 12                       | 14                    |
| Rate Limit      | 100/min              | 50/min                   | 30/min                |
| Database        | `eventknit-auth-dev` | `eventknit-auth-staging` | `eventknit-auth-prod` |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 API Endpoints

### Health Check

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information

### Authentication (Coming Soon)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

## 🔒 Security Features

- **Helmet.js**: Security headers
- **Rate Limiting**: Prevent brute force attacks
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Request sanitization
- **Password Hashing**: Bcrypt with configurable rounds
- **JWT Security**: Secure token handling

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, email support@vistracraft.com or create an issue in the repository.


## Install Packages
npm install express cors helmet express-rate-limit dotenv bcryptjs jsonwebtoken mongoose validator morgan multer multer-gridfs-storage @types/express @types/cors @types/node @types/bcryptjs @types/jsonwebtoken @types/morgan @types/multer @types/supertest @types/jest typescript ts-node nodemon jest supertest ts-jest @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint rimraf
