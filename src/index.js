import app from './app.js';
import logger from './config/logger.js';
import { initQueueEvents } from './config/queueEvents.js';
import { PORT } from './constants.js';
import { sequelize } from './models/index.js';
import './workers/reportWorker.js';
import http from 'http';
import { Server } from 'socket.io';

const server = http.createServer(app);
const io = new Server(server);
// Guardamos 'io' en la app para usarlo en otros archivos si hace falta

sequelize
    .authenticate()
    .then(() => logger.info('📦 Base de datos conectada'))
    .catch((error) => logger.error(`❌ Error al conectar la DB whit sequelize: ${error}`));

app.set('io', io);
initQueueEvents(app);
io.on('connection', (socket) => {
    console.log('📱 Cliente conectado:', socket.id);
});
(async () => {
    try {
        await sequelize.sync({ logging: false });
        server.listen(PORT, () => logger.info(`🚀 Servidor corriendo en http://localhost:${PORT}`));
    } catch (error) {
        logger.error(`❌ Error al iniciar el servidor: ${error}`);
    }
})();
