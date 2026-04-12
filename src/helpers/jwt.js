import jsonwebtoken from 'jsonwebtoken';
import { JWT_SECRET, timeExpiresToken } from '../constants.js';

/**
 * Asynchronously generates a JWT token based on the provided payload.
 *
 * @param {string | object | Buffer} payload - The data to be included in the JWT token. Can be a string, object, or Buffer.
 * @param {'access' | 'refresh'} type - The type of token to be generated.
 * @returns A Promise that resolves with the generated JWT token.
 * @throws Any error that occurs during the token generation process.
 */

const jwt = async (payload, type = 'access') => {
    if (!type) throw new Error('Type is required');
    if (!payload) throw new Error('Payload is required');
    const token = await jsonwebtoken.sign(payload, JWT_SECRET, {
        expiresIn: type === 'access' ? timeExpiresToken / 1000 : '7d',
        algorithm: 'HS256',
    });
    return token;
};
export default jwt;
