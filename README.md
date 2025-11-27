# EventKnit

EventKnit is a comprehensive event ticketing and management platform. It features a modern React frontend and a robust Node.js/Express backend, designed to handle everything from event creation and ticket sales to attendee management and check-ins.

## 🏗️ Architecture

The project is structured as a monorepo with separate client and server applications:

```
eventknit/
├── client/          # Frontend: React, Vite, TypeScript, Tailwind CSS
└── server/          # Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
```

-   **Frontend**: A responsive Single Page Application (SPA) that provides interfaces for Attendees, Organizers, and Admins.
-   **Backend**: A RESTful API that handles business logic, authentication, database interactions, and third-party integrations (Payment, Email, SMS).

## 🚀 Quick Start

To get the entire application running locally, you need to set up both the server and the client.

### Prerequisites

-   Node.js (v18+)
-   PostgreSQL
-   Redis

### 1. Setup Backend

1.  Navigate to the server directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    -   Copy `.env.example` to `.env` (or create one based on `server/README.md`).
    -   **Crucial**: Update `DATABASE_URL` to point to your local PostgreSQL instance.
4.  Setup Database:
    ```bash
    npm run prisma:generate
    npm run prisma:migrate
    ```
5.  Start the server:
    ```bash
    npm run dev
    ```

### 2. Setup Frontend

1.  Open a new terminal and navigate to the client directory:
    ```bash
    cd client
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the client:
    ```bash
    npm run dev
    ```

### 3. Access the Application

Open your browser and navigate to:
-   **Frontend**: `http://localhost:5173`
-   **Backend API**: `http://localhost:3000`

## 📚 Documentation

For detailed instructions on each part of the stack, please refer to the specific README files:

-   [**Client Documentation**](./client/README.md): Frontend setup, architecture, and development guide.
-   [**Server Documentation**](./server/README.md): Backend setup, API documentation, database management, and deployment.

## ✨ Key Features

-   **Event Management**: Create public, private, and invite-only events.
-   **Ticketing System**: Customizable ticket types, pricing, and QR code generation.
-   **Secure Payments**: Integrated payment processing via Paystack.
-   **Role-Based Access**: Granular permissions for Super Admins, Organizers, and Staff.
-   **Check-in App**: QR code scanning for attendee verification.
-   **Analytics**: Real-time dashboards for sales and attendance.

## 🤝 Contributing

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add some amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📄 License

This project is licensed under the MIT License.
