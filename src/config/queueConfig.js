import ioredis from 'ioredis';
import { REDIS_URL } from '../constants.js';
import { Queue } from 'bullmq';

// Creamos un objeto con la configuración en lugar de instanciarlo de inmediato
const connection = new ioredis(REDIS_URL, {
    maxRetriesPerRequest: null,
});
connection.on('error', (err) => console.log('Redis Client Error', err));
// BullMQ usará esta conexión para comunicarse con Redis
const queue = new Queue('reportes-pdf', {
    connection,
});

export { queue, connection }; // Exportamos ambos
