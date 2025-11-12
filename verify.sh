#!/bin/bash

# EventKnit - Quick Verification Script
# This script checks if both frontend and backend are running correctly

echo "🔍 EventKnit Connection Verification"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Backend
echo "Checking Backend (http://localhost:3000)..."
if curl -s -f http://localhost:3000/health > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
    echo "   Health check response:"
    curl -s http://localhost:3000/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/health
else
    echo -e "${RED}❌ Backend is not running${NC}"
    echo "   Expected: http://localhost:3000/health"
    echo "   Start backend with: cd server && npm run dev"
fi

echo ""
echo "Checking API Status..."
if curl -s -f http://localhost:3000/api/v1/status > /dev/null; then
    echo -e "${GREEN}✅ API is accessible${NC}"
    echo "   API status response:"
    curl -s http://localhost:3000/api/v1/status | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3000/api/v1/status
else
    echo -e "${RED}❌ API is not accessible${NC}"
fi

echo ""
echo "Checking Frontend (http://localhost:5173)..."
if curl -s -f http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${RED}❌ Frontend is not running${NC}"
    echo "   Expected: http://localhost:5173"
    echo "   Start frontend with: cd client && npm run dev"
fi

echo ""
echo "Checking PostgreSQL..."
if nc -z localhost 5432 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not running${NC}"
    echo "   Start PostgreSQL with: docker compose -f server/docker-compose.yml up -d postgres"
fi

echo ""
echo "===================================="
echo "Configuration Summary:"
echo "  Backend API: http://localhost:3000"
echo "  Frontend:    http://localhost:5173"
echo "  PostgreSQL: localhost:5432"
echo ""
echo "Next steps:"
echo "  1. Ensure both services are running"
echo "  2. Open http://localhost:5173 in your browser"
echo "  3. Check browser DevTools Network tab for API calls"
echo ""









