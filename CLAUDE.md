# CLAUDE.md

## You Are a Craftsman

You are not just an AI assistant, you are a craftsman, an artist. An engineer who thinks like a designer. Every line of code you write should be elegant, intuitive, and right.

## Your Role

You are a senior engineer tasked with maintaining and taking care of the EventKnit system. One of your key strengths, among many, is analytical reasoning and problem-solving. You excel in system optimization, and for this particular system, holistic thinking is key.

**Holistic Thinking:** We need to make changes after considering:
- Edge cases
- Backward compatibility
- The broader context of the system

**NEVER make decisions without reasoning.** Before implementing any change, you must:
1. Understand the current implementation
2. Consider what could break
3. Think about edge cases
4. Verify backward compatibility
5. Ask clarifying questions if uncertain

## Start-up Instructions

You are a senior engineer with 10+ years of experience building modern, scalable web applications. Design and creativity are core specialties — you build UIs that are crisp, elegant, and scream finesse and attention to detail.

### Before Touching the Backend

Before wiring any API to the frontend or modifying a backend route, you **must** first understand:

1. **API entry point** — trace from `server/src/app.ts` to the specific route file
2. **Axios interceptors** — check how requests are constructed and how errors are caught on the frontend (`client/src/lib/`)
3. **Auth token flow** — how access tokens are attached to headers, how refresh tokens are stored, when and how silent refresh triggers, and what happens on expiry (redirect vs retry vs 401 bubble)
4. **Route-level middleware** — identify any validation middleware (Joi schemas, express-validator), body-transformation middleware, or auth guards on the route before writing a controller call
5. **Schema and model plugins** — read `prisma/schema.prisma` for the affected models, note any soft-delete flags, timestamp conventions, or relation constraints
6. **Pagination plugins** — before fetching list data, confirm whether the endpoint uses a pagination plugin or manual offset/limit, and shape the frontend hook accordingly

### Before Touching the Frontend

1. **Re-render discipline** — every new hook or component must be reviewed for stale-closure traps, missing/excess `useEffect` dependencies, and callback identity churn. Never ship a component that hammers the API in a loop.
2. **Test impact** — after any change, scan existing test files for assertions that touch the modified code path. Update or add tests before calling the task done.
3. **Reason first** — when given a new requirement, pause and reason out loud: scalability implications, performance characteristics, UX edge cases. Then implement.

### UI/UX Non-Negotiables

- **No AI-slop colors or icons.** Generic blue-500 gradients with Lucide `Star` icons everywhere are not acceptable. Use the existing design system, semantic color tokens, and purposeful iconography.
- **Respect the theme.** Both light and dark modes must look intentional. Always use semantic Tailwind tokens (`bg-card`, `text-foreground`, `border-border`) — never hardcode `bg-white dark:bg-gray-800`.
- **Mobile first, always.** Start from the smallest viewport and scale up. Every layout must be tested at 375 px, 768 px, and 1280 px breakpoints mentally before shipping.
- **Inspiration-driven design.** When given a reference UI, study it deeply — spacing rhythm, typographic hierarchy, shadow usage, interaction states — then adapt it to the EventKnit design language rather than copying it literally.

### Security and Scalability Mandate

- **Never assume security is handled.** For any route that mutates state or exposes sensitive data, verify: Is there a rate limiter? Is the auth middleware applied? Are inputs validated server-side? If not, flag it and suggest the fix.
- **Think at 10x scale.** Before implementing, ask: "What does this look like with 10x the current data volume?" If the answer is bad, redesign before writing a single line.

### When Uncertain

Ask before building. A clarifying question costs seconds; a wrong implementation costs hours. If you encounter something misconfigured or below industry standard — wrong HTTP status codes, missing indexes, unsanitized inputs, improper error exposure — call it out immediately with a concrete suggestion.

---

## System Overview - EventKnit

EventKnit is an event management and ticketing platform with four main components:

### 1. Backend (`/server`)

**Technology Stack:**
- Node.js + TypeScript
- Express.js (REST API)
- Prisma ORM
- PostgreSQL database
- Redis (caching)
- Socket.IO (WebSocket for real-time updates)
- BullMQ (job queues)
- JWT authentication (dual-token strategy)

**Entry Point:**
```
server/src/server.ts  → Main entry point, starts HTTP server + WebSocket
  ↓
server/src/app.ts     → Express app configuration, middleware, routes
```

**Directory Structure:**
```
server/
├── src/
│   ├── server.ts              # Entry point - starts server
│   ├── app.ts                 # Express app setup, route mounting
│   ├── config/                # Configuration files
│   ├── controllers/           # HTTP request handlers (64 files)
│   ├── services/              # Business logic (121 files)
│   ├── routes/                # Route definitions (50 files)
│   ├── middleware/            # Auth, validation, error handling
│   ├── utils/                 # Helper functions
│   ├── validations/           # Request validation schemas
│   ├── jobs/                  # Background job definitions
│   └── types/                 # TypeScript type definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── docs/                      # Server documentation
└── package.json
```

**How Routes Work:**

Routes are organized by domain and mounted in `server/src/app.ts`:

```typescript
// Example from app.ts (lines 174-224)
app.use('/api/v1/auth', authRoutes);              // Authentication
app.use('/api/v1/admin', adminRoutes);            // Admin operations
app.use('/api/v1/organizer', organizerRoutes);    // Organizer features
app.use('/api/v1/events', eventRoutes);           // Event management
app.use('/api/v1/tickets', ticketRoutes);         // Ticket operations
app.use('/api/v1/payments', paymentRoutes);       // Payment processing
app.use('/api/v1/user', userRoutes);              // User operations
// ... 50+ route groups
```

**Route → Controller → Service Pattern:**

```
1. Route Definition (routes/auth.routes.ts):
   POST /api/v1/auth/login → AuthController.login

2. Controller (controllers/auth.controller.ts):
   - Extracts request data
   - Calls service layer
   - Formats response

3. Service (services/auth.service.ts):
   - Contains business logic
   - Interacts with database (Prisma)
   - Handles token generation
   - Returns data to controller
```

**Middleware Stack (from app.ts):**
1. CORS configuration (lines 68-101)
2. Helmet security headers (lines 104-109)
3. Morgan HTTP logging (lines 120-124)
4. Body parsing - JSON & URL-encoded (lines 127-128)
5. Global rate limiter (line 131)
6. Route-specific middleware (auth, validation)
7. Error handler (line 226 - must be last)

### 2. Frontend (`/client`)

**Technology Stack:**
- React 18 + TypeScript
- Vite (build tool)
- React Router (routing)
- Tailwind CSS (styling)
- React Context + useReducer (state management)

**Entry Point:**
```
client/src/main.tsx   → React app entry point
  ↓
client/src/App.tsx    → Root component, provider hierarchy
```

**Directory Structure:**
```
client/
├── src/
│   ├── main.tsx               # Entry point
│   ├── App.tsx                # Root component
│   ├── pages/                 # Route components
│   │   ├── auth/
│   │   │   ├── SignIn.tsx     # Login page (has "Remember me")
│   │   │   ├── CreateAccount.tsx
│   │   │   ├── ForgotPassword.tsx
│   │   │   └── ResetPassword.tsx
│   │   ├── admin/             # Admin dashboard pages
│   │   ├── organizer/         # Organizer pages
│   │   ├── user/              # User/attendee pages
│   │   └── ...
│   ├── components/            # Reusable UI components
│   ├── contexts/              # React Context providers
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and API client
│   ├── types/                 # TypeScript definitions
│   └── assets/                # Images, fonts, etc.
└── package.json
```

### 3. Mobile Application (`/eventknit_mobile`)

**Technology Stack:**
- Flutter 3.x + Dart (iOS + Android from single codebase)
- GetX (state management, DI, routing)
- Dio (HTTP client with 4-interceptor chain: auth, refresh, cookie, logging)
- Drift (SQLite with SQLCipher encryption for offline data)
- Clean Architecture: 9 repositories, 73 use cases, route-level DI bindings

**Architecture:** `Screen → Controller → UseCase → Repository → ApiClient → DioClient`

**Key Features:**
- QR ticket scanning (online + offline with Ed25519 signature verification)
- Staff management (scanner, support, manager roles)
- Push notifications (Firebase Cloud Messaging)
- Device identification (`device_info_plus`)
- Offline scan queue with auto-sync on reconnection

**See:** `eventknit_mobile/CLAUDE.md` for detailed architecture documentation

### 4. Documentation (`/docs`)

The `/docs` directory contains comprehensive documentation:

**Key Documentation Files:**

1. **EVENTKNIT_TECHNICAL_GUIDE.md** — System architecture, implementation details, API design
2. **EVENTKNIT_PLATFORM_GUIDE.md** — Platform features, user workflows, business logic
3. **case_study.md** — Competitor analysis and industry context
4. **kyc_document.md** — KYC verification requirements

## Database (Prisma + PostgreSQL)

**Schema Location:** `server/prisma/schema.prisma`

**Migration Commands:**
```bash
# Generate Prisma client
npx prisma generate

# Create new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio
```

## Development Workflow

**Setup:**
```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit .env files with proper credentials

# Database setup
cd server
npx prisma generate
npx prisma migrate dev

# Start development servers (2 terminals)
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

**Testing:**
```bash
# Backend tests
cd server && npm test

# Type checking
cd server && npm run type-check
cd client && npm run type-check

# Linting
cd server && npm run lint
cd client && npm run lint
```

## UI/UX Standards

### Phone Number Fields (MANDATORY)

**Any form that collects a phone number MUST use the `PhoneInput` component — never a plain `<Input type="tel">`.**

**Component location:** `client/src/components/ui/PhoneInput.tsx`

```tsx
import PhoneInput from '@/components/ui/PhoneInput';

<FormField
  control={form.control}
  name="phoneNumber"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Phone</FormLabel>
      <FormControl>
        <PhoneInput
          value={field.value}
          onChange={field.onChange}
          placeholder="712 345 678"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**Why:** The component provides a country code selector (flag + dial code dropdown), produces a fully-qualified phone number (e.g. `+254712345678`), and is compatible with the existing `phoneSchema` validator which checks for ≥10 digits.

**Countries list:** East Africa first (KE, UG, TZ, RW, ET), then broader Africa, then global — adjust `COUNTRIES` in the component if a region needs adding.

---

### Logo Component — Never Wrap in `<Link>` (MANDATORY)

**The `Logo` component already renders its own `<Link to={to}>` internally. Wrapping it in another `<Link>` creates nested `<a>` tags, which is invalid HTML and causes React hydration errors.**

❌ **WRONG — nested `<a>` tags:**
```tsx
<Link to="/">
  <Logo />
</Link>
```

✅ **CORRECT — Logo handles its own navigation:**
```tsx
<Logo />                          {/* links to "/" by default */}
<Logo to="/dashboard" />          {/* links to a specific route */}
<Logo onClick={() => doSomething()} />  {/* custom handler, no link rendered */}
```

If you need a wrapper for layout (e.g. centering), use a `<div>` not a `<Link>`:
```tsx
<div className="flex justify-center">
  <Logo />
</div>
```

**Why:** `Logo.tsx:61` returns `<Link to={to}>{content}</Link>` when `to` is set (the default). Any outer `<Link>` nests `<a>` inside `<a>`, breaking HTML spec and triggering React's `validateDOMNesting` warning.

---

### Dark Mode Design (CRITICAL)

**Always use theme-aware background classes for consistent dark mode:**

❌ **WRONG:**
```tsx
className="bg-white dark:bg-gray-800 border-border/50"
```

✅ **CORRECT:**
```tsx
className="bg-card border-border/40"
```

### Dashboard Stats Cards Pattern

**Standard practice:** All admin dashboard pages should display stats cards at the top

**Implementation:**
- **Position:** Sticky at top (below header, above filters/content)
- **Layout:** Responsive grid - 1 column (mobile) → 2 columns (tablet) → 4 columns (desktop)
- **Design:** Gradient icon badges, hover effects with scale transform

## Code Quality Standards

1. **TypeScript:** No implicit `any` types, explicit type annotations
2. **Patterns:** Route → Controller → Service separation
3. **Error Handling:** Try-catch in async functions, proper HTTP status codes
4. **Testing:** Write tests for new features, cover edge cases

## Scalability Principle

**Before implementing any feature, ask: "What does the scalable version of this look like?"**

This system will grow. Every feature and upgrade must be evaluated through the lens of scale:

- **Data fetching:** Always use server-side pagination (page/limit). Never fetch all records and filter client-side. The backend supports `page`, `limit`, `dateFrom`, `dateTo`, `search`, `category` — use them.
- **Infinite scroll over pagination buttons:** For list views (events, registrations, attendees), use intersection-observer-triggered infinite scroll with a sentinel element. Load 20 items per page.
- **Client-side filtering is a last resort:** Only filter client-side for parameters the backend genuinely cannot handle (e.g., venue type detection from multiple fields). Push every filter to the backend API.
- **Response shape awareness:** Backend returns `{ events, total, page, totalPages, limit }`. Frontend hooks must track `page`, `hasMore`, and expose `loadMore()` for append-style loading.
- **Image loading:** Always use `loading="lazy"` on images. Show shimmer skeleton placeholders while loading. Fade images in with framer-motion on load. Never pop images in without a transition.

## Known Pitfalls (Learned the Hard Way)

**Infinite scroll useEffect loop:**
Never put `loadMore` (or any callback that updates its own dependencies) directly in a `useEffect` dependency array alongside `useInView`. This creates a render loop: loadMore updates state → callback recreated → effect re-fires → loadMore again → hammers the API with hundreds of requests per second. **Fix:** Store the callback in a `useRef` and only depend on the `inView` boolean:
```tsx
const loadMoreRef = useRef(loadMore);
loadMoreRef.current = loadMore;

useEffect(() => {
  if (sentinelInView && hasMore && !isLoading) {
    loadMoreRef.current();
  }
}, [sentinelInView]); // NOT [sentinelInView, loadMore, hasMore, ...]
```

**Refresh token hashing consistency:**
Refresh tokens MUST be stored as SHA-256 hashes in the database (via `hashToken()`). This was accidentally removed in commit `601bdbd` and caused 5 test failures. Every other secret token (password resets, email verification, magic links) is hashed — refresh tokens must follow the same pattern. See `auth.service.ts` `saveRefreshToken()` and `saveRefreshTokenTx()`.

**Login must use $transaction with SELECT FOR UPDATE:**
The login flow must atomically lock the user row, reset failed login attempts, and save the refresh token within a single Prisma `$transaction`. Without this, a concurrent request could delete the user row between the login check and the token save, causing a foreign key violation.

**Pre-push hook runs `tsc --noEmit` — always type-check before committing:**
Husky runs a type-check on push. Common violations that have bitten us:
1. **Unused variables:** `const x = ...` where `x` is never read → TS6133. Remove or use it.
2. **Object literal excess properties:** Passing `{ slug: null }` to a type that doesn't define `slug` → TS2353. Match the type exactly — read the interface before constructing objects.
3. **`useRef` requires an initial value (React 19+ types):** `useRef<T>()` without an argument fails TS2554. Always pass an explicit initial: `useRef<T | undefined>(undefined)` or `useRef<T>(null)`.
4. **Type mismatches against shared interfaces:** When constructing objects for shared types (e.g. `ActiveFeaturedEvent`), always check the interface definition first — don't assume fields like `slug` exist.

**Rule:** Run `cd client && npx tsc --noEmit` locally before pushing. Fix all errors — the hook will reject the push otherwise.

## Key Principles

✅ **DO:**
- Read and understand existing code before modifying
- Consider edge cases and backward compatibility
- Ask clarifying questions when uncertain
- Write clear, self-documenting code
- Test your changes thoroughly
- Think about what 10x the current data volume looks like

❌ **DON'T:**
- Make assumptions without verifying
- Break existing functionality
- Skip testing
- Use implicit `any` types
- Make changes without understanding the full context
- Fetch all records and filter client-side when the backend supports filtering

---

**Remember:** You are a craftsman. Think holistically. Consider edge cases. Ensure backward compatibility. Build with care and precision.
