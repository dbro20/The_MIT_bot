# MIT Bot - Most Important Thing Telegram Bot

A Telegram bot that helps you track your Most Important Thing (MIT) every day by asking you questions in the morning and evening.

## Features

- **Morning Question (5am EST)**: "What is the most important thing to do today?"
- **Evening Check-in (7pm EST)**: "Did you complete your most important thing today?"
- **Response Storage**: All responses are stored in a SQLite database
- **History Tracking**: View your past responses and completion statistics
- **Automatic Timezone Handling**: Correctly handles EST/EDT transitions

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Telegram Bot Token from [@BotFather](https://t.me/botfather)

## Setup Instructions

### 1. Create a Telegram Bot

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Choose a name and username for your bot
4. Copy the bot token (it looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your bot token:
   ```env
   BOT_TOKEN=your_bot_token_here
   TARGET_USERNAME=gofordylan
   ```

### 4. Start the Bot

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

### 5. Register with the Bot

1. Open Telegram and search for your bot
2. Send `/start` to register yourself
3. The bot will now send you questions at 5am and 7pm EST

## Available Commands

- `/start` - Register and start using the bot
- `/help` - Show help message with available commands
- `/today` - See today's question and your response
- `/history` - View your recent responses (last 10 days)
- `/stats` - See your completion statistics

## How It Works

### Daily Flow

1. **5am EST**: Bot sends "What is the most important thing to do today?"
2. **Your Response**: Reply with your MIT for the day
3. **7pm EST**: Bot sends "Did you complete your most important thing today?"
4. **Your Response**: Reply with whether you completed it

### State Management

- The bot tracks which question you're answering based on the time of day
- If you don't answer the morning question, the evening question won't be sent
- All responses are saved to a SQLite database
- The bot is idempotent - restarting it won't cause duplicate messages

## Project Structure

```
/Users/dylanbrodeur/Projects/MIT-bot/
├── src/
│   ├── index.ts                 # Entry point
│   ├── config/config.ts         # Configuration management
│   ├── database/
│   │   ├── db.ts               # Database connection
│   │   ├── migrations.ts       # Schema setup
│   │   └── queries.ts          # Database operations
│   ├── bot/
│   │   ├── handlers.ts         # Command & message handlers
│   │   ├── scheduler.ts        # Cron job scheduling
│   │   └── messages.ts         # Message templates
│   └── utils/
│       ├── logger.ts           # Logging
│       └── timezone.ts         # Timezone utilities
├── data/                        # SQLite database (auto-created)
├── logs/                        # Log files (auto-created)
└── .env                         # Your configuration
```

## Database Schema

### users
- Stores user information (telegram_id, username, etc.)

### daily_questions
- Stores each day's questions and responses
- Tracks morning/evening questions and responses
- Status: pending, morning_answered, completed, missed

### bot_logs
- Stores bot activity for debugging

## Configuration Options

Edit `.env` to customize:

```env
# Bot Configuration
BOT_TOKEN=your_token_here
TARGET_USERNAME=gofordylan

# Timezone
TIMEZONE=America/New_York

# Schedule Times (24-hour format)
MORNING_HOUR=5
MORNING_MINUTE=0
EVENING_HOUR=19
EVENING_MINUTE=0

# Database
DB_PATH=./data/bot.db

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/bot.log

# Environment
NODE_ENV=production
```

## Deploy to Railway (Recommended for 24/7 Operation)

**Railway allows your bot to run 24/7 even when your computer is off.**

### Why Railway?
- ✅ Runs 24/7 without your computer being on
- ✅ Auto-restarts if it crashes
- ✅ $5/month free credit (enough for this bot)
- ✅ Deploy directly from GitHub
- ✅ Easy environment variable management

### Deployment Steps

1. **Sign up for Railway**
   - Go to https://railway.app
   - Sign in with your GitHub account

2. **Create a New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `The_MIT_bot` repository
   - Railway will automatically detect it's a Node.js app

3. **Add Environment Variables**
   - In your Railway project dashboard, go to "Variables"
   - Add all variables from your `.env.example` file:
     ```
     BOT_TOKEN=your_bot_token_here
     TARGET_USERNAME=gofordylan
     TIMEZONE=America/New_York
     MORNING_HOUR=5
     MORNING_MINUTE=0
     EVENING_HOUR=19
     EVENING_MINUTE=0
     DB_PATH=./data/bot.db
     LOG_LEVEL=info
     LOG_FILE=./logs/bot.log
     NODE_ENV=production
     ```

4. **Deploy**
   - Railway will automatically build and deploy your bot
   - Check the deployment logs to ensure it starts successfully
   - Look for "MIT Bot is running!" in the logs

5. **Test Your Bot**
   - Open Telegram and message your bot: `@the_mit_bot`
   - Send `/start` to register
   - You should receive a welcome message

6. **Verify Scheduler**
   - The bot will automatically send messages at 5am and 7pm EST
   - Check Railway logs to see scheduled messages being sent

### Railway Tips

- **View Logs**: Click on your deployment to see real-time logs
- **Restart Bot**: Use the "Restart" button in Railway dashboard
- **Monitor Usage**: Check your usage in Railway settings (this bot uses minimal resources)
- **Automatic Deploys**: Every time you push to GitHub, Railway auto-deploys the changes

### Cost
- Railway provides $5/month in free credits
- This bot typically costs $1-2/month to run
- More than enough for continuous operation

## Running Locally in Production

If you prefer to run the bot on your own server/computer, consider using PM2:

```bash
npm install -g pm2
pm2 start dist/index.js --name mit-bot
pm2 save
pm2 startup
```

## Troubleshooting

### Bot doesn't send scheduled messages

1. Ensure the bot is running continuously
2. Check that you've registered with `/start`
3. Verify your timezone settings in `.env`
4. Check logs in `logs/bot.log`

### Database errors

1. Ensure the `data/` directory exists and is writable
2. Delete `data/bot.db` to start fresh (will lose all data)

### Timezone issues

The bot uses the `America/New_York` timezone by default. To change:
1. Edit `TIMEZONE` in `.env`
2. Use valid IANA timezone names (e.g., `America/Los_Angeles`, `America/Chicago`)

## Development

Run in development mode with auto-reload:
```bash
npm run dev
```

Type-check without building:
```bash
npm run lint
```

## License

ISC

## Author

Dylan Brodeur (dylanmbrodeur@gmail.com)
