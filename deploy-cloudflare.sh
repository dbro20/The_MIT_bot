#!/bin/bash
# Cloudflare Workers Deployment Script for MIT Bot
# Run this script on your local machine (not in the sandbox)

set -e  # Exit on error

echo "🚀 MIT Bot - Cloudflare Workers Deployment"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Bot configuration
BOT_TOKEN="8479342226:AAE9P5O36OFkpx4wBuM50pCDmtnEeIUx0TY"
TARGET_USERNAME="gofordylan"

echo -e "${YELLOW}Step 1: Logging in to Cloudflare...${NC}"
npx wrangler login
echo -e "${GREEN}✓ Logged in${NC}"
echo ""

echo -e "${YELLOW}Step 2: Creating D1 Database...${NC}"
echo "Creating database 'mit-bot-db'..."
DB_OUTPUT=$(npx wrangler d1 create mit-bot-db 2>&1 || true)

# Check if database already exists
if echo "$DB_OUTPUT" | grep -q "already exists"; then
    echo -e "${YELLOW}Database already exists, getting existing database info...${NC}"
    DB_ID=$(npx wrangler d1 list | grep "mit-bot-db" | awk '{print $2}' || echo "")

    if [ -z "$DB_ID" ]; then
        echo -e "${RED}Error: Could not find database ID${NC}"
        echo "Please manually check: npx wrangler d1 list"
        exit 1
    fi
else
    # Extract database_id from output
    DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | sed 's/.*"\(.*\)".*/\1/')

    if [ -z "$DB_ID" ]; then
        echo -e "${RED}Error: Could not extract database ID${NC}"
        echo "Output: $DB_OUTPUT"
        exit 1
    fi
fi

echo -e "${GREEN}✓ Database ID: $DB_ID${NC}"
echo ""

echo -e "${YELLOW}Step 3: Updating wrangler.toml with database ID...${NC}"
# Update wrangler.toml with the database_id
sed -i.bak "s/database_id = \"YOUR_DATABASE_ID_HERE\"/database_id = \"$DB_ID\"/" wrangler.toml
echo -e "${GREEN}✓ Updated wrangler.toml${NC}"
echo ""

echo -e "${YELLOW}Step 4: Initializing database schema...${NC}"
npx wrangler d1 execute mit-bot-db --file=./worker/schema.sql
echo -e "${GREEN}✓ Database schema created${NC}"
echo ""

echo -e "${YELLOW}Step 5: Setting secrets...${NC}"
echo "Setting BOT_TOKEN..."
echo "$BOT_TOKEN" | npx wrangler secret put BOT_TOKEN

echo "Setting TELEGRAM_WEBHOOK_SECRET..."
# Generate a random webhook secret
WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
echo "$WEBHOOK_SECRET" | npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
echo -e "${GREEN}✓ Secrets set${NC}"
echo ""

echo -e "${YELLOW}Step 6: Deploying to Cloudflare Workers...${NC}"
npx wrangler deploy
echo -e "${GREEN}✓ Deployed!${NC}"
echo ""

echo -e "${YELLOW}Step 7: Getting worker URL...${NC}"
WORKER_URL=$(npx wrangler deployments list 2>&1 | grep "https://" | head -n 1 | awk '{print $1}' || echo "")

if [ -z "$WORKER_URL" ]; then
    echo -e "${YELLOW}Could not automatically detect worker URL${NC}"
    echo "Please check your Cloudflare dashboard for the worker URL"
    echo "It should be something like: https://mit-bot-worker.YOUR_SUBDOMAIN.workers.dev"
    echo ""
    read -p "Enter your worker URL: " WORKER_URL
fi

echo -e "${GREEN}Worker URL: $WORKER_URL${NC}"
echo ""

echo -e "${YELLOW}Step 8: Setting up Telegram webhook...${NC}"
WEBHOOK_RESPONSE=$(curl -s -X POST "$WORKER_URL/setup")
echo "Response: $WEBHOOK_RESPONSE"

if echo "$WEBHOOK_RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✓ Webhook configured!${NC}"
else
    echo -e "${RED}⚠ Webhook setup may have failed. Check logs.${NC}"
fi
echo ""

echo -e "${GREEN}=========================================="
echo "🎉 Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Your bot is now live at: $WORKER_URL"
echo ""
echo "Next steps:"
echo "1. Open Telegram and message @the_mit_bot"
echo "2. Send /start to register"
echo "3. You'll receive messages at 5am and 7pm EST"
echo ""
echo "Useful commands:"
echo "  - View logs:    npm run worker:tail"
echo "  - Redeploy:     npm run worker:deploy"
echo "  - Query DB:     npx wrangler d1 execute mit-bot-db --command='SELECT * FROM users'"
echo ""
echo -e "${GREEN}✓ Your bot is running 24/7 on Cloudflare's global network!${NC}"
