import { Op } from 'sequelize';
import { models } from '../models/index.js';
import logger from '../config/logger.js';

export async function checkOverduePeriods(io) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const enCincoDias = new Date(hoy);
    enCincoDias.setDate(enCincoDias.getDate() + 5);

    try {
        const periodos = await models.ServicioPeriodo.findAll({
            where: {
                amount_balance: { [Op.gt]: 0 },
                estado: { [Op.in]: ['pending', 'partial'] },
            },
            include: [{ model: models.ServicioEmpresa, as: 'servicio' }],
        });

        let count = 0;

        for (const periodo of periodos) {
            const corte = new Date(periodo.fecha_corte);
            corte.setHours(0, 0, 0, 0);

            const diffTime = corte.getTime() - hoy.getTime();
            const diffDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let tipo = null;
            let mensaje = '';

            if (corte < hoy) {
                tipo = 'danger';
                mensaje = `${Math.abs(diffDias)} días vencido: ${periodo.servicio.nombre} - Periodo ${periodo.mes}/${periodo.anualidad}`;
            } else if (corte <= enCincoDias) {
                tipo = 'warning';
                mensaje = `${diffDias} días para vencer: ${periodo.servicio.nombre} - Periodo ${periodo.mes}/${periodo.anualidad}`;
            }

            if (!tipo) continue;

            const existe = await models.Notificacion.findOne({
                where: {
                    usuario_id: periodo.usuario_id,
                    entidad_tipo: 'SERVICE',
                    entidad_id: periodo.id,
                    tipo,
                    leido: false,
                },
            });

            if (existe) continue;

            const url = `/settings/service/${periodo.servicio.id}`;

            const notif = await models.Notificacion.create({
                usuario_id: periodo.usuario_id,
                tipo,
                mensaje,
                entidad_tipo: 'SERVICE',
                entidad_id: periodo.id,
                leido: false,
                url,
            });

            count++;

            if (io) {
                io.to(`notifs_user_${periodo.usuario_id}`).emit('nueva_notificacion', {
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
            logger.info(`[NotifCron] ${count} notificaciones generadas`);
        }
    } catch (error) {
        logger.error('[NotifCron] Error:', error);
    }
}
