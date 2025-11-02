#!/bin/bash

# EventKnit Server Setup Script
# Run this script to set up PostgreSQL, Prisma, and seed the database

set -e  # Exit on error

echo "🚀 EventKnit Server Setup"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check .env.development
echo -e "${YELLOW}Step 1: Checking .env.development...${NC}"
if [ ! -f ".env.development" ]; then
    echo "Creating .env.development from .env.example..."
    cp .env.example .env.development
    echo -e "${GREEN}✅ .env.development created${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env.development with your actual values before continuing!${NC}"
else
    echo -e "${GREEN}✅ .env.development exists${NC}"
fi
echo ""

# Step 2: Start PostgreSQL
echo -e "${YELLOW}Step 2: Starting PostgreSQL container...${NC}"
docker compose --env-file .env.development up -d postgres
echo -e "${GREEN}✅ PostgreSQL container started${NC}"
echo "Waiting for PostgreSQL to be ready..."
sleep 5
echo ""

# Step 3: Verify PostgreSQL
echo -e "${YELLOW}Step 3: Verifying PostgreSQL connection...${NC}"
if docker exec eventknit-postgres pg_isready -U eventknit > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready yet. Please wait and try again.${NC}"
    exit 1
fi
echo ""

# Step 4: Generate Prisma Client
echo -e "${YELLOW}Step 4: Generating Prisma Client...${NC}"
npm run prisma:generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Step 5: Run migrations
echo -e "${YELLOW}Step 5: Running database migrations...${NC}"
echo "Enter a migration name (or press Enter for 'init'):"
read -r migration_name
migration_name=${migration_name:-init}
npx prisma migrate dev --name "$migration_name"
echo -e "${GREEN}✅ Migrations applied${NC}"
echo ""

# Step 6: Seed database
echo -e "${YELLOW}Step 6: Seeding database (creating superadmin)...${NC}"
npm run prisma:seed
echo -e "${GREEN}✅ Database seeded${NC}"
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Start the server: npm run dev"
echo "2. Open Prisma Studio: npm run prisma:studio"
echo "3. Test API: curl http://localhost:3001/health"
echo ""

