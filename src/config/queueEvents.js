import { QueueEvents } from 'bullmq';
import { connection, queue } from './queueConfig.js';
import path from 'path';

export const initQueueEvents = (app) => {
    const queueEvents = new QueueEvents('reportes-pdf', { connection });

    queueEvents.on('completed', async ({ jobId, returnvalue }) => {
        console.log(`✨ Job ${jobId} completado`);

        const io = app.get('io');
        if (!io) return;

        // Recuperamos el job para saber a qué socketId enviarlo
        const job = await queue.getJob(jobId);
        const socketId = job?.data?.socketId;

        const responseData = {
            url: `/api/reports/download/${path.basename(returnvalue.path)}`,
            message: '¡Tu reporte está listo!',
        };

        if (socketId) {
            // Se lo enviamos SOLO al usuario que lo pidió
            io.to(socketId).emit('reporte-listo', responseData);
        } else {
            // Si por alguna razón no hay socketId, a todos (o log)
            io.emit('reporte-listo', responseData);
        }
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
        console.error(`❌ Job ${jobId} falló: ${failedReason}`);
    });
};
