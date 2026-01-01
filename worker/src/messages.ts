import { DailyQuestion } from './types';

export const MORNING_QUESTION = 'What is the most important thing to do today?';

export const EVENING_QUESTION = 'Did you complete your most important thing today?';

export const WELCOME_MESSAGE = `👋 Welcome to MIT Bot!

I'll help you track your Most Important Thing (MIT) every day.

Here's how it works:
• Every morning at 5am EST, I'll ask: "${MORNING_QUESTION}"
• Every evening at 7pm EST, I'll ask: "${EVENING_QUESTION}"
• I'll store all your responses so you can track your progress

Use /help to see available commands.`;

export const HELP_MESSAGE = `🤖 MIT Bot Commands:

/start - Register and start using the bot
/help - Show this help message
/today - See today's question and your response
/history - View your recent responses (last 10 days)
/stats - See your completion statistics

Just reply with text to answer the daily questions!`;

export const MORNING_RESPONSE_SAVED = `✅ Got it! I'll check in with you at 7pm EST to see if you completed it.`;

export const EVENING_RESPONSE_SAVED = `✅ Response saved! See you tomorrow at 5am EST.`;

export const ALREADY_ANSWERED = `You've already answered both questions for today! See you tomorrow morning.`;

export const NO_QUESTIONS_TODAY = `No questions have been sent today yet. Your morning question will arrive at 5am EST.`;

export function formatTodayMessage(question: DailyQuestion): string {
  let message = `📅 Today (${question.date}):\n\n`;

  if (question.morning_question_sent_at) {
    message += `❓ Morning Question: ${MORNING_QUESTION}\n`;
    if (question.morning_response) {
      message += `✏️ Your Answer: "${question.morning_response}"\n`;
      if (question.morning_response_received_at) {
        const time = new Date(question.morning_response_received_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        });
        message += `🕐 Answered at: ${time}\n`;
      }
    } else {
      message += `⏳ Waiting for your answer...\n`;
    }
    message += '\n';
  }

  if (question.evening_question_sent_at) {
    message += `❓ Evening Question: ${EVENING_QUESTION}\n`;
    if (question.evening_response) {
      message += `✏️ Your Answer: "${question.evening_response}"\n`;
      if (question.evening_response_received_at) {
        const time = new Date(question.evening_response_received_at).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: 'America/New_York',
        });
        message += `🕐 Answered at: ${time}\n`;
      }
    } else {
      message += `⏳ Waiting for your answer...\n`;
    }
  }

  return message;
}

export function formatHistoryMessage(questions: DailyQuestion[]): string {
  if (questions.length === 0) {
    return 'No history found yet. Answer your first daily question to start tracking!';
  }

  let message = `📚 Your Recent History:\n\n`;

  for (const q of questions) {
    const statusEmoji = q.status === 'completed' ? '✅' : q.status === 'missed' ? '❌' : '⏳';
    message += `${statusEmoji} ${q.date}\n`;

    if (q.morning_response) {
      message += `   MIT: "${q.morning_response}"\n`;
    }
    if (q.evening_response) {
      message += `   Completed: "${q.evening_response}"\n`;
    }
    message += '\n';
  }

  return message;
}

export function formatStatsMessage(stats: { total: number; completed: number; missed: number; completionRate: number }): string {
  return `📊 Your Statistics:

Total Days Tracked: ${stats.total}
Completed: ${stats.completed} ✅
Missed: ${stats.missed} ❌
Completion Rate: ${stats.completionRate}%

${
    stats.completionRate >= 80
      ? '🎉 Great job! Keep up the excellent work!'
      : stats.completionRate >= 50
        ? "👍 You're doing well! Try to be more consistent."
        : '💪 Keep going! Consistency is key.'
  }`;
}
