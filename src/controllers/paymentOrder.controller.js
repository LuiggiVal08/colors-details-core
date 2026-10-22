import { formatearPrecio } from '../helpers/format.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { models } from '../models/index.js';
import { Op } from 'sequelize';
import { z } from 'zod';
import cajaService from '../services/cajaService.js';
import { getMonedaId } from '../services/monedaService.js';
import {
    esMetodoEfectivo,
    monedaPermitida,
    validarMonedaMetodo,
} from '../services/metodoPagoService.js';

const TOLERANCIA = 0.01;
const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const schemaPago = z.object({
    pedido_id: z.string().optional(),
    metodo_pago_id: z.string(),
    fecha: z.coerce.date().optional(),
    monto: z.string(),
    moneda: z.string().optional(),
    monto_recibido: z.string().optional(),
    referencia_pago: z.string().optional().nullable(),
    vuelto_usd: z.string().optional(),
    vuelto_bs: z.string().optional(),
});

const schemaPagos = z.object({
    pedido_id: z.string(),
    fecha: z.coerce.date().optional(),
    pagos: z.array(schemaPago).min(1, 'Debe registrar al menos un pago'),
});

class PagoController {
    // Revierte el ingreso de caja asociado a un pago en efectivo (borrado/edición).
    static async revertirMovimientoEfectivo(pedido_id, transaction, pago_id = null) {
        let mov = null;

        // Con múltiples pagos por pedido se revierte el movimiento del pago específico
        if (pago_id) {
            mov = await models.MovimientoCaja.findOne({
                where: {
                    [Op.and]: [
                        { descripcion: { [Op.like]: `Pago de pedido #${pedido_id}%` } },
                        { descripcion: { [Op.like]: `%[pago #${pago_id}]%` } },
                    ],
                },
                order: [['id', 'DESC']],
                transaction,
            });
        }

        // Fallback para movimientos creados antes de etiquetar el pago
        if (!mov) {
            mov = await models.MovimientoCaja.findOne({
                where: { descripcion: { [Op.like]: `Pago de pedido #${pedido_id}%` } },
                order: [['id', 'DESC']],
                transaction,
            });
        }

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
            const body = req.body ?? {};

            // Acepta el payloadMultiple (pagos[]) y el payload legacy de un solo pago
            const pagosInput =
                Array.isArray(body.pagos) && body.pagos.length > 0
                    ? body.pagos
                    : [
                          {
                              metodo_pago_id: body.metodo_pago_id,
                              monto: body.monto,
                              moneda: body.moneda,
                              monto_recibido: body.monto_recibido,
                              referencia_pago: body.referencia_pago,
                          },
                      ];

            const data = schemaPagos.parse({
                pedido_id: body.pedido_id,
                fecha: body.fecha,
                pagos: pagosInput,
            });

            const { pedido_id, fecha: fechaPago } = data;

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

            const tasa = await models.TasaDolar.findOne({
                order: [['fecha', 'DESC']],
                where: { activa: true },
                transaction: t,
            });
            if (!tasa) {
                await t.rollback();
                return res.status(404).json({ message: 'Tasa no encontrada' });
            }
            const tasaValor = Number(tasa.tasa) || 0;

            // ==== VALIDAR MONTO ====
            const pagosRegistrados = await models.Pago.findAll({
                where: { pedido_id },
                transaction: t,
            });

            const totalPagosUsd = pagosRegistrados.reduce(
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

            const pagosCreados = [];
            let acumuladoUsd = 0;
            const pagosConMetodo = await Promise.all(
                data.pagos.map(async (pago) => ({
                    pago,
                    metodo: await models.MetodoPago.findByPk(pago.metodo_pago_id, { transaction: t }),
                })),
            );
            const pagosOrdenados = pagosConMetodo.sort(
                (a, b) => Number(esMetodoEfectivo(a.metodo)) - Number(esMetodoEfectivo(b.metodo)),
            );

            for (const { pago, metodo } of pagosOrdenados) {
                if (!metodo) {
                    await t.rollback();
                    return res
                        .status(404)
                        .json({ message: `Método de pago con ID ${pago.metodo_pago_id} no encontrado` });
                }

                const errorMoneda = validarMonedaMetodo(metodo, pago.moneda);
                if (errorMoneda) {
                    await t.rollback();
                    return res.status(400).json({ message: errorMoneda });
                }

                const codigo = monedaPermitida(metodo, pago.moneda);
                const monedaId = await getMonedaId(codigo, t);
                if (!monedaId) {
                    await t.rollback();
                    return res.status(400).json({ message: `Moneda no registrada: ${codigo}` });
                }

                if (codigo !== 'USD' && tasaValor <= 0) {
                    await t.rollback();
                    return res
                        .status(400)
                        .json({ message: 'No hay tasa de cambio activa para pagos en bolívares' });
                }

                const montoNumber = formatearPrecio(pago.monto);
                if (montoNumber <= 0) {
                    await t.rollback();
                    return res.status(400).json({ message: 'El monto del pago debe ser mayor a 0' });
                }

                const montoUsdBruto =
                    codigo === 'USD' ? montoNumber : tasaValor > 0 ? montoNumber / tasaValor : 0;
                const esEfectivo = esMetodoEfectivo(metodo);

                const pendienteRestante = redondear(pendiente - acumuladoUsd);
                if (pendienteRestante <= TOLERANCIA) {
                    await t.rollback();
                    return res.status(400).json({ message: 'El pedido ya está completamente pagado' });
                }

                if (!esEfectivo && montoUsdBruto > pendienteRestante + TOLERANCIA) {
                    await t.rollback();
                    return res.status(400).json({ message: 'Monto excede el total pendiente del pedido' });
                }

                const aplicadoUsd = esEfectivo
                    ? Math.min(montoUsdBruto, pendienteRestante)
                    : montoUsdBruto;
                const aplicadoMoneda = codigo === 'USD' ? aplicadoUsd : aplicadoUsd * tasaValor;
                const vuelto = esEfectivo ? Math.max(0, montoNumber - aplicadoMoneda) : 0;
                const tieneDistribucion = pago.vuelto_usd !== undefined || pago.vuelto_bs !== undefined;
                let vueltoUsd = esEfectivo
                    ? tieneDistribucion
                        ? formatearPrecio(pago.vuelto_usd || 0)
                        : codigo === 'USD' ? vuelto : tasaValor > 0 ? vuelto / tasaValor : 0
                    : 0;
                let vueltoBs = esEfectivo
                    ? tieneDistribucion ? formatearPrecio(pago.vuelto_bs || 0) : 0
                    : 0;
                const vueltoUsdCalculado = codigo === 'USD' ? vuelto : tasaValor > 0 ? vuelto / tasaValor : 0;
                if (esEfectivo && vuelto > 0) {
                    if (vueltoUsdCalculado < 1) {
                        vueltoUsd = 0;
                        vueltoBs = redondear(vueltoUsdCalculado * tasaValor);
                    } else if (
                        redondear(vueltoUsd + (tasaValor > 0 ? vueltoBs / tasaValor : 0)) !== redondear(vuelto)
                    ) {
                        await t.rollback();
                        return res.status(400).json({ message: 'La distribución del vuelto no coincide con el vuelto calculado' });
                    }
                    if (vueltoUsd < 0 || vueltoBs < 0) {
                        await t.rollback();
                        return res.status(400).json({ message: 'La distribución del vuelto no puede ser negativa' });
                    }
                }

                // ==== REGISTRO DEL PAGO ====
                const nuevoPago = await models.Pago.create(
                    {
                        pedido_id: pedido.id,
                        metodo_pago_id: metodo.id,
                        tasa_id: tasa.id,
                        fecha: fechaPago ?? new Date(),
                        monto: aplicadoMoneda.toFixed(2),
                        moneda_id: monedaId,
                        monto_usd: aplicadoUsd.toFixed(2),
                        monto_recibido: montoNumber.toFixed(2),
                        vuelto: (codigo === 'USD' ? vueltoUsd : vueltoBs).toFixed(2),
                        vuelto_usd: vueltoUsd.toFixed(2),
                        vuelto_bs: vueltoBs.toFixed(2),
                        referencia_pago: pago.referencia_pago ?? 'N/A',
                    },
                    { transaction: t },
                );

                const detalleVuelto =
                    vuelto > 0
                        ? ` (recibido ${montoNumber.toFixed(2)} ${codigo}, vuelto ${vuelto.toFixed(2)} ${codigo})`
                        : '';
                const cajaMovimiento = esEfectivo
                    ? {}
                    : {
                          caja_id: (await cajaService.obtenerCajaActivaPorUsuario(usuario_id, t)).caja.id,
                          medio_pago: 'digital',
                          metodo_pago_id: metodo.id,
                          referencia: pago.referencia_pago ?? `Pago #${nuevoPago.id}`,
                      };

                await cajaService.realizarMovimiento({
                    usuario_id,
                    monto: aplicadoMoneda.toFixed(2),
                    moneda: codigo,
                    tasa: tasaValor,
                    descripcion: `Pago de pedido #${pedido.id} (${metodo.nombre}) [pago #${nuevoPago.id}]${detalleVuelto}`,
                    tipo: 'ingreso',
                    ...cajaMovimiento,
                    transaction: t,
                });
                if (vueltoUsd > 0) {
                    await cajaService.realizarMovimiento({
                        usuario_id,
                        monto: vueltoUsd.toFixed(2),
                        moneda: 'USD',
                        descripcion: `Vuelto de pedido #${pedido.id}`,
                        tipo: 'egreso',
                        transaction: t,
                    });
                }
                if (vueltoBs > 0) {
                    await cajaService.realizarMovimiento({
                        usuario_id,
                        monto: vueltoBs.toFixed(2),
                        moneda: 'VES',
                        descripcion: `Vuelto de pedido #${pedido.id}`,
                        tipo: 'egreso',
                        transaction: t,
                    });
                }

                acumuladoUsd = redondear(acumuladoUsd + aplicadoUsd);
                pagosCreados.push(nuevoPago);
            }

            // ==== ACTUALIZAR ESTADO DEL PEDIDO ====
            if (totalPagosUsd + acumuladoUsd >= totalMasIVA - TOLERANCIA) {
                await pedido.update({ estado: 'procesado' }, { transaction: t });
            }

            await t.commit();
            const esMultiple = pagosCreados.length > 1;
            return res.status(201).json({
                message: esMultiple
                    ? 'Pagos registrados exitosamente'
                    : 'Pago registrado exitosamente',
                data: esMultiple ? pagosCreados.map((p) => p.toJSON()) : pagosCreados[0].toJSON(),
            });
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
            if (esMetodoEfectivo(oldMetodo)) {
                await PagoController.revertirMovimientoEfectivo(pago.pedido_id, t, pago.id);
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

            const errorMoneda = validarMonedaMetodo(newMetodo, data.moneda);
            if (errorMoneda) {
                await t.rollback();
                return res.status(400).json({ message: errorMoneda });
            }

            const codigo = monedaPermitida(
                newMetodo,
                data.moneda ?? monedaActual?.codigo ?? 'USD',
            );
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
            const esEfectivo = esMetodoEfectivo(newMetodo);

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
                    fecha: data.fecha ?? pago.fecha,
                    monto: aplicadoMoneda.toFixed(2),
                    moneda_id: monedaId,
                    monto_usd: aplicadoUsd.toFixed(2),
                    monto_recibido: montoNumber.toFixed(2),
                    vuelto: vuelto.toFixed(2),
                    referencia_pago: data.referencia_pago ?? 'N/A',
                },
                { transaction: t },
            );

            const detalleVuelto =
                vuelto > 0
                    ? ` (recibido ${montoNumber.toFixed(2)} ${codigo}, vuelto ${vuelto.toFixed(2)} ${codigo})`
                    : '';
            const cajaMovimiento = esEfectivo
                ? {}
                : {
                      caja_id: (await cajaService.obtenerCajaActivaPorUsuario(req.user.id, t)).caja.id,
                      medio_pago: 'digital',
                      metodo_pago_id: newMetodo.id,
                      referencia: data.referencia_pago ?? `Pago #${pago.id}`,
                  };
            await cajaService.realizarMovimiento({
                usuario_id: req.user.id,
                monto: aplicadoMoneda.toFixed(2),
                moneda: codigo,
                tasa: tasaValor,
                descripcion: `Pago de pedido #${pago.pedido_id} (${newMetodo.nombre}) [pago #${pago.id}]${detalleVuelto}`,
                tipo: 'ingreso',
                ...cajaMovimiento,
                transaction: t,
            });

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
            if (esMetodoEfectivo(pago.metodo)) {
                await PagoController.revertirMovimientoEfectivo(pago.pedido_id, t, pago.id);
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
