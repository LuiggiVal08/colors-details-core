import { z } from 'zod';
import logger from '../config/logger.js';

const envSchema = z.object({
    DB_URL: z.string(),
    PORT: z.string().optional(),
    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),
    APP_SECRET: z.string(),
    DB_NAME: z.string(),
    DB_USER: z.string(),
    DB_PASSWORD: z.string(),
    REDIS_URL: z.string(),
    // Orígenes extra permitidos por CORS, separados por coma.
    // Útil al probar desde un teléfono en la LAN: http://192.168.1.50
    DEV_ORIGINS: z.string().optional(),
    // NODE_ENV: z.string(),
});

/**
 * @param {import('zod').ZodTypeAny} schema
 * @param {Object} dataValidation
 * @returns {Object}
 */
export const validSchema = (schema, dataValidation) => {
    try {
        const valid = schema.parse(dataValidation);
        return valid;
    } catch (error) {
        logger.error(`❌ Error al validar las variables de entorno: ${error} `);
        process.exit(1);
    }
};
export default envSchema;
