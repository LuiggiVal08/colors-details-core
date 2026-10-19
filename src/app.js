import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';
import routesAPI from './routes/index.js';
import viewsRoutes from './routes/routes.views.js';
import { cwd } from 'process';
import logger from './config/logger.js';
import csrf from './middlewares/csrf.js';
import cookieParser from 'cookie-parser';
import { APP_SECRET, DEV_ORIGINS } from './constants.js';
import fs from 'fs';
import { session } from './middlewares/session.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getPartials = (dir, partials = {}) => {
    try {
        fs.readdirSync(dir).forEach((file) => {
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                getPartials(fullPath, partials); // Llamada recursiva para carpetas
            } else if (path.extname(fullPath) === '.hbs') {
                const name = path.relative(dir, fullPath).replace(/\\/g, '/').replace('.hbs', '');
                partials[name] = fullPath;
            }
        });
    } catch (error) {
        logger.error(error);
    }
};

const partialsDir = path.join(__dirname, 'views', 'partials');
const partials = getPartials(partialsDir);
const app = express();

// Middlewares
const devOrigins = [
    'http://localhost:8081', // Puerto actual por defecto de Expo Web
    'http://localhost:19006', // Puerto antiguo de Expo Web
    'https://colors-details-core-production.up.railway.app', // URL de producción
];

// Orígenes adicionales declarados en el entorno (DEV_ORIGINS), separados por coma.
const allowedOrigins = [
    ...devOrigins,
    ...DEV_ORIGINS.split(',')
        .map((value) => value.trim())
        .filter(Boolean),
];

/**
 * El navegador envía la cabecera 'Origin' incluso en peticiones same-origin
 * (POST, PUT, DELETE). El callback de CORS no puede saber si la petición viene
 * del propio servidor, así que terminaba rechazando el acceso desde el teléfono
 * (http://192.168.x.x) con un 500. Comparar contra el Host de la petición
 * permite reconocer el mismo origen y saltarse CORS por completo: no hace falta
 * porque el navegador no aplica CORS cuando el origen coincide.
 * @param {string|undefined} origin Cabecera Origin de la petición.
 * @param {import('express').Request} req Petición entrante.
 * @returns {boolean} true si la petición viene del mismo origen que el servidor.
 */
const isSameOrigin = (origin, req) => {
    if (!origin || !req.headers.host) return false;
    try {
        return new URL(origin).host === req.headers.host;
    } catch {
        return false;
    }
};

/**
 * Comprueba si un origen puede realizar peticiones a la API.
 * @param {string|undefined} origin Cabecera Origin de la petición.
 * @returns {boolean} true si el origen está permitido.
 */
const isAllowedOrigin = (origin) => {
    // 1. Peticiones sin origen (móvil nativo, Postman, curl)
    if (!origin) return true;
    // 2. Lista explícita (Expo Web, producción, DEV_ORIGINS)
    if (allowedOrigins.includes(origin)) return true;
    // 3. Cualquier localhost/127.0.0.1 con cualquier puerto (dev)
    return origin.includes('localhost') || origin.includes('127.0.0.1');
};

const corsMiddleware = cors({
    origin: (origin, callback) => callback(null, isAllowedOrigin(origin)),
    exposedHeaders: ['Authorization'],
    credentials: true,
});

app.use(express.static(path.join(cwd(), 'public')));

// 5. Mismo origen (localhost, IP de la LAN, hostname) → CORS no aplica, se salta.
app.use((req, res, next) => {
    const { origin } = req.headers;

    if (isSameOrigin(origin, req)) return next();

    // 6. Origen no permitido: 403 explícito en lugar del 500 genérico de Express.
    // El log va aquí porque CORS corta la cadena antes de morgan, así que un
    // rechazo thrown nunca aparecería en el access log.
    if (!isAllowedOrigin(origin)) {
        logger.warn(`Origen bloqueado por CORS: ${origin} (host: ${req.headers.host})`);
        return res.status(403).json({ message: 'Origen no permitido por las reglas de CORS' });
    }

    return corsMiddleware(req, res, next);
});
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(APP_SECRET));
app.use(csrf({ excludedRoutes: ['/api/user/signin', '/api/user/logout'] }));
app.use('/api', morgan('dev', { stream: { write: (message) => logger.info(message.trim()) } }));
// Configurar Handlebars
app.use(session); // Middleware de sesión
app.engine(
    'hbs',
    engine({
        extname: '.hbs',
        defaultLayout: 'main',
        layoutsDir: path.join(__dirname, 'views', 'layouts'), // Carpeta de layouts

        partialsDir: partials, // Carpeta de partials
    }),
);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Rutas

app.use('/api', routesAPI);
app.use('/', viewsRoutes);

export default app;
