import { config } from 'dotenv';
import envSchema, { validSchema } from './schemas/env.schema.js';
config();
export const { NODE_ENV = 'development' } = process.env;
export const timeExpiresToken = 60 * 60 * 1000; // 1 hora en milisegundos
// export const timeExpiresToken = 1 * 60 * 1000; // 1 minuto en milisegundos para pruebas
export const {
    PORT = 3000,
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    APP_SECRET,
    DB_URL,
    DB_NAME,
    DB_USER,
    DB_PASSWORD,
    REDIS_URL,
} = {
    ...validSchema(envSchema, process.env),
    PORT: Number(process.env.PORT) || 3000,
};
