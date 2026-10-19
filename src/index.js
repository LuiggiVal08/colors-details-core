import app from './app.js';
import logger from './config/logger.js';
import { initQueueEvents } from './config/queueEvents.js';
import { PORT } from './constants.js';
import { sequelize } from './models/index.js';
import { seedMonedas, backfillMonedas } from './services/monedaService.js';
import './workers/reportWorker.js';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './constants.js';
import { setNotifWorkerIO } from './workers/notifWorker.js';
import { setNominaWorkerIO } from './workers/nominaWorker.js';
import { notifQueue } from './config/queueNotifConfig.js';

const HOST = '0.0.0.0';
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
});

io.use((socket, next) => {
    let token = socket.handshake.auth?.token;
    if (!token) {
        const cookieHeader = socket.handshake.headers?.cookie;
        if (cookieHeader) {
            const match = cookieHeader.match(/sid=([^;]+)/);
            if (match) token = decodeURIComponent(match[1]);
        }
    }
    if (!token) return next(new Error('Autenticación requerida'));

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const { iat, exp, ...user } = decoded;
        socket.userId = user.id;
        socket.user = user;
        next();
    } catch (err) {
        return next(new Error('Token inválido o caducado'));
    }
});

app.set('io', io);
app.set('ready', false);
initQueueEvents(app);

io.on('connection', (socket) => {
    const userId = socket.userId;
    logger.info(`[Socket] Usuario ${userId} conectado: ${socket.id}`);

    socket.join(`notifs_user_${userId}`);

    socket.on('disconnect', () => {
        logger.info(`[Socket] Usuario ${userId} desconectado: ${socket.id}`);
    });
});

setNotifWorkerIO(io);
setNominaWorkerIO(io);

server.on('error', (error) => logger.error(`Error del servidor HTTP: ${error}`));

// El puerto se abre ANTES de sincronizar el esquema: sequelize.sync({ alter: true })
// tarda ~13s y mientras tanto Nginx estaba recibiendo "Connection refused" (502).
server.listen(PORT, HOST, () => logger.info(`Servidor escuchando en http://localhost:${PORT}`));

sequelize
    .authenticate()
    .then(() => logger.info('Base de datos conectada'))
    .catch((error) => logger.error(`Error al conectar la DB: ${error}`));

(async () => {
    try {
        await sequelize.sync({ alter: true, logging: false });
        await seedMonedas();
        await backfillMonedas();

        await notifQueue.removeRepeatableByKey('notificaciones-diarias');
        await notifQueue.add(
            'notificaciones-diarias',
            {},
            {
                repeat: { pattern: '0 8 * * *' },
                removeOnComplete: { age: 86400 },
                removeOnFail: { age: 86400 * 7 },
            },
        );
        logger.info('Cron de notificaciones programado (8:00 AM diario)');

        app.set('ready', true);
        logger.info('Aplicación lista para recibir tráfico');
    } catch (error) {
        logger.error(`Error al iniciar el servidor: ${error}`);
    }
})();
