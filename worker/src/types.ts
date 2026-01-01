// Cloudflare Worker Environment Types

export interface Env {
  // D1 Database
  DB: D1Database;

  // Environment variables
  BOT_TOKEN: string;
  TARGET_USERNAME: string;
  TELEGRAM_WEBHOOK_SECRET: string;
}

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
