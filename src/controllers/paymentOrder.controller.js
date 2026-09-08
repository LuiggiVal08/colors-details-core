import { formatearPrecio } from '../helpers/format.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { models } from '../models/index.js';
import { Op } from 'sequelize';
import { z } from 'zod';
import cajaService from '../services/cajaService.js';

const schemaPago = z.object({
    pedido_id: z.string(),
    metodo_pago_id: z.string(),
    fecha: z.coerce.date(),
    monto: z.string(),
    referencia_pago: z.string().optional().nullable(),
});

class PagoController {
    // Revierte el ingreso de caja asociado a un pago en efectivo (borrado/edición).
    static async revertirMovimientoEfectivo(pedido_id, transaction) {
        const mov = await models.MovimientoCaja.findOne({
            where: { descripcion: { [Op.like]: `Pago de pedido #${pedido_id}%` } },
            transaction,
        });
        if (!mov) return;

        const control = await models.ControlCaja.findByPk(mov.control_caja_id, { transaction });
        const caja = control
            ? await models.Caja.findByPk(control.caja_id, { transaction, lock: transaction.LOCK.UPDATE })
            : null;
        if (caja) {
            const monto = Number(mov.monto) || 0;
            await caja.update({ monto: Math.max(0, (Number(caja.monto) || 0) - monto) }, { transaction });
        }
        await mov.destroy({ transaction });
    }

    static async getAll(req, res) {
        try {
            const pagos = await models.Pago.findAll({
                include: [
                    { model: models.Pedido, as: 'pedido' },
                    { model: models.MetodoPago, as: 'metodo' },
                ],
            });
            res.json(pagos);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const pago = await models.Pago.findByPk(id, {
                include: [
                    { model: models.Pedido, as: 'pedido' },
                    { model: models.MetodoPago, as: 'metodo' },
                ],
            });
            if (!pago) return res.status(404).json({ message: 'Pago no encontrado' });
            res.json(pago);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const data = schemaPago.parse(req.body);
            const { pedido_id, metodo_pago_id, monto } = data;

            const usuario_id = req.user.id;

            // ==== VALIDACIONES ====
            const pedido = await models.Pedido.findByPk(pedido_id, {
                include: [{ model: models.Iva, as: 'iva' }],
                transaction: t,
            });

            if (!pedido) {
                await t.rollback();
                return res.status(404).json({ message: 'Pedido no encontrado' });
            }

            const metodo = await models.MetodoPago.findByPk(metodo_pago_id, { transaction: t });
            if (!metodo) {
                await t.rollback();
                return res.status(404).json({ message: 'Método de pago no encontrado' });
            }

            const tasa = await models.TasaDolar.findOne({
                order: [['fecha', 'DESC']],
                where: { activa: true },
                transaction: t,
            });
            if (!tasa) {
                await t.rollback();
                return res.status(404).json({ message: 'Tasa no encontrada' });
            }

            // ==== VALIDAR MONTO ====
            const pagos = await models.Pago.findAll({
                where: { pedido_id },
                transaction: t,
            });

            const totalPagos = pagos.reduce((acum, p) => acum + Number(p.monto), 0);

            const ivaPorcentaje = Number(pedido.iva.porcentaje);
            const total = Number(pedido.total);
            const totalMasIVA = total + (total * ivaPorcentaje) / 100;

            const montoNumber = Number(formatearPrecio(monto));
            const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

            if (redondear(totalPagos + montoNumber) > redondear(totalMasIVA)) {
                await t.rollback();
                return res.status(400).json({ message: 'Monto excede el total del pedido' });
            }

            // ==== REGISTRO DEL PAGO ====
            const nuevoPago = await models.Pago.create({ ...data, fecha: new Date() }, { transaction: t });

            // ==== SI ES EFECTIVO → REGISTRAR MOVIMIENTO EN CAJA ====
            if (metodo.tipo === 'efectivo') {
                let montoBs = montoNumber;

                if (tasa) {
                    montoBs = montoNumber * Number(tasa.tasa);
                }

                await cajaService.realizarMovimiento({
                    usuario_id,
                    monto: montoBs.toFixed(2),
                    descripcion: `Pago de pedido #${pedido.id} (${metodo.nombre})`,
                    tipo: 'ingreso',
                    transaction: t,
                });
            }

            // ==== ACTUALIZAR ESTADO DEL PEDIDO ====
            if (totalPagos + montoNumber === totalMasIVA) {
                await pedido.update({ estado: 'procesado' }, { transaction: t });
            }

            await t.commit();
            return res.status(201).json({ message: 'Pago registrado exitosamente', data: nuevoPago.toJSON() });
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const { id } = req.params;
            const pago = await models.Pago.findByPk(id, { transaction: t });
            if (!pago) {
                await t.rollback();
                return res.status(404).json({ message: 'Pago no encontrado' });
            }

            const data = schemaPago.parse(req.body);
            const oldMetodo = await models.MetodoPago.findByPk(pago.metodo_pago_id);

            // Revertir el ingreso de caja si el pago original fue en efectivo
            if (oldMetodo?.tipo === 'efectivo') {
                await PagoController.revertirMovimientoEfectivo(pago.pedido_id, t);
            }

            await pago.update(data, { transaction: t });

            // Registrar el nuevo movimiento si el método actualizado es efectivo
            const newMetodo = await models.MetodoPago.findByPk(data.metodo_pago_id, { transaction: t });
            if (newMetodo?.tipo === 'efectivo') {
                const montoNumber = Number(formatearPrecio(data.monto));
                const tasa = await models.TasaDolar.findOne({
                    order: [['fecha', 'DESC']],
                    where: { activa: true },
                    transaction: t,
                });
                const montoBs = tasa ? (montoNumber * Number(tasa.tasa)).toFixed(2) : montoNumber.toFixed(2);
                await cajaService.realizarMovimiento({
                    usuario_id: req.user.id,
                    monto: montoBs,
                    descripcion: `Pago de pedido #${pago.pedido_id} (${newMetodo.nombre})`,
                    tipo: 'ingreso',
                    transaction: t,
                });
            }

            await t.commit();
            res.json(pago);
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const { id } = req.params;
            const pago = await models.Pago.findByPk(id, {
                include: [{ model: models.MetodoPago, as: 'metodo' }],
                transaction: t,
            });
            if (!pago) {
                await t.rollback();
                return res.status(404).json({ message: 'Pago no encontrado' });
            }

            // Revertir ingreso de caja si el pago era en efectivo
            if (pago.metodo?.tipo === 'efectivo') {
                await PagoController.revertirMovimientoEfectivo(pago.pedido_id, t);
            }

            await pago.destroy({ transaction: t });

            // Si el pedido quedaba procesado solo por este pago, volverlo a pendiente
            const restantes = await models.Pago.count({ where: { pedido_id: pago.pedido_id }, transaction: t });
            if (restantes === 0) {
                await models.Pedido.update(
                    { estado: 'pendiente' },
                    { where: { id: pago.pedido_id }, transaction: t },
                );
            }

            await t.commit();
            res.json({ message: 'Pago eliminado correctamente' });
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }
}

export default PagoController;
