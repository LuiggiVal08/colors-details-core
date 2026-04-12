import { HttpError } from './HttpError.js';

export class InternalServerError extends HttpError {
    constructor(message = 'Internal Server Error') {
        super(message, 500);
    }
}
