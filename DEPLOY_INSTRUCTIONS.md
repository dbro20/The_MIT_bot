# Quick Cloudflare Workers Deployment

Your MIT Bot is ready to deploy to Cloudflare Workers! Follow these simple steps on your **local machine** (not in the Claude Code environment).

## Prerequisites

- ✅ Bot Token: `8479342226:AAE9P5O36OFkpx4wBuM50pCDmtnEeIUx0TY`
- ✅ Cloudflare account (sign up free at https://cloudflare.com)
- ✅ Code already configured and ready

## Option 1: Automated Deployment (Recommended)

Run the deployment script on your local machine:

```bash
# Pull the latest code
git pull origin claude/check-if-working-lt5SY

# Make the script executable
chmod +x deploy-cloudflare.sh

# Run the deployment script
./deploy-cloudflare.sh
```

The script will:
1. Log you into Cloudflare
2. Create a D1 database
3. Initialize the database schema
4. Set up your bot token and secrets
5. Deploy the worker
6. Configure the Telegram webhook

**That's it!** Your bot will be live in ~2 minutes.

---

## Option 2: Manual Step-by-Step

If you prefer to run commands manually:

### 1. Login to Cloudflare

```bash
npx wrangler login
```

This opens your browser to authenticate.

### 2. Create D1 Database

```bash
npx wrangler d1 create mit-bot-db
```

Copy the `database_id` from the output.

### 3. Update wrangler.toml

Edit `wrangler.toml` and replace `YOUR_DATABASE_ID_HERE` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mit-bot-db"
database_id = "paste-your-database-id-here"
```

### 4. Initialize Database Schema

```bash
npx wrangler d1 execute mit-bot-db --file=./worker/schema.sql
```

### 5. Set Bot Token Secret

```bash
npx wrangler secret put BOT_TOKEN
```

When prompted, paste: `8479342226:AAE9P5O36OFkpx4wBuM50pCDmtnEeIUx0TY`

### 6. Set Webhook Secret

```bash
npx wrangler secret put TELEGRAM_WEBHOOK_SECRET
```

When prompted, paste any random string like: `my-super-secret-webhook-12345`

### 7. Deploy Worker

```bash
npx wrangler deploy
```

Copy your worker URL (e.g., `https://mit-bot-worker.YOUR_SUBDOMAIN.workers.dev`)

### 8. Set Up Telegram Webhook

```bash
curl -X POST https://mit-bot-worker.YOUR_SUBDOMAIN.workers.dev/setup
```

You should see: `Webhook set successfully`

---

## Testing Your Bot

1. Open Telegram and search for `@the_mit_bot`
2. Send `/start`
3. You should receive a welcome message!

The bot will automatically send you:
- **5am EST**: "What is the most important thing to do today?"
- **7pm EST**: "Did you complete your most important thing today?"

---

## Monitoring & Management

### View Real-Time Logs

```bash
npm run worker:tail
```

### Check Database

```bash
# List all users
npx wrangler d1 execute mit-bot-db --command="SELECT * FROM users"

# Check recent questions
npx wrangler d1 execute mit-bot-db --command="SELECT * FROM daily_questions ORDER BY date DESC LIMIT 5"
```

### Verify Webhook

```bash
curl https://api.telegram.org/bot8479342226:AAE9P5O36OFkpx4wBuM50pCDmtnEeIUx0TY/getWebhookInfo
```

### Redeploy After Changes

```bash
npx wrangler deploy
```

---

## Troubleshooting

### Bot doesn't respond

1. Check logs: `npm run worker:tail`
2. Verify webhook: Check the curl command above
3. Test worker: Visit your worker URL in browser (should say "MIT Bot Worker is running")

### Scheduled messages not working

1. Go to Cloudflare Dashboard → Workers & Pages → mit-bot-worker → Triggers
2. Verify two cron triggers exist:
   - `0 10 * * *` (5am EST)
   - `0 0 * * *` (7pm EST)

### Database errors

```bash
# Verify database exists
npx wrangler d1 list

# Check tables were created
npx wrangler d1 execute mit-bot-db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

## Cost

**100% FREE** on Cloudflare's free tier:
- 100,000 requests/day (you'll use ~20/day)
- 5GB D1 database storage (you'll use <1MB)
- Unlimited cron triggers

Your bot will run 24/7 completely free! 🎉

---

## What's Next?

Once deployed:
- ✅ Bot runs 24/7 on Cloudflare's global network
- ✅ No server maintenance needed
- ✅ Automatic scaling
- ✅ Free forever (within generous limits)
- ✅ Messages sent at exactly 5am and 7pm EST every day

**Questions?** Check logs with `npm run worker:tail` or review the full guide in `CLOUDFLARE_DEPLOY.md`.
