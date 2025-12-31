import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config/config';
import logger from '../utils/logger';

// Ensure database directory exists
const dbDir = path.dirname(config.dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  logger.info(`Created database directory: ${dbDir}`);
}

// Create database connection
const db: Database.Database = new Database(config.dbPath, {
  verbose: config.nodeEnv === 'development' ? logger.debug.bind(logger) : undefined,
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

logger.info(`Connected to database: ${config.dbPath}`);

export default db;
