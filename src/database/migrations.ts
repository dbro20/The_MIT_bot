import db from './db';
import logger from '../utils/logger';

/**
 * Run database migrations to create or update schema
 */
export function runMigrations(): void {
  logger.info('Running database migrations...');

  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id INTEGER UNIQUE NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create daily_questions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        morning_question_sent_at DATETIME,
        morning_response TEXT,
        morning_response_received_at DATETIME,
        evening_question_sent_at DATETIME,
        evening_response TEXT,
        evening_response_received_at DATETIME,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, date)
      )
    `);

    // Create bot_logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS bot_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        context TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes for performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_daily_questions_user_date
      ON daily_questions(user_id, date)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_daily_questions_status
      ON daily_questions(status)
    `);

    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at
      ON bot_logs(created_at)
    `);

    logger.info('Database migrations completed successfully');
  } catch (error) {
    logger.error('Error running database migrations:', error);
    throw error;
  }
}
