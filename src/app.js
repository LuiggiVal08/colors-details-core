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
import { APP_SECRET } from './constants.js';
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
];

app.use(
    cors({
        origin: function (origin, callback) {
            // 1. Permitir peticiones sin origen (Móvil nativo, Postman, etc.)
            if (!origin) return callback(null, true);

            // Agregamos un log temporal para ver qué origin está llegando y compararlo
            // console.log("Origin intentando conectar:", origin);

            // 2. Comprobar si el origen está en la lista permitida
            if (devOrigins.includes(origin)) {
                return callback(null, true);
            }

            // 3. IMPORTANTE: Si es el mismo servidor (localhost), a veces llega como origin
            // Puedes agregar una validación extra aquí si devOrigins no lo tiene
            if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
                return callback(null, true);
            }

            return callback(new Error('No permitido por las reglas de CORS'));
        },
        exposedHeaders: ['Authorization'],
        credentials: true,
    }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(APP_SECRET));
app.use(csrf({ excludedRoutes: ['/api/auth/login', '/api/auth/logout'] }));
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
app.use(express.static(path.join(cwd(), 'public')));
app.use('/api', routesAPI);
app.use('/', viewsRoutes);

export default app;
