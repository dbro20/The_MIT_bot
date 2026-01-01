/**
 * Send a message via Telegram Bot API
 */
export async function sendMessage(botToken: string, chatId: number, text: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}

/**
 * Set webhook for the bot
 */
export async function setWebhook(botToken: string, webhookUrl: string, secretToken: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message'],
      }),
    });

    const result = await response.json();
    return result.ok;
  } catch (error) {
    console.error('Error setting webhook:', error);
    return false;
  }
}
