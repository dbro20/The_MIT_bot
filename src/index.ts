import { Telegraf } from 'telegraf';
import { config } from './config/config';
import { runMigrations } from './database/migrations';
import { registerHandlers } from './bot/handlers';
import { startScheduler } from './bot/scheduler';
import logger from './utils/logger';

async function main() {
  try {
    logger.info('Starting MIT Bot...');
    logger.info(`Environment: ${config.nodeEnv}`);
    logger.info(`Timezone: ${config.timezone}`);

    // Run database migrations
    runMigrations();

    // Create bot instance
    const bot = new Telegraf(config.botToken);

    // Register command and message handlers
    registerHandlers(bot);

    // Start the scheduler for morning and evening questions
    startScheduler(bot);

    // Start the bot
    logger.info('Launching bot with polling...');

    // Start polling (don't await - let it run async)
    bot.launch({
      dropPendingUpdates: true,
      allowedUpdates: ['message', 'callback_query'],
    });

    // Handle graceful shutdown
    process.once('SIGINT', () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      bot.stop('SIGINT');
    });

    process.once('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      bot.stop('SIGTERM');
    });

    logger.info('MIT Bot is running!');
    logger.info(`Bot username: @the_mit_bot`);
    logger.info(`Target user: @${config.targetUsername}`);
    logger.info(`Morning question: ${config.morningHour}:${String(config.morningMinute).padStart(2, '0')} ${config.timezone}`);
    logger.info(`Evening question: ${config.eveningHour}:${String(config.eveningMinute).padStart(2, '0')} ${config.timezone}`);

  } catch (error) {
    logger.error('Fatal error starting bot:', error);
    if (error instanceof Error) {
      logger.error('Error message:', error.message);
      logger.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();
