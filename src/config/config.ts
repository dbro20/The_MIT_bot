import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

interface Config {
  botToken: string;
  targetUsername: string;
  timezone: string;
  morningHour: number;
  morningMinute: number;
  eveningHour: number;
  eveningMinute: number;
  dbPath: string;
  logLevel: string;
  logFile: string;
  nodeEnv: string;
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value || defaultValue!;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) {
    return defaultValue;
  }
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Environment variable ${key} must be a number, got: ${value}`);
  }
  return num;
}

export const config: Config = {
  botToken: getEnvVar('BOT_TOKEN'),
  targetUsername: getEnvVar('TARGET_USERNAME', 'gofordylan'),
  timezone: getEnvVar('TIMEZONE', 'America/New_York'),
  morningHour: getEnvNumber('MORNING_HOUR', 5),
  morningMinute: getEnvNumber('MORNING_MINUTE', 0),
  eveningHour: getEnvNumber('EVENING_HOUR', 19),
  eveningMinute: getEnvNumber('EVENING_MINUTE', 0),
  dbPath: getEnvVar('DB_PATH', path.join(process.cwd(), 'data', 'bot.db')),
  logLevel: getEnvVar('LOG_LEVEL', 'info'),
  logFile: getEnvVar('LOG_FILE', path.join(process.cwd(), 'logs', 'bot.log')),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
};
