import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { NotFoundError } from '../errors/NotFoundError.js';
import { formatearPrecio } from '../helpers/format.js';
import { getMonedaId } from '../services/monedaService.js';

const schemaPago = z.object({
    periodo_id: z.number(),
    monto: z.number().positive(),
    descripcion: z.string().optional(),
});

class PagoServicioController {
    static async getByServicio(req, res) {
        try {
            const { id } = req.params;
            const pagos = await models.PagoServicio.findAll({
                include: [
                    {
                        model: models.ServicioPeriodo,
                        as: 'periodo',
                        where: { servicio_id: id },
                        required: true,
                    },
                    {
                        model: models.Usuario,
                        as: 'usuario',
                        attributes: ['id', 'username'],
                        required: false,
                    },
                    {
                        model: models.Moneda,
                        as: 'moneda',
                        attributes: ['id', 'codigo', 'simbolo'],
                        required: false,
                    },
                ],
                order: [['creado_en', 'DESC']],
            });

            return res.status(200).json({ error: false, data: pagos });
        } catch (error) {
            return handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const monto = formatearPrecio(req.body.monto);

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

            const balance = formatearPrecio(periodo.amount_balance);
            if (data.monto > balance) {
                await t.rollback();
                return res.status(400).json({
                    error: true,
                    message: `El monto excede el saldo pendiente del periodo (USD $${balance})`,
                });
            }
            const nuevoBalance = Math.max(0, balance - data.monto);
            const nuevoEstado = nuevoBalance <= 0 ? 'paid' : 'partial';

            await models.PagoServicio.create(
                {
                    periodo_id: data.periodo_id,
                    monto: data.monto,
                    moneda_id: await getMonedaId('USD', t),
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
