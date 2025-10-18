import { randomBytes } from "crypto";
import { DateTime } from "luxon";
interface GoogleDateTime {
  dateTime: string;
  timeZone: string;
}

/**
 * Custom Error class to represent HTTP errors with status codes.
 * Extends the built-in Error class.
 * @class HttpError
 * @extends Error
 * @property {number} status - HTTP status code associated with the error.
 * @constructor
 * @param {string} message - Error message.
 * @param {string} [name="HttpError"] - Name of the error.
 * @param {number} [status=500] - HTTP status code.
 * @example
 * throw new HttpError("Not Found", "NotFoundError", 404);
 *
 */
export class HttpError extends Error {
  status: number;

  constructor(message: string, name = "HttpError", status = 500) {
    super(message);
    this.name = name;
    this.status = status;
    Object.setPrototypeOf(this, new.target.prototype); // fix instanceof in TS
    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 *   Converts an internal event object to a Google Calendar event format.
 * @param event - The internal event object containing event details.
 * @returns {object} A Google Calendar event object.
 */
export const convertToGoogleCalendarEvent = (event: any) => {
  const { start, end } = getGoogleCalendarDateTimeFields(event);
  return {
    summary: event.title,
    description: event.description || "",
    start,
    end,
    ...(event.recurrenceRule && { recurrence: [event.recurrenceRule] }),
    ...(event.location && { recurrence: [event.location] }),
  };
};

/**
 * Generate a random event ID.
 *
 *
 * @returns {string} A base32hex-encoded ID string.
 */
export const generateGoogleCalendarEventId = (): string => {
  const BASE32HEX_CHARS = "0123456789abcdefghijklmnopqrstuv";

  let result = "";
  const bytes = randomBytes(32);

  for (let i = 0; i < 32; i++) {
    result += BASE32HEX_CHARS[bytes[i]! % BASE32HEX_CHARS.length];
  }

  return result;
};

/**
 * Generates an expiration date in Unix epoch seconds for a given number of days from now.
 *
 * @param days - Number of days until expiration
 * @returns   {number} Expiration date as Unix epoch timestamp in seconds
 */
export const generateExpireDateInSeconds = (days: number): number => {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
};
/**
 *  Get Google Calendar date and time fields based on event details.
 * @param payload
 * @returns
 */
export const getGoogleCalendarDateTimeFields = (payload: any) => {
  const { startDate, endDate, startTime, endTime, timezone, isAllDay } =
    payload;

  if (isAllDay) {
    // All-day events — use `date`
    return {
      start: { date: startDate },
      end: { date: endDate },
    };
  } else {
    // Timed events — use `dateTime`
    const startISO = DateTime.fromISO(`${startDate}T${startTime}`, {
      zone: timezone,
    });
    const endISO = DateTime.fromISO(`${endDate}T${endTime}`, {
      zone: timezone,
    });

    return {
      start: { dateTime: startISO.toISO(), timeZone: timezone },
      end: { dateTime: endISO.toISO(), timeZone: timezone },
    };
  }
};
