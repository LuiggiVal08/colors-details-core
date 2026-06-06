import { Worker } from 'bullmq';
import { connection } from '../config/queueNotifConfig.js';
import { checkOverduePeriods } from '../services/notificationService.js';
import { checkProximasEntregas } from '../services/orderNotificationService.js';
import logger from '../config/logger.js';

let _io = null;

export function setNotifWorkerIO(io) {
    _io = io;
}

const notifWorker = new Worker(
    'notificaciones-cron',
    async (job) => {
        logger.info(`[NotifWorker] Ejecutando job ${job.id}`);
        if (!_io) throw new Error('Socket.io no disponible en notifWorker');
        await checkOverduePeriods(_io);
        await checkProximasEntregas(_io);
    },
    { connection },
);

notifWorker.on('completed', (job) => {
    logger.info(`[NotifWorker] Job ${job.id} completado`);
});

notifWorker.on('failed', (job, err) => {
    logger.error(`[NotifWorker] Job ${job.id} falló: ${err.message}`);
});

export default notifWorker;
