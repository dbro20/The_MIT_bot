import { Env } from './types';
import { handleWebhook } from './handlers';
import { handleMorningCron, handleEveningCron } from './scheduler';
import { setWebhook } from './telegram';

export default {
  /**
   * Fetch handler - handles incoming webhook requests from Telegram
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Webhook setup endpoint
    if (url.pathname === '/setup' && request.method === 'POST') {
      const webhookUrl = `${url.origin}/webhook`;
      const success = await setWebhook(env.BOT_TOKEN, webhookUrl, env.TELEGRAM_WEBHOOK_SECRET);

      if (success) {
        return new Response('Webhook set successfully', { status: 200 });
      } else {
        return new Response('Failed to set webhook', { status: 500 });
      }
    }

    // Webhook endpoint - receives updates from Telegram
    if (url.pathname === '/webhook' && request.method === 'POST') {
      // Verify the request is from Telegram using secret token
      const secretToken = request.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (secretToken !== env.TELEGRAM_WEBHOOK_SECRET) {
        return new Response('Unauthorized', { status: 403 });
      }

      try {
        const update = await request.json();
        return await handleWebhook(update, env);
      } catch (error) {
        console.error('Error processing webhook:', error);
        return new Response('Error', { status: 500 });
      }
    }

    // Health check endpoint
    if (url.pathname === '/' && request.method === 'GET') {
      return new Response('MIT Bot Worker is running', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
  },

  /**
   * Scheduled handler - handles cron triggers
   */
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    // event.cron will be one of: "0 10 * * *" (5am EST = 10am UTC) or "0 0 * * *" (7pm EST = 12am UTC next day)
    const cronExpression = event.cron;

    console.log(`Cron triggered: ${cronExpression}`);

    if (cronExpression === '0 10 * * *') {
      // Morning question at 5am EST (10am UTC)
      await handleMorningCron(env);
    } else if (cronExpression === '0 0 * * *') {
      // Evening question at 7pm EST (12am UTC next day)
      await handleEveningCron(env);
    }
  },
};
