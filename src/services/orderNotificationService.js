import { Op } from 'sequelize';
import { models } from '../models/index.js';
import logger from '../config/logger.js';

export async function checkProximasEntregas(io) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const enCincoDias = new Date(hoy);
    enCincoDias.setDate(enCincoDias.getDate() + 5);

    try {
        const pedidos = await models.Pedido.findAll({
            where: {
                estado: { [Op.ne]: 'completado' },
                fecha_entrega: { [Op.not]: null },
            },
            include: [{ model: models.Cliente, as: 'cliente' }],
        });

        let count = 0;

        for (const pedido of pedidos) {
            if (!pedido.fecha_entrega) continue;

            const entrega = new Date(pedido.fecha_entrega);
            entrega.setHours(0, 0, 0, 0);

            const diffTime = entrega.getTime() - hoy.getTime();
            const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let tipo = null;
            let mensaje = '';

            if (entrega < hoy) {
                tipo = 'danger';
                mensaje = `${Math.abs(diffDias)} días vencido: ${pedido.cliente.nombre} ${pedido.cliente.apellido} - Pedido #${pedido.id}`;
            } else if (entrega <= enCincoDias) {
                tipo = 'warning';
                mensaje = `${diffDias} días para vencer: ${pedido.cliente.nombre} ${pedido.cliente.apellido} - Pedido #${pedido.id}`;
            }

            if (!tipo) continue;

            const existe = await models.Notificacion.findOne({
                where: {
                    usuario_id: pedido.usuario_id,
                    entidad_tipo: 'ORDER',
                    entidad_id: pedido.id,
                    tipo,
                    leido: false,
                },
            });

            if (existe) continue;

            const url = `/orders?id=${pedido.id}`;

            const notif = await models.Notificacion.create({
                usuario_id: pedido.usuario_id,
                tipo,
                mensaje,
                entidad_tipo: 'ORDER',
                entidad_id: pedido.id,
                leido: false,
                url,
            });

            count++;

            if (io) {
                io.to(`notifs_user_${pedido.usuario_id}`).emit('nueva_notificacion', {
                    id: notif.id,
                    tipo: notif.tipo,
                    mensaje: notif.mensaje,
                    entidad_tipo: notif.entidad_tipo,
                    entidad_id: notif.entidad_id,
                    url: notif.url,
                    creado_en: notif.creado_en,
                });
            }
        }

        if (count > 0) {
            logger.info(`[OrderCron] ${count} notificaciones de pedidos generadas`);
        }
    } catch (error) {
        logger.error('[OrderCron] Error:', error);
    }
}
