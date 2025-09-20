# EventKnit UI

A modern React application built with TypeScript, Vite, and Tailwind CSS, following best practices for development and deployment.

## 🚀 Features

- ⚡ Blazing fast development with Vite
- 🎨 Styled with Tailwind CSS
- 🧪 Comprehensive testing setup
- 🚀 CI/CD pipeline with GitHub Actions
- 🔒 Type-safe with TypeScript
- 🎯 ESLint for code quality and consistency
- 🧪 Vitest for fast unit and integration testing

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

- **Linting**: ESLint with TypeScript support
- **Type Checking**: TypeScript compiler validation
- **Testing**: Vitest test suite execution
- **Build Verification**: Production build validation
- **Artifact Upload**: Build files for deployment

### Continuous Deployment (CD)

- Automated deployment to staging environment when code is merged to `staging`
- Automated deployment to production when code is merged to `main`
- Preview deployments for PRs

### Environment Variables

Environment variables are managed through GitHub Secrets and are automatically injected during deployment:

- `STAGING_*` - For staging environment
- `PRODUCTION_*` - For production environment

## 🧪 Testing

We use **Vitest** as our testing framework with React Testing Library for component testing.

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run test coverage
npm test:coverage
```

### Testing Setup

- **Framework**: Vitest (optimized for Vite projects)
- **Component Testing**: React Testing Library
- **Test Environment**: jsdom
- **Coverage**: Built-in coverage reporting

### Writing Tests

Tests are located in `src/` with `.test.tsx` or `.test.ts` extensions. Example:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import MyComponent from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
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

### Development Workflow

1. **Create Feature Branch**: `git checkout -b feature/your-feature-name`
2. **Make Changes**: Write code, add tests, update documentation
3. **Run Tests**: `npm test` to ensure all tests pass
4. **Lint Code**: `npm run lint` to check code quality
5. **Build Project**: `npm run build` to verify production build
6. **Commit Changes**: Use descriptive commit messages
7. **Push & Create PR**: Push branch and create pull request
8. **Code Review**: Address feedback and ensure CI passes
9. **Merge**: Merge to `development` branch

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
