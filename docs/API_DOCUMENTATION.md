# EventKnit API Documentation

## Accessing the Documentation

The EventKnit API documentation is available via Swagger UI when the server is running.

### Development Environment
```
http://localhost:3001/api-docs
```

### Production Environment
```
https://api.eventknit.com/api-docs
```

## Getting Started

1. **Start the server**
   ```bash
   npm run dev
   ```

2. **Open your browser** and navigate to `http://localhost:3001/api-docs`

3. **Explore the API** - You'll see an interactive interface with all available endpoints

## Using the Documentation

### Testing Endpoints

1. **Expand an endpoint** by clicking on it
2. Click **"Try it out"** button
3. Fill in any required parameters or request body
4. Click **"Execute"** to test the endpoint
5. View the response below

### Authentication

For protected endpoints (marked with a lock icon 🔒):

1. First, login or register using the `/auth/login` or `/auth/register` endpoint
2. Copy the `accessToken` from the response
3. Click the **"Authorize"** button at the top of the page
4. Enter: `Bearer <your_access_token>`
5. Click **"Authorize"**
6. Now you can test protected endpoints

### Example: Testing Login

1. Navigate to **Authentication** section
2. Expand **POST /auth/login**
3. Click **"Try it out"**
4. Enter credentials:
   ```json
   {
     "email": "user@example.com",
     "password": "yourpassword"
   }
   ```
5. Click **"Execute"**
6. Copy the `accessToken` from the response
7. Use this token to authenticate other requests

## API Structure

The API is organized into the following sections:

- **Authentication** - User registration, login, OAuth, password management
- **Events** - Event CRUD operations, approvals, registrations
- **Tickets** - Ticket viewing, downloading, resending
- **Payments** - Payment initialization, verification, webhooks
- **Users** - User profile management, preferences, role switching
- **Organizers** - Organizer dashboard, staff management, events
- **Admin** - User management, system settings, financial operations
- **Notifications** - Notification preferences and management
- **Analytics** - Analytics and reporting endpoints
- **Financial** - Financial management and reporting

## Key Features

### Multi-Method Authentication
- Email/Password
- Google OAuth
- Apple Sign In
- Email OAuth (Passwordless)
- Magic Links

### Role-Based Access Control
- **SUPERADMIN** - Full system access
- **ADMIN** - Administrative access
- **ADMIN_STAFF** - Staff-level admin access
- **ORGANIZER** - Event organizer access
- **ORGANIZER_STAFF** - Organizer staff access
- **ATTENDEE** - Regular user access

### Payment Methods
- Paystack
- Stripe
- M-Pesa
- Cash

### Event Types
- **PHYSICAL** - In-person events
- **VIRTUAL** - Online events
- **HYBRID** - Mixed events

## Common Response Formats

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "An error occurred",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **General endpoints**: Standard rate limit
- **Authentication endpoints**: Stricter rate limit
- **Guest operations**: Additional rate limiting

## Updating the Documentation

The API documentation is defined in `swagger.yaml` at the root of the server directory.

To add or modify endpoints:

1. Edit the `swagger.yaml` file
2. Follow the OpenAPI 3.0 specification
3. Restart the server to see changes

## Need Help?

- Check the detailed request/response schemas in each endpoint
- Look at the example values provided
- Review error codes and messages
- Contact support at: support@eventknit.com

---

**Note**: Some endpoints require specific roles or permissions. Check the endpoint description for access requirements.
