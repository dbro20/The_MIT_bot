import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import {
  getUserByUsername,
  getDailyQuestion,
  createDailyQuestion,
  updateMorningQuestionSent,
  updateEveningQuestionSent,
  markQuestionAsMissed,
} from '../database/queries';
import { MORNING_QUESTION, EVENING_QUESTION } from './messages';
import { getCurrentDateInTimezone } from '../utils/timezone';
import { config } from '../config/config';
import logger from '../utils/logger';

/**
 * Start the scheduled jobs for morning and evening questions
 */
export function startScheduler(bot: Telegraf): void {
  logger.info('Starting scheduler...');

  // Morning question at 5am EST
  const morningCron = `${config.morningMinute} ${config.morningHour} * * *`;
  cron.schedule(
    morningCron,
    async () => {
      await sendMorningQuestion(bot);
    },
    {
      timezone: config.timezone,
    }
  );
  logger.info(`Morning question scheduled: ${morningCron} (${config.timezone})`);

  // Evening question at 7pm EST
  const eveningCron = `${config.eveningMinute} ${config.eveningHour} * * *`;
  cron.schedule(
    eveningCron,
    async () => {
      await sendEveningQuestion(bot);
    },
    {
      timezone: config.timezone,
    }
  );
  logger.info(`Evening question scheduled: ${eveningCron} (${config.timezone})`);
}

/**
 * Send the morning question to the target user
 */
async function sendMorningQuestion(bot: Telegraf): Promise<void> {
  try {
    logger.info('Running morning question job...');

    const user = getUserByUsername(config.targetUsername);
    if (!user) {
      logger.warn(`Target user @${config.targetUsername} not found in database. User needs to /start the bot first.`);
      return;
    }

    const today = getCurrentDateInTimezone();

    // Get or create today's question record
    let question = getDailyQuestion(user.id, today);
    if (!question) {
      question = createDailyQuestion(user.id, today);
    }

    // Check if morning question already sent (idempotency)
    if (question.morning_question_sent_at) {
      logger.info('Morning question already sent today, skipping...');
      return;
    }

    // Send the question
    await bot.telegram.sendMessage(user.telegram_id, MORNING_QUESTION);
    updateMorningQuestionSent(question.id);

    logger.info(`Morning question sent to user ${user.telegram_id} (@${user.username})`);
  } catch (error) {
    logger.error('Error sending morning question:', error);
  }
}

/**
 * Send the evening question to the target user
 */
async function sendEveningQuestion(bot: Telegraf): Promise<void> {
  try {
    logger.info('Running evening question job...');

    const user = getUserByUsername(config.targetUsername);
    if (!user) {
      logger.warn(`Target user @${config.targetUsername} not found in database. User needs to /start the bot first.`);
      return;
    }

    const today = getCurrentDateInTimezone();
    const question = getDailyQuestion(user.id, today);

    if (!question) {
      logger.warn('No daily question record found for today, skipping evening question...');
      return;
    }

    // Check if evening question already sent (idempotency)
    if (question.evening_question_sent_at) {
      logger.info('Evening question already sent today, skipping...');
      return;
    }

    // Check if morning question was answered
    if (!question.morning_response) {
      logger.info('Morning question not answered, marking as missed...');
      markQuestionAsMissed(question.id);
      await bot.telegram.sendMessage(
        user.telegram_id,
        "You didn't answer this morning's question, so I'm skipping the evening check-in. See you tomorrow at 5am!"
      );
      return;
    }

    // Send the evening question
    await bot.telegram.sendMessage(user.telegram_id, EVENING_QUESTION);
    updateEveningQuestionSent(question.id);

    logger.info(`Evening question sent to user ${user.telegram_id} (@${user.username})`);
  } catch (error) {
    logger.error('Error sending evening question:', error);
  }
}
