import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { NotFoundError } from '../errors/NotFoundError.js';

const schemaPago = z.object({
    periodo_id: z.number(),
    monto: z.number().positive(),
    descripcion: z.string().optional(),
});

class PagoServicioController {
    static async create(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const monto = (() => {
                const m = req.body.monto;
                if (typeof m === 'number') return m;
                if (!m) return 0;
                return Number(String(m).replace(',', '.'));
            })();

            let periodoId = Number(req.body.periodo_id ?? req.body.payment_periodo_id);
            if (!periodoId || isNaN(periodoId)) {
                const serviceId = Number(req.body.payment_service_id);
                if (serviceId && !isNaN(serviceId)) {
                    const latest = await models.ServicioPeriodo.findOne({
                        where: {
                            servicio_id: serviceId,
                            estado: ['pending', 'partial'],
                        },
                        order: [['fecha_corte', 'ASC']],
                        transaction: t,
                    });
                    if (latest) periodoId = latest.id;
                }
            }

            const normalized = {
                ...req.body,
                periodo_id: periodoId,
                monto,
            };
            const data = schemaPago.parse(normalized);
            const usuario_id = res.locals.user.id;

            const periodo = await models.ServicioPeriodo.findByPk(data.periodo_id, {
                include: [{ model: models.ServicioEmpresa, as: 'servicio' }],
                transaction: t,
            });
            if (!periodo) throw new NotFoundError('Periodo no encontrado');
            if (periodo.estado === 'paid' || periodo.estado === 'canceled') {
                await t.rollback();
                return res.status(400).json({ error: true, message: 'El periodo ya está pagado o cancelado' });
            }

            const balance = Number(String(periodo.amount_balance).replace(',', '.'));
            const nuevoBalance = Math.max(0, balance - data.monto);
            const nuevoEstado = nuevoBalance <= 0 ? 'paid' : 'partial';

            await models.PagoServicio.create(
                {
                    periodo_id: data.periodo_id,
                    monto: data.monto,
                    descripcion: data.descripcion ?? '',
                    usuario_id,
                },
                { transaction: t },
            );

            const hoy = new Date();
            const corte = new Date(periodo.fecha_corte);
            const esTardio = hoy > corte;

            await periodo.update(
                {
                    amount_balance: nuevoBalance,
                    estado: nuevoEstado,
                    tiene_pagos: true,
                    pago_tardio: esTardio,
                },
                { transaction: t },
            );

            await t.commit();
            return res.json({ success: true, message: 'Pago procesado correctamente' });
        } catch (error) {
            await t.rollback();
            return handleErrorsController(error, res, req);
        }
    }
}

export default PagoServicioController;
