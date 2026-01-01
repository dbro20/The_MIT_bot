import { Env, User, DailyQuestion } from './types';

/**
 * Get current UTC timestamp
 */
function getCurrentUTCTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Get current date in EST timezone (YYYY-MM-DD)
 */
export function getCurrentDateEST(): string {
  const now = new Date();
  // Convert to EST (UTC-5)
  const estDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return estDate.toISOString().split('T')[0];
}

/**
 * Create or update a user
 */
export async function createOrUpdateUser(
  db: D1Database,
  telegramId: number,
  userData: { username?: string; first_name?: string; last_name?: string }
): Promise<User> {
  const now = getCurrentUTCTimestamp();

  await db
    .prepare(
      `INSERT INTO users (telegram_id, username, first_name, last_name, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(telegram_id) DO UPDATE SET
         username = excluded.username,
         first_name = excluded.first_name,
         last_name = excluded.last_name,
         updated_at = excluded.updated_at`
    )
    .bind(telegramId, userData.username || null, userData.first_name || null, userData.last_name || null, now)
    .run();

  const user = await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(telegramId).first<User>();

  if (!user) {
    throw new Error('Failed to create or retrieve user');
  }

  return user;
}

/**
 * Get user by Telegram ID
 */
export async function getUserByTelegramId(db: D1Database, telegramId: number): Promise<User | null> {
  return await db.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(telegramId).first<User>();
}

/**
 * Get user by username
 */
export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  return await db.prepare('SELECT * FROM users WHERE username = ?').bind(username).first<User>();
}

/**
 * Create a new daily question record
 */
export async function createDailyQuestion(db: D1Database, userId: number, date: string): Promise<DailyQuestion> {
  await db
    .prepare(
      `INSERT INTO daily_questions (user_id, date)
       VALUES (?, ?)
       ON CONFLICT(user_id, date) DO NOTHING`
    )
    .bind(userId, date)
    .run();

  const question = await db
    .prepare('SELECT * FROM daily_questions WHERE user_id = ? AND date = ?')
    .bind(userId, date)
    .first<DailyQuestion>();

  if (!question) {
    throw new Error('Failed to create or retrieve daily question');
  }

  return question;
}

/**
 * Get daily question for a user and date
 */
export async function getDailyQuestion(db: D1Database, userId: number, date: string): Promise<DailyQuestion | null> {
  return await db
    .prepare('SELECT * FROM daily_questions WHERE user_id = ? AND date = ?')
    .bind(userId, date)
    .first<DailyQuestion>();
}

/**
 * Update the morning question sent timestamp
 */
export async function updateMorningQuestionSent(db: D1Database, questionId: number): Promise<void> {
  const now = getCurrentUTCTimestamp();
  await db
    .prepare('UPDATE daily_questions SET morning_question_sent_at = ?, updated_at = ? WHERE id = ?')
    .bind(now, now, questionId)
    .run();
}

/**
 * Update the morning response
 */
export async function updateMorningResponse(db: D1Database, questionId: number, response: string): Promise<void> {
  const now = getCurrentUTCTimestamp();
  await db
    .prepare(
      `UPDATE daily_questions
       SET morning_response = ?,
           morning_response_received_at = ?,
           status = 'morning_answered',
           updated_at = ?
       WHERE id = ?`
    )
    .bind(response, now, now, questionId)
    .run();
}

/**
 * Update the evening question sent timestamp
 */
export async function updateEveningQuestionSent(db: D1Database, questionId: number): Promise<void> {
  const now = getCurrentUTCTimestamp();
  await db
    .prepare('UPDATE daily_questions SET evening_question_sent_at = ?, updated_at = ? WHERE id = ?')
    .bind(now, now, questionId)
    .run();
}

/**
 * Update the evening response
 */
export async function updateEveningResponse(db: D1Database, questionId: number, response: string): Promise<void> {
  const now = getCurrentUTCTimestamp();
  await db
    .prepare(
      `UPDATE daily_questions
       SET evening_response = ?,
           evening_response_received_at = ?,
           status = 'completed',
           updated_at = ?
       WHERE id = ?`
    )
    .bind(response, now, now, questionId)
    .run();
}

/**
 * Mark a daily question as missed
 */
export async function markQuestionAsMissed(db: D1Database, questionId: number): Promise<void> {
  const now = getCurrentUTCTimestamp();
  await db.prepare('UPDATE daily_questions SET status = ?, updated_at = ? WHERE id = ?').bind('missed', now, questionId).run();
}

/**
 * Get response history for a user
 */
export async function getResponseHistory(db: D1Database, userId: number, limit: number = 10): Promise<DailyQuestion[]> {
  const result = await db
    .prepare('SELECT * FROM daily_questions WHERE user_id = ? ORDER BY date DESC LIMIT ?')
    .bind(userId, limit)
    .all<DailyQuestion>();

  return result.results || [];
}

/**
 * Get statistics for a user
 */
export async function getUserStats(
  db: D1Database,
  userId: number
): Promise<{ total: number; completed: number; missed: number; completionRate: number }> {
  const result = await db
    .prepare(
      `SELECT
         COUNT(*) as total,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
         SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
       FROM daily_questions
       WHERE user_id = ?`
    )
    .bind(userId)
    .first<{ total: number; completed: number; missed: number }>();

  const total = result?.total || 0;
  const completed = result?.completed || 0;
  const missed = result?.missed || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, missed, completionRate };
}
