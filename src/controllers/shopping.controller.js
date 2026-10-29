import { z } from 'zod';
import { Op } from 'sequelize';
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { formatearPrecio } from '../helpers/format.js';
import cajaService from '../services/cajaService.js';
import { getMonedaId } from '../services/monedaService.js';
import {
    esMetodoEfectivo,
    monedaPermitida,
    validarMonedaMetodo,
} from '../services/metodoPagoService.js';
import { queue } from '../config/queueConfig.js';

const detalleSchema = z.object({
    producto_id: z.string(),
    cantidad: z.string().regex(/^[1-9]\d*$/, 'La cantidad debe ser un entero mayor que cero'),
    precio_unitario: z.string(),
    subtotal: z.string(),
});

const pagoSchema = z.object({
    tasa_id: z.string(),
    metodo_pago_id: z.string(),
    fecha: z.coerce.date(),
    monto: z.string(),
    moneda: z.string().optional(),
    monto_recibido: z.string().optional(),
    referencia_pago: z.string().optional(),
    vuelto_usd: z.string().optional(),
    vuelto_bs: z.string().optional(),
});

const ventaSchema = z.object({
    cliente_id: z.string(),
    usuario_id: z.string(),
    iva_id: z.string(),
    fecha: z.coerce.date(),
    total: z.string(),
    observaciones: z.string().optional(),
    detalles: z.array(detalleSchema),
    pagos: z.array(pagoSchema),
});

class VentaController {
    static async getAll(req, res) {
        try {
            const ventas = await models.Venta.findAll({
                include: [
                    { model: models.Cliente, as: 'cliente' },
                    { model: models.Usuario, as: 'usuario', include: [{ model: models.Empleado, as: 'empleado' }] },
                    { model: models.Iva, as: 'iva' },
                    {
                        model: models.VentaDetalle,
                        as: 'detalles',
                        include: [{ model: models.Producto, as: 'producto' }],
                    },
                    {
                        model: models.PagoVenta,
                        as: 'pagos',
                        include: [
                            { model: models.TasaDolar, as: 'tasa' },
                            { model: models.MetodoPago, as: 'metodo_pago' },
                            { model: models.Moneda, as: 'moneda' },
                        ],
                    },
                ],
                order: [['fecha', 'DESC']],
            });
            res.json(ventas);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async getSalesReportPDF(req, res) {
        try {
            const { fecha_inicio, fecha_fin, socketId } = req.body;
            const userId = req.user?.id;

            if (!fecha_inicio || !fecha_fin) {
                return res.status(400).json({ message: 'Faltan fechas' });
            }

            const job = await queue.add('reportes-pdf', {
                tipo: 'VENTAS',
                filtros: { fecha_inicio, fecha_fin },
                socketId: socketId,
                userId: userId,
            });

            res.status(202).json({
                message: 'El reporte se está procesando...',
                jobId: job.id,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const venta = await models.Venta.findByPk(id, {
                include: [
                    { model: models.Cliente, as: 'cliente' },
                    { model: models.Usuario, as: 'usuario', include: [{ model: models.Empleado, as: 'empleado' }] },
                    { model: models.Iva, as: 'iva' },
                    {
                        model: models.VentaDetalle,
                        as: 'detalles',
                        include: [{ model: models.Producto, as: 'producto' }],
                    },
                    {
                        model: models.PagoVenta,
                        as: 'pagos',
                        include: [
                            { model: models.TasaDolar, as: 'tasa' },
                            { model: models.MetodoPago, as: 'metodo_pago' },
                            { model: models.Moneda, as: 'moneda' },
                        ],
                    },
                ],
            });
            if (!venta) return res.status(404).json({ message: 'Venta no encontrada' });

            res.json(venta);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const fechaVenta = new Date();
            const normalizeDecimal = (val) => String(val).replace(/\./g, '').replace(',', '.');
            const body = {
                ...req.body,
                fecha: fechaVenta,
                pagos: (req.body.pagos || []).map((p) => ({
                    ...p,
                    fecha: new Date(), // o usa fechaVenta si debe ser igual
                })),
            };

            const data = ventaSchema.parse(body);
            const { cliente_id, usuario_id, fecha, total, observaciones, iva_id, detalles, pagos } = data;
            const ventaTotal = normalizeDecimal(total);
            const detallesNormalizados = detalles.map((item) => ({
                ...item,
                cantidad: Number(item.cantidad) || 0,
                precio_unitario: normalizeDecimal(item.precio_unitario),
                subtotal: normalizeDecimal(item.subtotal),
            }));

            const venta = await models.Venta.create(
                { cliente_id, usuario_id, fecha, total: ventaTotal, observaciones, iva_id },
                { transaction: t },
            );

            // ========== DETALLES Y MOVIMIENTO PRODUCTO ==========

            for (const item of detallesNormalizados) {
                const producto = await models.Producto.findByPk(item.producto_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });
                if (!producto) {
                    await t.rollback();
                    return res.status(404).json({ message: `Producto con ID ${item.producto_id} no encontrado` });
                }

                const cantidad = Number(item.cantidad) || 0;
                const stockAntes = Number(producto.stock) || 0;
                const stockDespues = stockAntes - cantidad;

                if (stockDespues < 0) {
                    await t.rollback();
                    return res.status(400).json({ message: `Stock insuficiente para el producto ${producto.nombre}` });
                }

                await producto.update({ stock: stockDespues }, { transaction: t });

                await models.VentaDetalle.create(
                    { venta_id: venta.id, ...item, cantidad },
                    { transaction: t },
                );

                await models.MovimientoProducto.create(
                    {
                        producto_id: item.producto_id,
                        tipo: 'salida',
                        cantidad,
                        stock_antes: stockAntes,
                        stock_despues: stockDespues,
                        fecha: fechaVenta,
                        usuario_id,
                        observacion: 'Venta #' + venta.id + ' ' + observaciones,
                    },
                    { transaction: t },
                );
            }

            // ========== VALIDACIÓN Y REGISTRO DE PAGOS ==========

            const iva = await models.Iva.findByPk(iva_id);
            if (!iva) {
                await t.rollback();
                return res.status(404).json({ message: 'IVA no encontrado' });
            }

            const ivaPorcentaje = Number(iva.porcentaje);
            const totalConIVA = Number(
                (formatearPrecio(total) + (formatearPrecio(total) * ivaPorcentaje) / 100).toFixed(2),
            );

            const redondear = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
            const TOLERANCIA = 0.01;
            let totalPagado = 0;
            const pagosConMetodo = await Promise.all(
                pagos.map(async (pago) => ({
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
                const tasa = await models.TasaDolar.findByPk(pago.tasa_id);
                if (!tasa) {
                    await t.rollback();
                    return res.status(404).json({ message: `Tasa con ID ${pago.tasa_id} no encontrada` });
                }

                const pendiente = redondear(totalConIVA - totalPagado);
                if (pendiente <= TOLERANCIA) {
                    await t.rollback();
                    return res.status(400).json({ message: 'La venta ya está completamente pagada' });
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

                const tasaValor = Number(tasa.tasa) || 0;
                const montoRecibido = formatearPrecio(
                    pago.monto_recibido !== undefined ? pago.monto_recibido : pago.monto,
                );
                if (montoRecibido <= 0) {
                    await t.rollback();
                    return res.status(400).json({ message: 'El monto del pago debe ser mayor a 0' });
                }

                const montoUsdBruto =
                    codigo === 'USD' ? montoRecibido : tasaValor > 0 ? montoRecibido / tasaValor : 0;
                const esEfectivo = esMetodoEfectivo(metodo);

                if (!esEfectivo && montoUsdBruto > pendiente + TOLERANCIA) {
                    await t.rollback();
                    return res.status(400).json({ message: 'El pago excede el monto pendiente de la venta' });
                }

                const aplicadoUsd = esEfectivo ? Math.min(montoUsdBruto, pendiente) : montoUsdBruto;
                const aplicadoMoneda =
                    codigo === 'USD' ? aplicadoUsd : tasaValor > 0 ? aplicadoUsd * tasaValor : 0;
                const vueltoMoneda = esEfectivo
                    ? Math.max(0, codigo === 'USD' ? montoRecibido - aplicadoUsd : montoRecibido - aplicadoMoneda)
                    : 0;
                const tieneDistribucion = pago.vuelto_usd !== undefined || pago.vuelto_bs !== undefined;
                let vueltoUsd = esEfectivo
                    ? tieneDistribucion
                        ? formatearPrecio(pago.vuelto_usd || 0)
                        : codigo === 'USD' ? vueltoMoneda : tasaValor > 0 ? vueltoMoneda / tasaValor : 0
                    : 0;
                let vueltoBs = esEfectivo
                    ? tieneDistribucion
                        ? formatearPrecio(pago.vuelto_bs || 0)
                        : 0
                    : 0;
                const vueltoUsdCalculado =
                    codigo === 'USD' ? vueltoMoneda : tasaValor > 0 ? vueltoMoneda / tasaValor : 0;

                if (esEfectivo && vueltoMoneda > 0) {
                    if (vueltoUsdCalculado < 1) {
                        vueltoUsd = 0;
                        vueltoBs = redondear(vueltoUsdCalculado * tasaValor);
                    } else if (redondear(vueltoUsd + (tasaValor > 0 ? vueltoBs / tasaValor : 0)) !== redondear(vueltoMoneda)) {
                        await t.rollback();
                        return res.status(400).json({ message: 'La distribución del vuelto no coincide con el vuelto calculado' });
                    }
                    if (vueltoUsd < 0 || vueltoBs < 0) {
                        await t.rollback();
                        return res.status(400).json({ message: 'La distribución del vuelto no puede ser negativa' });
                    }
                }

                totalPagado = redondear(totalPagado + aplicadoUsd);

                const nuevoPago = await models.PagoVenta.create(
                    {
                        venta_id: venta.id,
                        tasa_id: pago.tasa_id,
                        metodo_pago_id: pago.metodo_pago_id,
                        fecha: fechaVenta,
                        moneda_id: monedaId,
                        monto: aplicadoMoneda.toFixed(2),
                        monto_usd: aplicadoUsd.toFixed(2),
                        monto_recibido: montoRecibido.toFixed(2),
                        vuelto: (codigo === 'USD' ? vueltoUsd : vueltoBs).toFixed(2),
                        vuelto_usd: vueltoUsd.toFixed(2),
                        vuelto_bs: vueltoBs.toFixed(2),
                        referencia_pago: pago.referencia_pago ?? 'N/A',
                    },
                    { transaction: t },
                );

                const detalleVuelto =
                    vueltoMoneda > 0
                        ? ` (recibido ${montoRecibido.toFixed(2)} ${codigo}, vuelto ${vueltoMoneda.toFixed(2)} ${codigo})`
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
                    descripcion: `Pago de venta #${venta.id} por ${metodo.nombre}${detalleVuelto}`,
                    tipo: 'ingreso',
                    ...cajaMovimiento,
                    transaction: t,
                });
                if (vueltoUsd > 0) {
                    await cajaService.realizarMovimiento({
                        usuario_id,
                        monto: vueltoUsd.toFixed(2),
                        moneda: 'USD',
                        descripcion: `Vuelto de venta #${venta.id}`,
                        tipo: 'egreso',
                        transaction: t,
                    });
                }
                if (vueltoBs > 0) {
                    await cajaService.realizarMovimiento({
                        usuario_id,
                        monto: vueltoBs.toFixed(2),
                        moneda: 'VES',
                        descripcion: `Vuelto de venta #${venta.id}`,
                        tipo: 'egreso',
                        transaction: t,
                    });
                }
            }

            if (Math.abs(redondear(totalPagado) - redondear(totalConIVA)) > TOLERANCIA) {
                await t.rollback();
                return res.status(400).json({ message: `Los pagos no concuerdan con el total de la venta con IVA` });
            }
            await t.commit();
            // await t.rollback();
            res.status(201).json({ venta, message: 'Venta registrada correctamente con pagos incluidos' });
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        const { id } = req.params;
        const t = await models.sequelize.transaction();
        try {
            const venta = await models.Venta.findByPk(id, {
                include: [{ model: models.VentaDetalle, as: 'detalles' }],
                transaction: t,
            });
            if (!venta) {
                await t.rollback();
                return res.status(404).json({ message: 'Venta no encontrada' });
            }

            // Restaurar el stock de los productos vendidos
            for (const detalle of venta.detalles || []) {
                const producto = await models.Producto.findByPk(detalle.producto_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });
                if (producto) {
                    const stockActual = Number(producto.stock) || 0;
                    await producto.update(
                        { stock: stockActual + Number(detalle.cantidad) },
                        { transaction: t },
                    );
                }
            }

            await models.VentaDetalle.destroy({ where: { venta_id: id }, transaction: t });
            await models.PagoVenta.destroy({ where: { venta_id: id }, transaction: t });
            await models.MovimientoProducto.destroy(
                { where: { observacion: { [Op.like]: `Venta #${id} %` } } },
                { transaction: t },
            );
            await venta.destroy({ transaction: t });

            await t.commit();
            res.json({ message: 'Venta eliminada correctamente. Stock restaurado.' });
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }
}

export default VentaController;
