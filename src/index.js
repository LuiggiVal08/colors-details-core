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

const prepareMovimientoCajaSchema = async () => {
    const [tables] = await sequelize.query(`
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'movimiento_caja'
    `);

    if (!tables.length) return;

    const [foreignKeys] = await sequelize.query(`
        SELECT DISTINCT CONSTRAINT_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'movimiento_caja'
          AND COLUMN_NAME = 'control_caja_id'
          AND REFERENCED_TABLE_NAME = 'control_caja'
    `);

    for (const foreignKey of foreignKeys) {
        const constraintName = foreignKey.CONSTRAINT_NAME || foreignKey.constraint_name;
        if (!constraintName) continue;
        await sequelize.query(`ALTER TABLE movimiento_caja DROP FOREIGN KEY \`${constraintName}\``);
    }

    await sequelize.query(`
        ALTER TABLE movimiento_caja
        MODIFY COLUMN control_caja_id INT NULL
    `);
};

const preparePaymentChangeSchema = async () => {
    const [tables] = await sequelize.query(`
        SELECT TABLE_NAME
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME IN ('pago_venta', 'pago_pedido')
    `);

    for (const table of tables) {
        const tableName = table.TABLE_NAME || table.table_name;
        const [columns] = await sequelize.query(`
            SELECT COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = :tableName
              AND COLUMN_NAME IN ('vuelto_usd', 'vuelto_bs')
        `, { replacements: { tableName } });
        const existing = new Set(columns.map((column) => column.COLUMN_NAME || column.column_name));

        if (!existing.has('vuelto_usd')) {
            await sequelize.query(`
                ALTER TABLE \`${tableName}\`
                ADD COLUMN vuelto_usd DECIMAL(10, 2) NOT NULL DEFAULT 0
            `);
        }
        if (!existing.has('vuelto_bs')) {
            await sequelize.query(`
                ALTER TABLE \`${tableName}\`
                ADD COLUMN vuelto_bs DECIMAL(10, 2) NOT NULL DEFAULT 0
            `);
        }
    }
};

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
        await prepareMovimientoCajaSchema();
        await preparePaymentChangeSchema();
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
