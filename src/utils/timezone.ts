import { DateTime } from 'luxon';
import { config } from '../config/config';

/**
 * Get the current date in the configured timezone
 * @returns DateTime object in the configured timezone
 */
export function getCurrentDateTimeInTimezone(): DateTime {
  return DateTime.now().setZone(config.timezone);
}

/**
 * Get the current date in the configured timezone formatted as YYYY-MM-DD
 * @returns Date string in YYYY-MM-DD format
 */
export function getCurrentDateInTimezone(): string {
  return getCurrentDateTimeInTimezone().toFormat('yyyy-MM-dd');
}

/**
 * Format a Date object or timestamp for database storage (ISO string)
 * @param date Date object or timestamp
 * @returns ISO string in UTC
 */
export function formatDateForDB(date: Date | number): string {
  return DateTime.fromJSDate(date instanceof Date ? date : new Date(date))
    .toUTC()
    .toISO() || '';
}

/**
 * Convert a database timestamp to the configured timezone
 * @param isoString ISO timestamp from database
 * @returns DateTime object in configured timezone
 */
export function convertDBTimestampToTimezone(isoString: string): DateTime {
  return DateTime.fromISO(isoString).setZone(config.timezone);
}

/**
 * Get the current UTC timestamp as ISO string
 * @returns ISO timestamp string
 */
export function getCurrentUTCTimestamp(): string {
  return DateTime.utc().toISO() || '';
}
