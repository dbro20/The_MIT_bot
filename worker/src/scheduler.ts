import { Env } from './types';
import {
  getUserByUsername,
  getDailyQuestion,
  createDailyQuestion,
  updateMorningQuestionSent,
  updateEveningQuestionSent,
  markQuestionAsMissed,
  getCurrentDateEST,
} from './database';
import { MORNING_QUESTION, EVENING_QUESTION } from './messages';
import { sendMessage } from './telegram';

/**
 * Handle morning question cron trigger (5am EST)
 */
export async function handleMorningCron(env: Env): Promise<Response> {
  try {
    console.log('Running morning question job...');

    const user = await getUserByUsername(env.DB, env.TARGET_USERNAME);
    if (!user) {
      console.log(`Target user @${env.TARGET_USERNAME} not found in database. User needs to /start the bot first.`);
      return new Response('User not found');
    }

    const today = getCurrentDateEST();

    // Get or create today's question record
    let question = await getDailyQuestion(env.DB, user.id, today);
    if (!question) {
      question = await createDailyQuestion(env.DB, user.id, today);
    }

    // Check if morning question already sent (idempotency)
    if (question.morning_question_sent_at) {
      console.log('Morning question already sent today, skipping...');
      return new Response('Already sent');
    }

    // Send the question
    const sent = await sendMessage(env.BOT_TOKEN, user.telegram_id, MORNING_QUESTION);
    if (sent) {
      await updateMorningQuestionSent(env.DB, question.id);
      console.log(`Morning question sent to user ${user.telegram_id} (@${user.username})`);
      return new Response('Morning question sent');
    } else {
      console.error('Failed to send morning question');
      return new Response('Failed to send', { status: 500 });
    }
  } catch (error) {
    console.error('Error in morning cron job:', error);
    return new Response('Error', { status: 500 });
  }
}

/**
 * Handle evening question cron trigger (7pm EST)
 */
export async function handleEveningCron(env: Env): Promise<Response> {
  try {
    console.log('Running evening question job...');

    const user = await getUserByUsername(env.DB, env.TARGET_USERNAME);
    if (!user) {
      console.log(`Target user @${env.TARGET_USERNAME} not found in database. User needs to /start the bot first.`);
      return new Response('User not found');
    }

    const today = getCurrentDateEST();
    const question = await getDailyQuestion(env.DB, user.id, today);

    if (!question) {
      console.log('No daily question record found for today, skipping evening question...');
      return new Response('No question record');
    }

    // Check if evening question already sent (idempotency)
    if (question.evening_question_sent_at) {
      console.log('Evening question already sent today, skipping...');
      return new Response('Already sent');
    }

    // Check if morning question was answered
    if (!question.morning_response) {
      console.log('Morning question not answered, marking as missed...');
      await markQuestionAsMissed(env.DB, question.id);
      await sendMessage(
        env.BOT_TOKEN,
        user.telegram_id,
        "You didn't answer this morning's question, so I'm skipping the evening check-in. See you tomorrow at 5am!"
      );
      return new Response('Marked as missed');
    }

    // Send the evening question
    const sent = await sendMessage(env.BOT_TOKEN, user.telegram_id, EVENING_QUESTION);
    if (sent) {
      await updateEveningQuestionSent(env.DB, question.id);
      console.log(`Evening question sent to user ${user.telegram_id} (@${user.username})`);
      return new Response('Evening question sent');
    } else {
      console.error('Failed to send evening question');
      return new Response('Failed to send', { status: 500 });
    }
  } catch (error) {
    console.error('Error in evening cron job:', error);
    return new Response('Error', { status: 500 });
  }
}
