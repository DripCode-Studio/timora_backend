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
  return {
    summary: event.title,
    description: event.description || "",
    location: event.location || "",
    start: {
      dateTime: `${event.startDate.toISOString().split("T")[0]}T${
        event.startTime
      }`,
      timeZone: "UTC",
    },
    end: {
      dateTime: `${event.endDate.toISOString().split("T")[0]}T${event.endTime}`,
      timeZone: "UTC",
    },
    recurrence: event.recurrenceRule ? [event.recurrenceRule] : undefined,
  };
};

/**
 * Generates a unique ID compatible with Google Calendar event IDs
 * Uses base32hex encoding (a-v, 0-9) and UUID algorithm to minimize collisions
 *
 * @returns {string} A unique Google Calendar-compatible event ID (26 characters)
 */
// function generateGoogleCalendarEventId() {
//   const base32hexChars = "abcdefghijklmnopqrstuv0123456789";

//   // Generate 128 bits of random data (UUID size)
//   const randomBytes = crypto.getRandomValues(new Uint8Array(16));

//   // Convert to base32hex encoding
//   let eventId = "";
//   let buffer = 0;
//   let bitsInBuffer = 0;

//   for (let i = 0; i < randomBytes.length; i++) {
//     buffer = (buffer << 8) | randomBytes[i];
//     bitsInBuffer += 8;

//     while (bitsInBuffer >= 5) {
//       bitsInBuffer -= 5;
//       const index = (buffer >> bitsInBuffer) & 0x1f;
//       eventId += base32hexChars[index];
//     }
//   }

//   // Handle remaining bits
//   if (bitsInBuffer > 0) {
//     const index = (buffer << (5 - bitsInBuffer)) & 0x1f;
//     eventId += base32hexChars[index];
//   }

//   return eventId;
// }

/**
 * Generates an expiration date in Unix epoch seconds for a given number of days from now.
 *
 * @param days - Number of days until expiration
 * @returns   {number} Expiration date as Unix epoch timestamp in seconds
 */
export const generateExpireDateInSeconds = (days: number): number => {
  return Math.floor(Date.now() / 1000) + days * 24 * 60 * 60;
};
