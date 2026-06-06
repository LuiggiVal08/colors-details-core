import { Worker } from 'bullmq';
import { connection } from '../config/nominaQueue.js';
import { calcularYGenerarNomina } from '../services/nominaService.js';
import logger from '../config/logger.js';

let _io = null;

export function setNominaWorkerIO(io) {
    _io = io;
}

const nominaWorker = new Worker(
    'nomina-generar',
    async (job) => {
        logger.info(`[NominaWorker] Ejecutando job ${job.id}`);
        if (!_io) throw new Error('Socket.io no disponible en nominaWorker');

        const { periodoInicio, periodoFin, empresaId, usuarioId } = job.data;

        const result = await calcularYGenerarNomina({
            periodoInicio,
            periodoFin,
            empresaId,
            usuarioId,
            io: _io,
        });

        if (result.skipped) {
            logger.info(`[NominaWorker] Job ${job.id} saltado (ya existe nómina para el período)`);
        }

        return result;
    },
    { connection },
);

nominaWorker.on('completed', (job) => {
    logger.info(`[NominaWorker] Job ${job.id} completado`);
});

nominaWorker.on('failed', (job, err) => {
    logger.error(`[NominaWorker] Job ${job.id} falló: ${err.message}`);
});

export default nominaWorker;
