import { HttpError } from './HttpError.js';

export class ConflictError extends HttpError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
