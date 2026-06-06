import { QueueEvents } from 'bullmq';
import { connection, queue } from './queueConfig.js';
import path from 'path';

export const initQueueEvents = (app) => {
    const queueEvents = new QueueEvents('reportes-pdf', { connection });

    queueEvents.on('completed', async ({ jobId, returnvalue }) => {
        console.log(`✨ Job ${jobId} completado`);

        const io = app.get('io');
        if (!io) return;

        const job = await queue.getJob(jobId);
        const userId = job?.data?.userId;

        const responseData = {
            url: `/api/reports/download/${path.basename(returnvalue.path)}`,
            message: '¡Tu reporte está listo!',
        };

        if (userId) {
            io.to(`notifs_user_${userId}`).emit('reporte-listo', responseData);
        } else {
            io.emit('reporte-listo', responseData);
        }
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ Job ${jobId} falló: ${failedReason}`);
    });
};
