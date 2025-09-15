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
