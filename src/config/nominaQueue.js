import { Queue } from 'bullmq';
import { connection } from './queueNotifConfig.js';

const nominaQueue = new Queue('nomina-generar', { connection });

export { nominaQueue, connection };
