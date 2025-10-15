#!/bin/bash

# EventKnit Development Script
# This script helps you run both client and server in development mode

echo "🚀 Starting EventKnit Development Environment"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

# Check if MongoDB is running
if ! nc -z localhost 27017 2>/dev/null; then
    echo "⚠️  MongoDB is not running on localhost:27017"
    echo "   Please start MongoDB or run: docker run -d -p 27017:27017 --name mongodb mongo:7.0"
    echo ""
fi

# Function to run server
run_server() {
    echo "🔧 Starting Server..."
    cd server
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing server dependencies..."
        npm install
    fi
    npm run dev
}

# Function to run client
run_client() {
    echo "🎨 Starting Client..."
    cd client
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing client dependencies..."
        npm install
    fi
    npm run dev
}

# Check command line arguments
case "${1:-both}" in
    "server")
        run_server
        ;;
    "client")
        run_client
        ;;
    "both"|"")
        echo "🔄 Starting both client and server..."
        echo "   Server will run on http://localhost:3001"
        echo "   Client will run on http://localhost:5173"
        echo ""
        
        # Start server in background
        run_server &
        SERVER_PID=$!
        
        # Wait a moment for server to start
        sleep 3
        
        # Start client
        run_client &
        CLIENT_PID=$!
        
        # Wait for both processes
        wait $SERVER_PID $CLIENT_PID
        ;;
    "docker")
        echo "🐳 Starting with Docker..."
        docker-compose up -d
        echo "   Services started! Check logs with: docker-compose logs -f"
        ;;
    "stop")
        echo "🛑 Stopping services..."
        docker-compose down
        pkill -f "npm run dev"
        echo "   All services stopped!"
        ;;
    *)
        echo "Usage: $0 [server|client|both|docker|stop]"
        echo ""
        echo "Commands:"
        echo "  server  - Run only the backend server"
        echo "  client  - Run only the frontend client"
        echo "  both    - Run both client and server (default)"
        echo "  docker  - Run with Docker Compose"
        echo "  stop    - Stop all running services"
        exit 1
        ;;
esac
