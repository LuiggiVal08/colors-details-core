import { HttpError } from './HttpError.js';

export class NotFoundError extends HttpError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}
