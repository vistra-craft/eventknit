# EventKnit Client

The frontend application for EventKnit, built with React, Vite, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI Primitives
- **Icons**: Lucide React
- **Routing**: React Router DOM (v7)
- **State Management**: React Context / Hooks
- **Testing**: Vitest + React Testing Library

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

## Getting Started

### 1. Installation

Navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

### 2. Environment Configuration

The client relies on environment variables to connect to the backend API.

**Development**:
The project uses a proxy configuration in `vite.config.ts` to forward requests to the backend.
- By default, requests to `/api` are proxied to `http://localhost:3000`.
- The API base URL is automatically handled in `src/lib/api.ts`.

**Production**:
You can override the API URL by setting environment variables.

Create a `.env` file (optional for local dev if using defaults):

```env
# Optional: Override API Base URL
# VITE_API_BASE_URL=http://localhost:3000/api/v1

# Optional: Override Frontend URL
# VITE_FRONTEND_URL=http://localhost:5173
```

### 3. Running the Application

**Development Server**:
Starts the Vite development server with hot module replacement (HMR).
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

**Quality Checks**:
- TypeScript: `npm run type-check`
- Lint: `npm run lint`

**Production Build**:
Builds the application for production.
```bash
npm run build
```

**Preview Production Build**:
Locally preview the production build.
```bash
npm run preview
```

## Testing

Run the test suite using Vitest:

```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## Project Structure

```
client/
├── public/              # Static assets
├── src/
│   ├── assets/          # Images, fonts, etc.
│   ├── components/      # Reusable UI components
│   │   ├── ui/          # Radix/Tailwind primitives (buttons, inputs, etc.)
│   │   └── ...          # Feature-specific components
│   ├── contexts/        # React Context providers (Auth, Theme, etc.)
│   ├── hooks/           # Custom React hooks
│   ├── layouts/         # Page layouts (Dashboard, Auth, etc.)
│   ├── lib/             # Utilities and API clients
│   │   ├── api.ts       # Core API client configuration
│   │   └── ...          # Feature-specific API functions
│   ├── pages/           # Application pages/routes
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Entry point
├── index.html
├── tailwind.config.js   # Tailwind CSS configuration
├── vite.config.ts       # Vite configuration
└── package.json
```

## Key Features

-   **Responsive Design**: Mobile-first UI built with Tailwind CSS.
-   **Authentication**: Login, Registration, Password Reset flows.
-   **Dashboard**: Comprehensive dashboards for Organizers and Admins.
-   **Event Creation**: Multi-step forms for creating and managing events.
-   **Ticket Scanning**: Integrated QR code scanner.
-   **Real-time Updates**: Optimistic UI updates and feedback.

## Styling Guide

We use **Tailwind CSS** for styling.
-   Use utility classes for layout and spacing.
-   Use the `cn()` utility (from `src/lib/utils.ts`) for conditional class merging.
-   UI components are located in `src/components/ui`.

## API Integration

API calls are centralized in `src/lib/`.
-   `api.ts`: Contains the base `apiRequest` function with interceptors for auth tokens.
-   Feature-specific files (e.g., `event-api.ts`, `auth-api.ts`) export typed functions for backend endpoints.
