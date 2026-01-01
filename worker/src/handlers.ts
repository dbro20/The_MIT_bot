import { Env } from './types';
import {
  createOrUpdateUser,
  getUserByTelegramId,
  getDailyQuestion,
  updateMorningResponse,
  updateEveningResponse,
  getResponseHistory,
  getUserStats,
  getCurrentDateEST,
} from './database';
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
import { sendMessage } from './telegram';

interface TelegramUpdate {
  message?: {
    from?: {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
    text?: string;
  };
}

/**
 * Handle incoming webhook update from Telegram
 */
export async function handleWebhook(update: TelegramUpdate, env: Env): Promise<Response> {
  const message = update.message;

  if (!message || !message.from || !message.text) {
    return new Response('OK');
  }

  const from = message.from;
  const text = message.text;

  // Handle commands
  if (text.startsWith('/')) {
    return await handleCommand(text, from, env);
  }

  // Handle text responses to questions
  return await handleTextMessage(text, from, env);
}

/**
 * Handle bot commands
 */
async function handleCommand(
  command: string,
  from: { id: number; username?: string; first_name?: string; last_name?: string },
  env: Env
): Promise<Response> {
  try {
    if (command === '/start') {
      await createOrUpdateUser(env.DB, from.id, {
        username: from.username,
        first_name: from.first_name,
        last_name: from.last_name,
      });

      await sendMessage(env.BOT_TOKEN, from.id, WELCOME_MESSAGE);
      return new Response('OK');
    }

    if (command === '/help') {
      await sendMessage(env.BOT_TOKEN, from.id, HELP_MESSAGE);
      return new Response('OK');
    }

    if (command === '/today') {
      const user = await getUserByTelegramId(env.DB, from.id);
      if (!user) {
        await sendMessage(env.BOT_TOKEN, from.id, 'Please use /start to register first.');
        return new Response('OK');
      }

      const today = getCurrentDateEST();
      const question = await getDailyQuestion(env.DB, user.id, today);

      if (!question) {
        await sendMessage(env.BOT_TOKEN, from.id, NO_QUESTIONS_TODAY);
        return new Response('OK');
      }

      await sendMessage(env.BOT_TOKEN, from.id, formatTodayMessage(question));
      return new Response('OK');
    }

    if (command === '/history') {
      const user = await getUserByTelegramId(env.DB, from.id);
      if (!user) {
        await sendMessage(env.BOT_TOKEN, from.id, 'Please use /start to register first.');
        return new Response('OK');
      }

      const history = await getResponseHistory(env.DB, user.id, 10);
      await sendMessage(env.BOT_TOKEN, from.id, formatHistoryMessage(history));
      return new Response('OK');
    }

    if (command === '/stats') {
      const user = await getUserByTelegramId(env.DB, from.id);
      if (!user) {
        await sendMessage(env.BOT_TOKEN, from.id, 'Please use /start to register first.');
        return new Response('OK');
      }

      const stats = await getUserStats(env.DB, user.id);
      await sendMessage(env.BOT_TOKEN, from.id, formatStatsMessage(stats));
      return new Response('OK');
    }

    return new Response('OK');
  } catch (error) {
    console.error('Error handling command:', error);
    await sendMessage(env.BOT_TOKEN, from.id, 'An error occurred. Please try again.');
    return new Response('Error', { status: 500 });
  }
}

/**
 * Handle text messages (responses to questions)
 */
async function handleTextMessage(
  text: string,
  from: { id: number; username?: string; first_name?: string; last_name?: string },
  env: Env
): Promise<Response> {
  try {
    const user = await getUserByTelegramId(env.DB, from.id);
    if (!user) {
      await sendMessage(env.BOT_TOKEN, from.id, 'Please use /start to register first before answering questions.');
      return new Response('OK');
    }

    const today = getCurrentDateEST();
    const question = await getDailyQuestion(env.DB, user.id, today);

    if (!question) {
      await sendMessage(
        env.BOT_TOKEN,
        from.id,
        "No questions have been sent today yet. I'll ask you the morning question at 5am EST."
      );
      return new Response('OK');
    }

    // Determine which response to save
    if (!question.morning_response) {
      // Save as morning response
      await updateMorningResponse(env.DB, question.id, text);
      await sendMessage(env.BOT_TOKEN, from.id, MORNING_RESPONSE_SAVED);
      return new Response('OK');
    } else if (!question.evening_response) {
      // Save as evening response
      await updateEveningResponse(env.DB, question.id, text);
      await sendMessage(env.BOT_TOKEN, from.id, EVENING_RESPONSE_SAVED);
      return new Response('OK');
    } else {
      // Both already answered
      await sendMessage(env.BOT_TOKEN, from.id, ALREADY_ANSWERED);
      return new Response('OK');
    }
  } catch (error) {
    console.error('Error handling text message:', error);
    await sendMessage(env.BOT_TOKEN, from.id, 'An error occurred saving your response. Please try again.');
    return new Response('Error', { status: 500 });
  }
}
