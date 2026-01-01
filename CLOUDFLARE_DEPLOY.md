# Cloudflare Workers Deployment Guide

This guide will help you deploy your MIT Bot to Cloudflare Workers for 24/7 operation - **completely free** (up to 100,000 requests/day).

## Why Cloudflare Workers?

- ✅ **100% Free** - Free tier includes 100,000 requests/day (more than enough)
- ✅ **Serverless** - No servers to manage
- ✅ **Global Edge Network** - Fast response times worldwide
- ✅ **Built-in Cron** - Scheduled tasks included
- ✅ **D1 Database** - Free SQL database (5GB storage)
- ✅ **Works when computer is off** - Runs on Cloudflare's infrastructure

## Prerequisites

1. **Cloudflare Account** - Sign up at https://cloudflare.com (free)
2. **Node.js** - Already installed ✅
3. **Telegram Bot Token** - You already have this ✅

## Step-by-Step Deployment

### 1. Install Wrangler (Cloudflare CLI)

```bash
npm install
```

This will install wrangler along with other dependencies.

### 2. Login to Cloudflare

```bash
npx wrangler login
```

This will open your browser to authenticate with Cloudflare.

### 3. Create D1 Database

```bash
npx wrangler d1 create mit-bot-db
```

You'll see output like:
```
Created D1 database mit-bot-db
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Copy the `database_id`** and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mit-bot-db"
database_id = "YOUR_DATABASE_ID_HERE"  # <-- Replace with your database_id
```

### 4. Initialize Database Schema

```bash
npx wrangler d1 execute mit-bot-db --file=./worker/schema.sql
```

This creates the tables in your D1 database.

### 5. Set Secrets

Set your bot token and webhook secret:

```bash
# Set bot token
npx wrangler secret put BOT_TOKEN
# When prompted, paste: 8479342226:AAE9P5O36OFkpx4wBuM50pCDmtnEeIUx0TY

# Set webhook secret (generate a random string)
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
# When prompted, paste any random string (e.g., "my-super-secret-webhook-token-xyz123")
```

### 6. Deploy to Cloudflare

```bash
npm run worker:deploy
```

You'll see output like:
```
Uploaded mit-bot-worker
Published mit-bot-worker
  https://mit-bot-worker.YOUR_SUBDOMAIN.workers.dev
```

**Copy your worker URL!**

### 7. Set Up Telegram Webhook

Your worker is now live! Set up the Telegram webhook:

```bash
curl -X POST https://mit-bot-worker.YOUR_SUBDOMAIN.workers.dev/setup
```

You should see: `Webhook set successfully`

### 8. Test the Bot

1. Open Telegram and message `@the_mit_bot`
2. Send `/start`
3. You should receive the welcome message!

## Verify Deployment

### Check if Worker is Running

Visit your worker URL in a browser:
```
https://mit-bot-worker.YOUR_SUBDOMAIN.workers.dev
```

You should see: `MIT Bot Worker is running`

### Check Cron Triggers

In the Cloudflare dashboard:
1. Go to Workers & Pages
2. Click on `mit-bot-worker`
3. Go to "Triggers" tab
4. You should see two cron triggers:
   - `0 10 * * *` (5am EST)
   - `0 0 * * *` (7pm EST)

### View Logs

To see real-time logs:

```bash
npm run worker:tail
```

This will show all logs from your worker in real-time.

## How It Works

### Webhook Mode

- Telegram sends updates to your worker URL: `/webhook`
- Your worker processes messages instantly
- No polling needed (serverless!)

### Scheduled Messages

- **5am EST** - Cloudflare triggers cron at `0 10 * * *` (10am UTC)
- **7pm EST** - Cloudflare triggers cron at `0 0 * * *` (12am UTC next day)
- Cron jobs call your worker's scheduled handler
- Worker sends messages via Telegram API

### Database

- D1 database stores all user data and responses
- Same schema as SQLite version
- Automatically backed up by Cloudflare

## Troubleshooting

### Bot doesn't respond

1. Check webhook is set:
   ```bash
   curl https://api.telegram.org/bot8479342226:AAE9P5O36OFkpx4wBuM50pCDmtnEeIUx0TY/getWebhookInfo
   ```

2. Check worker logs:
   ```bash
   npm run worker:tail
   ```

3. Send a test message to the bot and watch the logs

### Scheduled messages not sending

1. Verify cron triggers in Cloudflare dashboard
2. Check worker logs at 5am/7pm EST
3. Ensure you've sent `/start` to the bot first (registers you)

### Database errors

1. Verify database was created:
   ```bash
   npx wrangler d1 list
   ```

2. Verify schema was applied:
   ```bash
   npx wrangler d1 execute mit-bot-db --command="SELECT name FROM sqlite_master WHERE type='table'"
   ```

## Updating the Worker

After making code changes:

```bash
npm run worker:deploy
```

Cloudflare will automatically deploy the new version.

## Monitoring

### View Metrics

1. Go to Cloudflare Dashboard
2. Navigate to Workers & Pages → mit-bot-worker
3. Click "Metrics" tab
4. See requests, errors, CPU time, etc.

### Check Database

Query your database directly:

```bash
# List all users
npx wrangler d1 execute mit-bot-db --command="SELECT * FROM users"

# Check today's questions
npx wrangler d1 execute mit-bot-db --command="SELECT * FROM daily_questions ORDER BY date DESC LIMIT 5"
```

## Cost

### Free Tier Limits

- **Requests**: 100,000/day (this bot uses ~20/day)
- **CPU Time**: 10ms per request (this bot uses ~1-2ms)
- **D1 Storage**: 5GB (this bot uses <1MB)
- **Cron Triggers**: Unlimited

**Your bot will run 100% free indefinitely!**

### Paid Plan (if you exceed free tier)

- $5/month for Workers Paid plan
- Still very cheap for a 24/7 service

## Advantages Over Railway/Other Platforms

| Feature | Cloudflare Workers | Railway | Other Hosts |
|---------|-------------------|---------|-------------|
| **Cost** | Free (100k req/day) | $5/mo credit | $4-10/mo |
| **Cold Starts** | ~0ms (edge network) | ~1-2s | Varies |
| **Uptime** | 99.99%+ | 99.9% | Varies |
| **Scaling** | Automatic | Manual | Manual |
| **Database** | Included (D1) | Separate | Separate |
| **Cron Jobs** | Built-in | Add-on | Third-party |

## Next Steps

Your bot is now running 24/7 on Cloudflare's global network!

- Messages are instant (edge network)
- Scheduled messages work automatically
- All data is stored in D1
- Completely free (within generous limits)

No need to keep your computer on or manage any servers!

## Useful Commands

```bash
# Deploy
npm run worker:deploy

# Watch logs
npm run worker:tail

# Query database
npx wrangler d1 execute mit-bot-db --command="YOUR SQL HERE"

# List all resources
npx wrangler d1 list
```

## Support

If you encounter issues:
1. Check the logs: `npm run worker:tail`
2. Verify webhook: Check Telegram webhook info
3. Test worker: Visit your worker URL
4. Check database: Query D1 directly

Your MIT Bot is now serverless and running globally! 🚀
