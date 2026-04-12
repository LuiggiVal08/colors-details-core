export class HttpError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;

        // Mantener el stack trace limpio
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
