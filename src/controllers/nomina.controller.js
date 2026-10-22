import { Op } from 'sequelize';
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handlleErrorsController.js';
import { z } from 'zod';
import { nominaQueue } from '../config/nominaQueue.js';
import cajaService from '../services/cajaService.js';
import { formatearPrecio } from '../helpers/format.js';

const generateSchema = z.object({
    periodo_inicio: z.string().min(1, 'Fecha inicio requerida'),
    periodo_fin: z.string().min(1, 'Fecha fin requerida'),
});

const pagarSchema = z.object({
    monto: z.string().optional(),
});

class NominaController {
    static async getAll(req, res) {
        try {
            const isAdmin = ['admin', 'superadmin'].includes(req.user.tipo_usuario_name);
            const include = [
                { model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] },
                { model: models.TasaDolar, as: 'tasa', attributes: ['id', 'tasa'] },
            ];
            if (!isAdmin) {
                include.push({
                    model: models.NominaDetalle,
                    as: 'detalles',
                    attributes: ['id'],
                    where: { empleado_id: req.user.empleado_id },
                    required: true,
                });
            }
            const nominas = await models.Nomina.findAll({
                include,
                order: [['creado_en', 'DESC']],
            });
            res.json(nominas);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const isAdmin = ['admin', 'superadmin'].includes(req.user.tipo_usuario_name);
            const nomina = await models.Nomina.findByPk(req.params.id, {
                include: [
                    { model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] },
                    { model: models.TasaDolar, as: 'tasa', attributes: ['id', 'tasa'] },
                    {
                        model: models.NominaDetalle,
                        as: 'detalles',
                        include: [{ model: models.Empleado, as: 'empleado' }],
                        ...(isAdmin ? {} : { where: { empleado_id: req.user.empleado_id } }),
                    },
                ],
            });
            if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });
            if (!isAdmin && nomina.detalles.length === 0) {
                return res.status(403).json({ message: 'No tienes permisos para ver esta nómina' });
            }
            res.json(nomina);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async generate(req, res) {
        try {
            const data = generateSchema.parse(req.body);
            const empresa = await models.Empresa.findOne();
            if (!empresa) return res.status(400).json({ message: 'No hay empresa registrada' });

            const existente = await models.Nomina.findOne({
                where: {
                    periodo_inicio: data.periodo_inicio,
                    periodo_fin: data.periodo_fin,
                    empresa_id: empresa.id,
                    estado: { [Op.ne]: 'failed' },
                },
            });
            if (existente) {
                return res.status(409).json({
                    message: 'Ya existe una nómina para este período',
                    nomina: existente,
                });
            }

            const job = await nominaQueue.add('generar', {
                periodoInicio: data.periodo_inicio,
                periodoFin: data.periodo_fin,
                empresaId: empresa.id,
                usuarioId: req.user.id,
            });

            res.json({ message: 'Nómina en proceso', jobId: job.id });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    /**
     * Registra el pago de una nómina: genera el egreso en la caja abierta del usuario
     * y actualiza el estado de pago de la nómina.
     */
    static async pagar(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const isAdmin = ['admin', 'superadmin'].includes(req.user.tipo_usuario_name);
            if (!isAdmin) {
                await t.rollback();
                return res.status(403).json({ message: 'No tienes permisos para pagar la nómina' });
            }

            const { id } = req.params;
            const data = pagarSchema.parse(req.body ?? {});

            const nomina = await models.Nomina.findByPk(id, {
                include: [{ model: models.TasaDolar, as: 'tasa' }],
                transaction: t,
            });

            if (!nomina) {
                await t.rollback();
                return res.status(404).json({ message: 'Nómina no encontrada' });
            }

            if (nomina.estado !== 'completed') {
                await t.rollback();
                return res.status(400).json({ message: 'La nómina aún no está lista para pagarse' });
            }

            const totalBs = formatearPrecio(nomina.total_monto);
            const pagadoBs = formatearPrecio(nomina.total_pagado);
            const pendienteBs = Math.round((totalBs - pagadoBs) * 100) / 100;

            if (pendienteBs <= 0.01) {
                await t.rollback();
                return res.status(400).json({ message: 'La nómina ya está completamente pagada' });
            }

            const montoPago = data.monto !== undefined ? formatearPrecio(data.monto) : pendienteBs;

            if (montoPago <= 0) {
                await t.rollback();
                return res.status(400).json({ message: 'El monto a pagar debe ser mayor a 0' });
            }

            if (montoPago > pendienteBs + 0.01) {
                await t.rollback();
                return res.status(400).json({ message: 'El monto a pagar excede el saldo pendiente de la nómina' });
            }

            const tasaValor = Number(nomina.tasa?.tasa) || 0;

            const movimiento = await cajaService.realizarMovimiento({
                usuario_id: req.user.id,
                monto: montoPago.toFixed(2),
                moneda: 'VES',
                tasa: tasaValor > 0 ? tasaValor : null,
                descripcion: `Pago de nómina #${nomina.id} (${nomina.periodo_inicio} - ${nomina.periodo_fin})`,
                tipo: 'egreso',
                transaction: t,
            });

            const nuevoPagado = Math.round((pagadoBs + montoPago) * 100) / 100;
            const nuevoPendiente = Math.round((totalBs - nuevoPagado) * 100) / 100;

            await nomina.update(
                {
                    total_pagado: nuevoPagado.toFixed(2),
                    estado_pago: nuevoPendiente <= 0.01 ? 'pagada' : 'parcial',
                    pagada_en: nuevoPendiente <= 0.01 ? new Date() : null,
                    pagada_por_id: req.user.id,
                },
                { transaction: t },
            );

            await t.commit();

            return res.json({
                message:
                    nuevoPendiente <= 0.01
                        ? 'Nómina pagada exitosamente'
                        : 'Pago parcial registrado exitosamente',
                data: {
                    nomina_id: nomina.id,
                    total_pagado: nuevoPagado,
                    pendiente: nuevoPendiente,
                    estado_pago: nuevoPendiente <= 0.01 ? 'pagada' : 'parcial',
                    movimiento_id: movimiento.id,
                },
            });
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }
}

export default NominaController;
