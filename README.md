# EventKnit - Ticketing Platform

A comprehensive event ticketing platform built as a monolithic application with React frontend and Node.js backend.

## 🏗️ Architecture

This project follows a **separate hosting architecture** with independent client and server deployments:

```
eventknit/
├── client/          # React frontend (Vite + TypeScript + Tailwind)
│   ├── deploy.sh    # Client deployment script
│   └── Dockerfile   # Client containerization
├── server/          # Node.js backend (Express + TypeScript + MongoDB)
│   ├── deploy.sh    # Server deployment script
│   ├── docker-compose.yml  # Server orchestration
│   └── .env.*       # Environment-specific configurations
└── README.md
```

### 🎯 Separate Hosting Benefits

- **Independent Scaling**: Scale client and server separately based on demand
- **Technology Flexibility**: Deploy client to CDN, server to cloud
- **Development Efficiency**: Work on client/server independently
- **Deployment Flexibility**: Different deployment strategies per service
- **Resource Optimization**: Allocate resources based on service needs

## 🚀 Features

### Frontend (Client)

- **Modern React App**: Built with Vite, TypeScript, and React 19
- **UI Components**: Radix UI primitives with Tailwind CSS
- **Multiple Dashboards**: Admin, Organizer, and User interfaces
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Testing**: Vitest and React Testing Library
- **Type Safety**: Full TypeScript support

### Backend (Server)

- **RESTful API**: Express.js with TypeScript
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Database**: MongoDB with Mongoose ODM
- **Security**: Helmet.js, rate limiting, CORS
- **Testing**: Jest and Supertest
- **Docker Support**: Multi-environment configurations

## 📋 Prerequisites

- Node.js 20+
- MongoDB 7.0+
- Docker & Docker Compose (optional)
- npm or yarn

## 🛠️ Development Setup

### Option 1: Local Development

1. **Clone and setup**

   ```bash
   git clone <repository-url>
   cd eventknit
   ```

2. **Setup Backend**

   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Setup Frontend** (in another terminal)

   ```bash
   cd client
   npm install
   npm run dev
   ```

4. **Start MongoDB**

   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0

   # Or start your local MongoDB service
   ```

### Option 2: Docker Development

1. **Start all services**

   ```bash
   docker-compose up -d
   ```

2. **View logs**

   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## 🔧 Available Scripts

### Client Scripts

```bash
cd client
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run lint         # Run ESLint
```

### Server Scripts

```bash
cd server
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm run lint         # Run ESLint
```

## 🌐 API Endpoints

### Health Check

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health information

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

## 🐳 Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

```bash
# Build and start production services
docker-compose -f docker-compose.yml up -d --build
```

### Services

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **MongoDB**: localhost:27017
- **Nginx Proxy**: http://localhost:80

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Security**: Bcrypt hashing
- **Rate Limiting**: Protection against brute force
- **Security Headers**: Helmet.js implementation
- **CORS**: Configurable cross-origin requests
- **Input Validation**: Request sanitization

## 🧪 Testing

### Frontend Tests

```bash
cd client
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Generate coverage report
```

### Backend Tests

```bash
cd server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
```

## 📁 Project Structure

### Client Structure

```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── data/          # Mock data and analytics
│   ├── types/         # TypeScript type definitions
│   ├── lib/           # Utility functions
│   └── assets/        # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── Dockerfile
```

### Server Structure

```
server/
├── src/
│   ├── config/        # Configuration files
│   ├── controllers/   # Route controllers
│   ├── middleware/    # Custom middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── package.json
├── tsconfig.json
└── Dockerfile
```

## 🌿 Development Workflow

1. **Feature Development**

   ```bash
   git checkout -b feature/your-feature-name
   # Make changes
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   # Create PR
   ```

2. **Testing**

   ```bash
   # Run all tests
   cd client && npm test
   cd ../server && npm test
   ```

3. **Building**
   ```bash
   # Build both client and server
   cd client && npm run build
   cd ../server && npm run build
   ```

## 📝 Environment Variables

### Server (.env)

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/eventknit
JWT_SECRET=your-super-secret-jwt-key
BCRYPT_ROUNDS=10
```

### Client (.env)

```env
VITE_API_URL=http://localhost:3001
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run linting and tests
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, create an issue in the repository or contact the development team.
