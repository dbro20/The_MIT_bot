import { Context, Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import {
  createOrUpdateUser,
  getUserByTelegramId,
  getDailyQuestion,
  updateMorningResponse,
  updateEveningResponse,
  getResponseHistory,
  getUserStats,
} from '../database/queries';
import {
  WELCOME_MESSAGE,
  HELP_MESSAGE,
  MORNING_RESPONSE_SAVED,
  EVENING_RESPONSE_SAVED,
  ALREADY_ANSWERED,
  NO_QUESTIONS_TODAY,
  formatTodayMessage,
  formatHistoryMessage,
  formatStatsMessage,
} from './messages';
import { getCurrentDateInTimezone } from '../utils/timezone';
import logger from '../utils/logger';

/**
 * Register all bot handlers
 */
export function registerHandlers(bot: Telegraf): void {
  // Start command - register user
  bot.command('start', async (ctx: Context) => {
    try {
      const from = ctx.from;
      if (!from) {
        return ctx.reply('Unable to identify user.');
      }

      createOrUpdateUser(from.id, {
        username: from.username,
        first_name: from.first_name,
        last_name: from.last_name,
      });

      await ctx.reply(WELCOME_MESSAGE);
      logger.info(`User ${from.id} started the bot`);
    } catch (error) {
      logger.error('Error in /start command:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });

  // Help command
  bot.command('help', async (ctx: Context) => {
    await ctx.reply(HELP_MESSAGE);
  });

  // Today command - show today's question and response
  bot.command('today', async (ctx: Context) => {
    try {
      const from = ctx.from;
      if (!from) {
        return ctx.reply('Unable to identify user.');
      }

      const user = getUserByTelegramId(from.id);
      if (!user) {
        return ctx.reply('Please use /start to register first.');
      }

      const today = getCurrentDateInTimezone();
      const question = getDailyQuestion(user.id, today);

      if (!question) {
        return ctx.reply(NO_QUESTIONS_TODAY);
      }

      await ctx.reply(formatTodayMessage(question));
    } catch (error) {
      logger.error('Error in /today command:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });

  // History command - show recent responses
  bot.command('history', async (ctx: Context) => {
    try {
      const from = ctx.from;
      if (!from) {
        return ctx.reply('Unable to identify user.');
      }

      const user = getUserByTelegramId(from.id);
      if (!user) {
        return ctx.reply('Please use /start to register first.');
      }

      const history = getResponseHistory(user.id, 10);
      await ctx.reply(formatHistoryMessage(history));
    } catch (error) {
      logger.error('Error in /history command:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });

  // Stats command - show statistics
  bot.command('stats', async (ctx: Context) => {
    try {
      const from = ctx.from;
      if (!from) {
        return ctx.reply('Unable to identify user.');
      }

      const user = getUserByTelegramId(from.id);
      if (!user) {
        return ctx.reply('Please use /start to register first.');
      }

      const stats = getUserStats(user.id);
      await ctx.reply(formatStatsMessage(stats));
    } catch (error) {
      logger.error('Error in /stats command:', error);
      await ctx.reply('An error occurred. Please try again.');
    }
  });

  // Text message handler - save responses to questions
  bot.on(message('text'), async (ctx: Context) => {
    try {
      const from = ctx.from;
      if (!from) {
        return;
      }

      // Ignore commands
      if (!ctx.message || !('text' in ctx.message)) {
        return;
      }

      if (ctx.message.text.startsWith('/')) {
        return;
      }

      const user = getUserByTelegramId(from.id);
      if (!user) {
        return ctx.reply(
          'Please use /start to register first before answering questions.'
        );
      }

      const today = getCurrentDateInTimezone();
      const question = getDailyQuestion(user.id, today);

      if (!question) {
        return ctx.reply(
          'No questions have been sent today yet. I\'ll ask you the morning question at 5am EST.'
        );
      }

      const response = ctx.message.text;

      // Determine which response to save based on what's already been answered
      if (!question.morning_response) {
        // Save as morning response
        updateMorningResponse(question.id, response);
        await ctx.reply(MORNING_RESPONSE_SAVED);
        logger.info(`Morning response saved for user ${from.id}: "${response}"`);
      } else if (!question.evening_response) {
        // Save as evening response
        updateEveningResponse(question.id, response);
        await ctx.reply(EVENING_RESPONSE_SAVED);
        logger.info(`Evening response saved for user ${from.id}: "${response}"`);
      } else {
        // Both already answered
        await ctx.reply(ALREADY_ANSWERED);
      }
    } catch (error) {
      logger.error('Error handling text message:', error);
      await ctx.reply('An error occurred saving your response. Please try again.');
    }
  });
}
