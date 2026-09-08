import { z } from 'zod';
import { Op } from 'sequelize';
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { formatearPrecio } from '../helpers/format.js';
import cajaService from '../services/cajaService.js';
import { queue } from '../config/queueConfig.js';

const detalleSchema = z.object({
    producto_id: z.string(),
    cantidad: z.string(),
    precio_unitario: z.string(),
    subtotal: z.string(),
});

const pagoSchema = z.object({
    tasa_id: z.string(),
    metodo_pago_id: z.string(),
    fecha: z.coerce.date(),
    monto: z.string(),
    referencia_pago: z.string().optional(),
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
            let totalPagado = 0;

            for (const pago of pagos) {
                const metodo = await models.MetodoPago.findByPk(pago.metodo_pago_id);
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

                const monto = formatearPrecio(String(pago.monto).replace(',', '.'));

                totalPagado = redondear(totalPagado + monto);

                if (totalPagado > redondear(totalConIVA)) {
                    await t.rollback();
                    return res
                        .status(400)
                        .json({ message: 'La suma de los pagos excede el total de la venta con IVA' });
                }
                await models.PagoVenta.create({ venta_id: venta.id, ...pago, fecha: fechaVenta }, { transaction: t });
                const montoBs = monto * Number(tasa.tasa);

                if (metodo.tipo === 'efectivo') {
                    await cajaService.realizarMovimiento({
                        usuario_id,
                        monto: montoBs.toFixed(2),
                        descripcion: `Pago de venta #${venta.id} por ${metodo.nombre}`,
                        tipo: 'ingreso',
                        transaction: t,
                    });
                }
            }

            if (redondear(totalPagado) !== redondear(totalConIVA)) {
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
