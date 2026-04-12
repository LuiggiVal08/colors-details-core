import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { NotFoundError } from '../errors/NotFoundError.js';

const schemaPago = z.object({
    servicio_id: z.number(),
    monto: z.number().positive(),
    descripcion: z.string().optional(),
});

function parseMoney(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    return Number(value.replace(',', '.'));
}

function formatMoney(num) {
    return num.toFixed(2).replace('.', ',');
}

class PagoServicioController {
    static async create(req, res) {
        const t = await models.sequelize.transaction();
        try {
            console.log('[PagoServicio] create - entrada');
            console.log('[PagoServicio] request.body:', req.body);
            // Normalizar nombres desde el frontend y tipos (ej: payment_service_id -> servicio_id, monto '10,00' -> 10.00)
            const normalized = {
                ...req.body,
                servicio_id: Number(req.body.servicio_id ?? req.body.payment_service_id),
                monto: (() => {
                    const m = req.body.monto;
                    if (typeof m === 'number') return m;
                    if (!m) return 0;
                    return Number(String(m).replace(',', '.'));
                })(),
            };
            console.log('[PagoServicio] normalized body for validation:', normalized);
            const data = schemaPago.parse(normalized);
            console.log('[PagoServicio] data parsed:', data);
            const usuario_id = res.locals.user.id;
            console.log('[PagoServicio] usuario_id:', usuario_id);

            let montoRestante = data.monto;
            console.log('[PagoServicio] montoRestante inicial:', montoRestante);

            // 1) Obtener servicio
            // Algunos archivos/modelos usan el nombre Servicio o ServicioEmpresa.
            const ServiceModel = models.Servicio || models.ServicioEmpresa;
            if (!ServiceModel) {
                console.log('[PagoServicio] no existe models.Servicio ni models.ServicioEmpresa');
                throw new NotFoundError('Modelo de servicio no disponible');
            }
            console.log('[PagoServicio] usando modelo de servicio:', ServiceModel.name || 'ServicioModel');
            const servicio = await ServiceModel.findByPk(data.servicio_id);
            if (!servicio) {
                console.log('[PagoServicio] servicio no encontrado:', data.servicio_id);
                throw new NotFoundError('Servicio no encontrado');
            }
            console.log('[PagoServicio] servicio encontrado:', servicio.id || servicio);

            // 2) Obtener periodos pendientes o parciales
            const periodos = await models.ServicioPeriodo.findAll({
                where: {
                    servicio_id: data.servicio_id,
                    estado: ['pending', 'partial'],
                },
                order: [['fecha_corte', 'ASC']],
                transaction: t,
            });
            console.log('[PagoServicio] periodos encontrados:', periodos.length);
            if (periodos.length)
                console.log(
                    '[PagoServicio] primeros periodos:',
                    periodos.slice(0, 3).map((p) => ({
                        id: p.id,
                        fecha_corte: p.fecha_corte,
                        amount_due: p.amount_due,
                        amount_balance: p.amount_balance,
                        estado: p.estado,
                    })),
                );
            // Registro global del pago
            const pago = await models.PagoServicio.create(
                {
                    servicio_id: data.servicio_id,
                    monto: data.monto,
                    descripcion: data.descripcion ?? '',
                    usuario_id,
                },
                { transaction: t },
            );
            console.log('[PagoServicio] pago registrado id:', pago.id, 'monto:', pago.monto);

            // 3) Recorrer periodos y pagar uno por uno
            for (const periodo of periodos) {
                if (montoRestante <= 0) break;

                console.log('[PagoServicio] procesando periodo id:', periodo.id, 'estado:', periodo.estado);
                const due = parseMoney(periodo.amount_due);
                const balance = parseMoney(periodo.amount_balance);
                console.log('[PagoServicio] due / balance:', due, '/', balance);

                const pendientePeriodo = due - balance;

                let aplicado = 0;

                console.log(
                    '[PagoServicio] pendientePeriodo:',
                    pendientePeriodo,
                    'montoRestante antes:',
                    montoRestante,
                );
                if (montoRestante >= pendientePeriodo) {
                    // Pago completo del periodo
                    aplicado = pendientePeriodo;
                    montoRestante -= pendientePeriodo;

                    periodo.amount_balance = formatMoney(due);
                    periodo.estado = 'paid';
                    periodo.tiene_pagos = true;
                    periodo.fecha_pago = new Date();
                } else {
                    // Pago parcial
                    aplicado = montoRestante;
                    montoRestante = 0;

                    const nuevoBalance = balance + aplicado;
                    periodo.amount_balance = formatMoney(nuevoBalance);
                    periodo.estado = 'partial';
                    periodo.tiene_pagos = true;
                }

                // Marcar pago tardío
                const hoy = new Date();
                const corte = new Date(periodo.fecha_corte);
                periodo.pago_tardio = hoy > corte;
                await periodo.save({ transaction: t });
                console.log(
                    '[PagoServicio] periodo guardado:',
                    periodo.id,
                    'estado:',
                    periodo.estado,
                    'amount_balance:',
                    periodo.amount_balance,
                );

                // Registrar la transacción por periodo
                const trans = await models.PagoTransaccion.create(
                    {
                        periodo_id: periodo.id,
                        servicio_id: data.servicio_id,
                        usuario_id,
                        fecha_pago: new Date(),
                        monto: aplicado,
                    },
                    { transaction: t },
                );
                console.log('[PagoServicio] pago transaccion creada id:', trans.id, 'monto:', aplicado);
            }

            // 4) Si sobra dinero → crédito
            if (montoRestante > 0) {
                const credito = await models.CreditoServicio.create(
                    {
                        servicio_id: data.servicio_id,
                        monto: montoRestante,
                        monto_disponible: montoRestante,
                        descripcion: 'Crédito generado por pago excedente',
                        usuario_id,
                    },
                    { transaction: t },
                );
                console.log('[PagoServicio] credito creado id:', credito.id, 'monto:', credito.monto);
            }

            await t.commit();
            console.log('[PagoServicio] commit exitoso');
            return res.json({ success: true, message: 'Pago procesado correctamente' });
        } catch (error) {
            await t.rollback();
            console.error('[PagoServicio] error:', error && error.stack ? error.stack : error);
            return handleErrorsController(error, res, req);
        }
    }
}

export default PagoServicioController;
