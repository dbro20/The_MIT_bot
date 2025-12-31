import db from './db';
import logger from '../utils/logger';
import { getCurrentUTCTimestamp } from '../utils/timezone';

export interface User {
  id: number;
  telegram_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface DailyQuestion {
  id: number;
  user_id: number;
  date: string;
  morning_question_sent_at: string | null;
  morning_response: string | null;
  morning_response_received_at: string | null;
  evening_question_sent_at: string | null;
  evening_response: string | null;
  evening_response_received_at: string | null;
  status: 'pending' | 'morning_answered' | 'completed' | 'missed';
  created_at: string;
  updated_at: string;
}

/**
 * Create or update a user in the database
 */
export function createOrUpdateUser(
  telegramId: number,
  userData: {
    username?: string;
    first_name?: string;
    last_name?: string;
  }
): User {
  const stmt = db.prepare(`
    INSERT INTO users (telegram_id, username, first_name, last_name, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(telegram_id) DO UPDATE SET
      username = excluded.username,
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      updated_at = excluded.updated_at
  `);

  const now = getCurrentUTCTimestamp();
  stmt.run(
    telegramId,
    userData.username || null,
    userData.first_name || null,
    userData.last_name || null,
    now
  );

  const user = getUserByTelegramId(telegramId);
  if (!user) {
    throw new Error('Failed to create or retrieve user');
  }

  logger.info(`User ${telegramId} (${userData.username}) created/updated`);
  return user;
}

/**
 * Get user by Telegram ID
 */
export function getUserByTelegramId(telegramId: number): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
  return stmt.get(telegramId) as User | null;
}

/**
 * Get user by username
 */
export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username) as User | null;
}

/**
 * Create a new daily question record
 */
export function createDailyQuestion(userId: number, date: string): DailyQuestion {
  const stmt = db.prepare(`
    INSERT INTO daily_questions (user_id, date)
    VALUES (?, ?)
    ON CONFLICT(user_id, date) DO NOTHING
  `);

  stmt.run(userId, date);

  const question = getDailyQuestion(userId, date);
  if (!question) {
    throw new Error('Failed to create or retrieve daily question');
  }

  logger.info(`Daily question created for user ${userId} on ${date}`);
  return question;
}

/**
 * Get daily question record for a user and date
 */
export function getDailyQuestion(userId: number, date: string): DailyQuestion | null {
  const stmt = db.prepare('SELECT * FROM daily_questions WHERE user_id = ? AND date = ?');
  return stmt.get(userId, date) as DailyQuestion | null;
}

/**
 * Update the morning question sent timestamp
 */
export function updateMorningQuestionSent(questionId: number): void {
  const stmt = db.prepare(`
    UPDATE daily_questions
    SET morning_question_sent_at = ?, updated_at = ?
    WHERE id = ?
  `);

  const now = getCurrentUTCTimestamp();
  stmt.run(now, now, questionId);
  logger.info(`Morning question sent timestamp updated for question ${questionId}`);
}

/**
 * Update the morning response
 */
export function updateMorningResponse(questionId: number, response: string): void {
  const stmt = db.prepare(`
    UPDATE daily_questions
    SET morning_response = ?,
        morning_response_received_at = ?,
        status = 'morning_answered',
        updated_at = ?
    WHERE id = ?
  `);

  const now = getCurrentUTCTimestamp();
  stmt.run(response, now, now, questionId);
  logger.info(`Morning response saved for question ${questionId}`);
}

/**
 * Update the evening question sent timestamp
 */
export function updateEveningQuestionSent(questionId: number): void {
  const stmt = db.prepare(`
    UPDATE daily_questions
    SET evening_question_sent_at = ?, updated_at = ?
    WHERE id = ?
  `);

  const now = getCurrentUTCTimestamp();
  stmt.run(now, now, questionId);
  logger.info(`Evening question sent timestamp updated for question ${questionId}`);
}

/**
 * Update the evening response
 */
export function updateEveningResponse(questionId: number, response: string): void {
  const stmt = db.prepare(`
    UPDATE daily_questions
    SET evening_response = ?,
        evening_response_received_at = ?,
        status = 'completed',
        updated_at = ?
    WHERE id = ?
  `);

  const now = getCurrentUTCTimestamp();
  stmt.run(response, now, now, questionId);
  logger.info(`Evening response saved for question ${questionId}`);
}

/**
 * Mark a daily question as missed
 */
export function markQuestionAsMissed(questionId: number): void {
  const stmt = db.prepare(`
    UPDATE daily_questions
    SET status = 'missed', updated_at = ?
    WHERE id = ?
  `);

  const now = getCurrentUTCTimestamp();
  stmt.run(now, questionId);
  logger.info(`Question ${questionId} marked as missed`);
}

/**
 * Get response history for a user
 */
export function getResponseHistory(userId: number, limit: number = 10): DailyQuestion[] {
  const stmt = db.prepare(`
    SELECT * FROM daily_questions
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT ?
  `);

  return stmt.all(userId, limit) as DailyQuestion[];
}

/**
 * Get statistics for a user
 */
export function getUserStats(userId: number): {
  total: number;
  completed: number;
  missed: number;
  completionRate: number;
} {
  const stmt = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status = 'missed' THEN 1 ELSE 0 END) as missed
    FROM daily_questions
    WHERE user_id = ?
  `);

  const result = stmt.get(userId) as { total: number; completed: number; missed: number };
  const completionRate = result.total > 0 ? (result.completed / result.total) * 100 : 0;

  return {
    total: result.total,
    completed: result.completed,
    missed: result.missed,
    completionRate: Math.round(completionRate),
  };
}
