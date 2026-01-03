# EventKnit Client

The frontend application for EventKnit, built with React, Vite, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.8
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI Primitives
- **Icons**: Lucide React
- **Routing**: React Router DOM v7
- **Charts**: Recharts
- **State Management**: React Context / Hooks
- **QR Scanner**: html5-qrcode
- **Testing**: Vitest + React Testing Library

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

---

## Quick Start

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Environment Configuration

The client uses Vite's proxy configuration to forward API requests to the backend.

**Default Proxy Configuration** (in `vite.config.ts`):
- Requests to `/api/*` are proxied to `http://localhost:3001`
- This means the backend server should be running on port 3001

**Optional Environment Variables**:

Create a `.env` file if you need to override defaults:

```env
# Override API Base URL (for production builds)
VITE_API_BASE_URL=https://api.eventknit.com/api/v1

# Override Frontend URL
VITE_FRONTEND_URL=http://localhost:5173

# OAuth Configuration (for social login)
VITE_GOOGLE_CLIENT_ID=your-google-client-id
VITE_FACEBOOK_APP_ID=your-facebook-app-id
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

> **Note**: Make sure the backend server is running on port 3001 before starting the client.

---

## Development Commands

### Running the Application

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server with HMR |
| `npm run preview` | Preview production build locally |

### Building for Production

| Command | Description |
|---------|-------------|
| `npm run build` | Build for production (default) |
| `npm run build:dev` | Build with development mode |
| `npm run build:staging` | Build with staging mode |
| `npm run build:prod` | Build with production mode |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Run ESLint on the codebase |
| `npm run type-check` | Run TypeScript type checking |
| `npm run pre-push` | Run lint, type-check, tests, and build (CI check) |

### Testing

| Command | Description |
|---------|-------------|
| `npm test` | Run tests in interactive mode |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:run` | Run tests once (CI mode) |

---

## Project Structure

```
client/
├── public/                 # Static assets (favicon, etc.)
├── src/
│   ├── assets/             # Images, fonts, etc.
│   ├── components/
│   │   ├── ui/             # Radix/Tailwind primitives (Button, Input, etc.)
│   │   ├── event-attendee/ # Event attendee view components
│   │   └── ...             # Feature-specific components
│   ├── contexts/           # React Context providers
│   │   ├── AuthContext.tsx # Authentication state
│   │   └── ThemeContext.tsx# Theme (dark/light mode)
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   └── ...
│   ├── layouts/            # Page layouts
│   │   ├── DashboardLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── lib/                # Utilities and API clients
│   │   ├── api.ts          # Core API client with interceptors
│   │   ├── event-api.ts    # Event-related API functions
│   │   ├── auth-api.ts     # Authentication API functions
│   │   └── utils.ts        # Helper utilities (cn, etc.)
│   ├── pages/              # Application pages/routes
│   │   ├── auth/           # Login, Register, etc.
│   │   ├── user/           # User dashboard pages
│   │   ├── organizer/      # Organizer dashboard pages
│   │   └── admin/          # Admin dashboard pages
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main application component with routes
│   └── main.tsx            # Entry point
├── index.html
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.ts          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── eslint.config.js        # ESLint configuration
└── package.json
```

---

## Key Features

### For Attendees
- **Event Discovery**: Browse and search events
- **Ticket Purchase**: Secure ticket purchasing with Paystack/Stripe
- **Digital Wallet**: Store and manage tickets digitally
- **Ticket Transfer**: Transfer tickets to other users
- **QR Code Tickets**: Digital tickets with QR codes for check-in

### For Organizers
- **Event Creation**: Multi-step form for creating events
- **Attendee Management**: View and manage event registrations
- **Ticket Scanning**: QR code scanner for check-in
- **Analytics Dashboard**: View event performance metrics
- **Revenue Tracking**: Track ticket sales and revenue

### For Admins
- **User Management**: Manage all platform users
- **Event Moderation**: Approve/reject events
- **Platform Analytics**: System-wide statistics
- **KYC Verification**: Verify organizer identities

---

## Styling Guide

We use **Tailwind CSS** for styling with custom theme configuration.

### Utility Classes
- Use utility classes for layout, spacing, and typography
- Use responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`

### Class Merging
Use the `cn()` utility from `src/lib/utils.ts` for conditional class merging:

```tsx
import { cn } from "@/lib/utils";

<button className={cn(
  "px-4 py-2 rounded",
  isActive && "bg-primary text-white",
  disabled && "opacity-50 cursor-not-allowed"
)}>
  Click me
</button>
```

### UI Components
Pre-built components in `src/components/ui/`:
- `Button` - Buttons with variants
- `Input` - Form inputs
- `Card` - Card containers
- `Dialog` - Modal dialogs
- `Select` - Dropdown selects
- `Toast` - Toast notifications
- And more...

---

## API Integration

API calls are centralized in `src/lib/`.

### Core API Client (`api.ts`)
- Base `apiRequest` function with error handling
- Automatic auth token injection
- Response interceptors for token refresh

### Feature-Specific APIs
```typescript
// Event APIs
import { getEvents, getEventById, createEvent } from "@/lib/event-api";

// Auth APIs
import { login, register, logout } from "@/lib/auth-api";

// Ticket APIs
import { getUserTickets, transferTicket } from "@/lib/ticket-api";
```

---

## Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.json`:

```typescript
// Instead of relative imports
import { Button } from "../../../components/ui/button";

// Use path aliases
import { Button } from "@/components/ui/button";
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| API requests failing | Ensure backend is running on port 3001 |
| Port 5173 in use | Kill process: `kill -9 $(lsof -ti :5173)` |
| Type errors | Run `npm run type-check` to see all errors |
| Module not found | Try `rm -rf node_modules && npm install` |
| Vite cache issues | Clear cache: `rm -rf node_modules/.vite` |

### Checking Ports

```bash
# Check if ports are in use
lsof -i :5173 -i :3001

# Kill process on specific port
kill -9 $(lsof -ti :5173)
```

### Resetting the Project

```bash
# Remove node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite

# Clear build output
rm -rf dist
```

---

## Environment Modes

Vite supports multiple build modes:

| Mode | Command | Use Case |
|------|---------|----------|
| development | `npm run build:dev` | Local testing with debug info |
| staging | `npm run build:staging` | Pre-production testing |
| production | `npm run build:prod` | Live deployment |

Create environment-specific files:
- `.env.development` - Development variables
- `.env.staging` - Staging variables
- `.env.production` - Production variables

---

## Contributing

1. Create a feature branch from `development`
2. Make your changes
3. Run quality checks: `npm run pre-push`
4. Submit a pull request

---

## License

This project is proprietary and confidential.
