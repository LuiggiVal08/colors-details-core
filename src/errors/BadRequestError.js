import { HttpError } from './HttpError.js';

export class BadRequestError extends HttpError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}
