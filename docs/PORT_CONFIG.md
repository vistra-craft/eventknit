# EventKnit Port Configuration

**Central port configuration for all EventKnit applications.**

## Development Ports

| Service | Port | Configuration File | Notes |
|---------|------|-------------------|-------|
| **Backend API** | `3001` | `server/.env.development` | Main Node.js/Express server |
| **Frontend Web** | `5173` | `client/vite.config.ts` | Vite dev server (default) |
| **Mobile App** | N/A | `eventknit_mobile/lib/api/endpoints.dart` | Connects to backend on 3001 |
| **PostgreSQL** | `5432` | `server/.env.development` | Database |
| **Redis** | `6379` | `server/.env.development` | Cache & sessions |
| **PgAdmin** | `8080` | `server/.env.development` | Database admin UI |

## Port Configuration Files

### Backend Server
**File:** `server/.env.development`
```env
PORT=3001
POSTGRES_PORT=5432
REDIS_PORT=6379
PGADMIN_PORT=8080
SMTP_PORT=587
```

### Frontend Web
**File:** `client/vite.config.ts`
```typescript
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Must match backend PORT
        changeOrigin: true,
      },
    },
  },
});
```

### Mobile App
**File:** `eventknit_mobile/lib/api/endpoints.dart`
```dart
class ApiEndpoints {
  static const String localUrl = 'http://localhost:3001/api/v1';  // Must match backend PORT
  // ...
}
```

## Changing Ports

**To change the backend port:**

1. Update `server/.env.development`:
   ```env
   PORT=<new_port>
   ```

2. Update `client/vite.config.ts` proxy target:
   ```typescript
   target: 'http://localhost:<new_port>'
   ```

3. Update `eventknit_mobile/lib/api/endpoints.dart`:
   ```dart
   static const String localUrl = 'http://localhost:<new_port>/api/v1';
   ```

4. **Restart all services:**
   - Backend: `cd server && npm run dev`
   - Frontend: `cd client && npm run dev`
   - Mobile: **Full restart** (stop and start, not hot reload)

## Production Ports

| Service | Port | Notes |
|---------|------|-------|
| Backend API | `80/443` | Behind reverse proxy (NGINX) |
| Frontend Web | `80/443` | Served as static files via CDN |
| PostgreSQL | `5432` | Not exposed publicly |
| Redis | `6379` | Not exposed publicly |

## Port Conflicts

If you encounter "Port already in use" errors:

```bash
# Find what's using the port
lsof -i :3001

# Kill the process (replace PID)
kill -9 <PID>
```

## Notes

- **Frontend (5173)** proxies API requests to backend (3001) during development
- **Mobile app** connects directly to backend (3001) - no proxy
- **Production** uses standard HTTP/HTTPS ports (80/443) with reverse proxy
- Always keep this file updated when changing ports
