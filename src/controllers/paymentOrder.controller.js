import { formatearPrecio } from '../helpers/format.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { models } from '../models/index.js';
import { Op } from 'sequelize';
import { z } from 'zod';
import cajaService from '../services/cajaService.js';
import { getMonedaId, normalizarCodigoMoneda } from '../services/monedaService.js';

const TOLERANCIA = 0.01;
const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const schemaPago = z.object({
    pedido_id: z.string(),
    metodo_pago_id: z.string(),
    fecha: z.coerce.date(),
    monto: z.string(),
    moneda: z.string().optional(),
    monto_recibido: z.string().optional(),
    referencia_pago: z.string().optional().nullable(),
});

class PagoController {
    // Revierte el ingreso de caja asociado a un pago en efectivo (borrado/edición).
    static async revertirMovimientoEfectivo(pedido_id, transaction) {
        const mov = await models.MovimientoCaja.findOne({
            where: { descripcion: { [Op.like]: `Pago de pedido #${pedido_id}%` } },
            order: [['id', 'DESC']],
            transaction,
        });
        if (!mov) return;

        const control = await models.ControlCaja.findByPk(mov.control_caja_id, { transaction });
        const caja =
            control && !control.fecha_cierre
                ? await models.Caja.findByPk(control.caja_id, { transaction, lock: transaction.LOCK.UPDATE })
                : null;

        if (caja) {
            const moneda = mov.moneda_id ? await models.Moneda.findByPk(mov.moneda_id, { transaction }) : null;
            const campo = moneda?.codigo === 'USD' ? 'monto_usd' : 'monto';
            const monto = formatearPrecio(mov.monto);
            const nuevoSaldo = Math.max(0, formatearPrecio(caja[campo]) - monto);
            await caja.update({ [campo]: nuevoSaldo.toFixed(2) }, { transaction });
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

            const totalPagosUsd = pagos.reduce(
                (acum, p) => acum + Number(p.monto_usd ?? p.monto ?? 0),
                0,
            );

            const ivaPorcentaje = Number(pedido.iva.porcentaje);
            const total = Number(pedido.total);
            const totalMasIVA = total + (total * ivaPorcentaje) / 100;
            const pendiente = redondear(totalMasIVA - totalPagosUsd);

            if (pendiente <= TOLERANCIA) {
                await t.rollback();
                return res.status(400).json({ message: 'El pedido ya está completamente pagado' });
            }

            const montoNumber = formatearPrecio(monto);
            if (montoNumber <= 0) {
                await t.rollback();
                return res.status(400).json({ message: 'El monto del pago debe ser mayor a 0' });
            }

            const codigo = data.moneda ? normalizarCodigoMoneda(data.moneda) : 'USD';
            const monedaId = await getMonedaId(codigo, t);
            if (!monedaId) {
                await t.rollback();
                return res.status(400).json({ message: `Moneda no registrada: ${codigo}` });
            }

            const tasaValor = Number(tasa.tasa) || 0;
            if (codigo !== 'USD' && tasaValor <= 0) {
                await t.rollback();
                return res.status(400).json({ message: 'No hay tasa de cambio activa para pagos en bolívares' });
            }

            const montoUsdBruto = codigo === 'USD' ? montoNumber : montoNumber / tasaValor;
            const esEfectivo = metodo.tipo === 'efectivo';

            if (!esEfectivo && montoUsdBruto > pendiente + TOLERANCIA) {
                await t.rollback();
                return res.status(400).json({ message: 'Monto excede el total pendiente del pedido' });
            }

            const aplicadoUsd = esEfectivo ? Math.min(montoUsdBruto, pendiente) : montoUsdBruto;
            const aplicadoMoneda = codigo === 'USD' ? aplicadoUsd : aplicadoUsd * tasaValor;
            const vuelto = esEfectivo ? Math.max(0, montoNumber - aplicadoMoneda) : 0;

            // ==== REGISTRO DEL PAGO ====
            const nuevoPago = await models.Pago.create(
                {
                    pedido_id: pedido.id,
                    metodo_pago_id: metodo.id,
                    tasa_id: tasa.id,
                    fecha: new Date(),
                    monto: aplicadoMoneda.toFixed(2),
                    moneda_id: monedaId,
                    monto_usd: aplicadoUsd.toFixed(2),
                    monto_recibido: montoNumber.toFixed(2),
                    vuelto: vuelto.toFixed(2),
                    referencia_pago: data.referencia_pago ?? 'N/A',
                },
                { transaction: t },
            );

            // ==== SI ES EFECTIVO → REGISTRAR MOVIMIENTO EN CAJA ====
            if (esEfectivo) {
                const detalleVuelto =
                    vuelto > 0
                        ? ` (recibido ${montoNumber.toFixed(2)} ${codigo}, vuelto ${vuelto.toFixed(2)} ${codigo})`
                        : '';

                await cajaService.realizarMovimiento({
                    usuario_id,
                    monto: aplicadoMoneda.toFixed(2),
                    moneda: codigo,
                    tasa: tasaValor,
                    descripcion: `Pago de pedido #${pedido.id} (${metodo.nombre})${detalleVuelto}`,
                    tipo: 'ingreso',
                    transaction: t,
                });
            }

            // ==== ACTUALIZAR ESTADO DEL PEDIDO ====
            if (totalPagosUsd + aplicadoUsd >= totalMasIVA - TOLERANCIA) {
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
            const pedido = await models.Pedido.findByPk(pago.pedido_id, {
                include: [{ model: models.Iva, as: 'iva' }],
                transaction: t,
            });
            if (!pedido) {
                await t.rollback();
                return res.status(404).json({ message: 'Pedido no encontrado' });
            }

            const oldMetodo = await models.MetodoPago.findByPk(pago.metodo_pago_id, { transaction: t });
            const newMetodo = await models.MetodoPago.findByPk(data.metodo_pago_id, { transaction: t });
            if (!newMetodo) {
                await t.rollback();
                return res.status(404).json({ message: 'Método de pago no encontrado' });
            }

            // Revertir el ingreso de caja si el pago original fue en efectivo
            if (oldMetodo?.tipo === 'efectivo') {
                await PagoController.revertirMovimientoEfectivo(pago.pedido_id, t);
            }

            const otrosPagos = await models.Pago.findAll({
                where: { pedido_id: pago.pedido_id, id: { [Op.ne]: pago.id } },
                transaction: t,
            });
            const otrosUsd = otrosPagos.reduce(
                (acum, p) => acum + Number(p.monto_usd ?? p.monto ?? 0),
                0,
            );

            const ivaPorcentaje = Number(pedido.iva?.porcentaje || 0);
            const total = Number(pedido.total) || 0;
            const totalMasIVA = total + (total * ivaPorcentaje) / 100;
            const pendiente = redondear(totalMasIVA - otrosUsd);

            if (pendiente <= TOLERANCIA) {
                await t.rollback();
                return res.status(400).json({ message: 'El pedido ya está completamente pagado' });
            }

            const montoNumber = formatearPrecio(data.monto);
            if (montoNumber <= 0) {
                await t.rollback();
                return res.status(400).json({ message: 'El monto del pago debe ser mayor a 0' });
            }

            const monedaActual = pago.moneda_id
                ? await models.Moneda.findByPk(pago.moneda_id, { transaction: t })
                : null;
            const codigo = data.moneda
                ? normalizarCodigoMoneda(data.moneda)
                : monedaActual?.codigo || 'USD';
            const monedaId = await getMonedaId(codigo, t);
            if (!monedaId) {
                await t.rollback();
                return res.status(400).json({ message: `Moneda no registrada: ${codigo}` });
            }

            const tasa = await models.TasaDolar.findOne({
                order: [['fecha', 'DESC']],
                where: { activa: true },
                transaction: t,
            });
            const tasaValor = Number(tasa?.tasa) || 0;
            if (codigo !== 'USD' && tasaValor <= 0) {
                await t.rollback();
                return res.status(400).json({ message: 'No hay tasa de cambio activa para pagos en bolívares' });
            }

            const montoUsdBruto = codigo === 'USD' ? montoNumber : montoNumber / tasaValor;
            const esEfectivo = newMetodo.tipo === 'efectivo';

            if (!esEfectivo && montoUsdBruto > pendiente + TOLERANCIA) {
                await t.rollback();
                return res.status(400).json({ message: 'Monto excede el total pendiente del pedido' });
            }

            const aplicadoUsd = esEfectivo ? Math.min(montoUsdBruto, pendiente) : montoUsdBruto;
            const aplicadoMoneda = codigo === 'USD' ? aplicadoUsd : aplicadoUsd * tasaValor;
            const vuelto = esEfectivo ? Math.max(0, montoNumber - aplicadoMoneda) : 0;

            await pago.update(
                {
                    metodo_pago_id: newMetodo.id,
                    tasa_id: tasa?.id ?? pago.tasa_id,
                    fecha: data.fecha,
                    monto: aplicadoMoneda.toFixed(2),
                    moneda_id: monedaId,
                    monto_usd: aplicadoUsd.toFixed(2),
                    monto_recibido: montoNumber.toFixed(2),
                    vuelto: vuelto.toFixed(2),
                    referencia_pago: data.referencia_pago ?? 'N/A',
                },
                { transaction: t },
            );

            // Registrar el nuevo movimiento si el método actualizado es efectivo
            if (esEfectivo) {
                const detalleVuelto =
                    vuelto > 0
                        ? ` (recibido ${montoNumber.toFixed(2)} ${codigo}, vuelto ${vuelto.toFixed(2)} ${codigo})`
                        : '';
                await cajaService.realizarMovimiento({
                    usuario_id: req.user.id,
                    monto: aplicadoMoneda.toFixed(2),
                    moneda: codigo,
                    tasa: tasaValor,
                    descripcion: `Pago de pedido #${pago.pedido_id} (${newMetodo.nombre})${detalleVuelto}`,
                    tipo: 'ingreso',
                    transaction: t,
                });
            }

            if (otrosUsd + aplicadoUsd >= totalMasIVA - TOLERANCIA) {
                await pedido.update({ estado: 'procesado' }, { transaction: t });
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
