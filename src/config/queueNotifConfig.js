import ioredis from 'ioredis';
import { REDIS_URL } from '../constants.js';
import { Queue } from 'bullmq';

const connection = new ioredis(REDIS_URL, {
    maxRetriesPerRequest: null,
});
connection.on('error', (err) => console.log('Redis Client Error', err));

const notifQueue = new Queue('notificaciones-cron', { connection });

export { notifQueue, connection };
