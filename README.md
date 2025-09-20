# EventKnit UI

A modern React application built with TypeScript, Vite, and Tailwind CSS, following best practices for development and deployment.

## 🚀 Features

- ⚡ Blazing fast development with Vite
- 🎨 Styled with Tailwind CSS
- 🧪 Comprehensive testing setup
- 🚀 CI/CD pipeline with GitHub Actions
- 🔒 Type-safe with TypeScript
- 🎯 ESLint and Prettier for code quality
- 📝 Standardized PR templates for better collaboration

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- npm 9+ or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/eventknit-ui.git
cd eventknit-ui

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🌿 Branching Strategy

We follow the Git Flow branching model with the following main branches:

- `main` - Production-ready code that's always deployable
- `development` - Main development branch where features are integrated
- `staging` - Pre-production branch for testing before release

### Branch Naming Conventions

- `feature/<feature-name>` - For new features
- `fix/<issue-description>` - For bug fixes
- `hotfix/<issue-description>` - For critical production fixes
- `chore/<task-description>` - For maintenance tasks

### Workflow

1. Create a new feature branch from `development`:
   ```bash
   git checkout development
   git pull origin development
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with a descriptive message

3. Push your branch and create a Pull Request (PR) to `development`

4. After code review and successful CI checks, merge into `development`

5. When ready for release, create a PR from `development` to `staging` for final testing

6. Once verified in staging, create a PR to `main` for production deployment

## 🔄 CI/CD Pipeline

We use GitHub Actions for our CI/CD pipeline. The workflow includes:

### Continuous Integration (CI)

- Linting and type checking
- Unit tests
- Build verification
- Security scanning

### Continuous Deployment (CD)

- Automated deployment to staging environment when code is merged to `staging`
- Automated deployment to production when code is merged to `main`
- Preview deployments for PRs

### Environment Variables

Environment variables are managed through GitHub Secrets and are automatically injected during deployment:

- `STAGING_*` - For staging environment
- `PRODUCTION_*` - For production environment

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run test coverage
npm test:coverage
```

## 📦 Build

Create a production build:

```bash
npm run build
```

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request using the appropriate template

### Pull Request Templates

We use different PR templates based on the type of change:

- **Bugfix**: For fixing bugs or regressions
- **Feature**: For adding new features
- **Chore**: For maintenance tasks, dependency updates, or cleanup
- **Config**: For configuration or setup changes

Each template includes a checklist to ensure all necessary information is provided and the change is properly tested.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
