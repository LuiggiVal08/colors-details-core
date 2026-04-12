import { z } from 'zod';
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';

const detalleSchema = z.object({
    producto_id: z.string(),
    detalle_pedido_producto: z.string(),
    cantidad: z.string(),
    precio_unitario: z.string(),
    precio_pedido_producto: z.string(),
    subtotal: z.string(),
});

const pedidoSchema = z.object({
    cliente_id: z.string(),
    usuario_id: z.string(),
    iva_id: z.string(),
    fecha: z.coerce.date(),
    fecha_entrega: z.coerce.date().optional(),
    estado: z.enum(['pendiente', 'procesado', 'completado']),
    total: z.string(),
    observaciones: z.string().optional(),
    detalles: z.array(detalleSchema),
});

class PedidoController {
    static async getAll(req, res) {
        try {
            const pedidos = await models.Pedido.findAll({
                include: [
                    { model: models.Cliente, as: 'cliente' },
                    { model: models.Usuario, as: 'usuario', include: [{ model: models.Empleado, as: 'empleado' }] },
                    { model: models.Pago, as: 'pagos', include: [{ model: models.MetodoPago, as: 'metodo' }] },
                    { model: models.Iva, as: 'iva' },
                    {
                        model: models.PedidoDetalle,
                        as: 'detalles',
                        include: [{ model: models.Producto, as: 'producto' }],
                    },
                ],
                order: [['fecha', 'DESC']],
            });
            res.json(pedidos);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const pedido = await models.Pedido.findByPk(id, {
                include: [
                    { model: models.Cliente, as: 'cliente' },
                    { model: models.Usuario, as: 'usuario', include: [{ model: models.Empleado, as: 'empleado' }] },
                    { model: models.Pago, as: 'pagos', include: [{ model: models.MetodoPago, as: 'metodo' }] },
                    { model: models.Iva, as: 'iva' },
                    {
                        model: models.PedidoDetalle,
                        as: 'detalles',
                        include: [{ model: models.Producto, as: 'producto' }],
                    },
                ],
            });
            if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

            res.json(pedido);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        const t = await models.sequelize.transaction();
        try {
            const fechaPedido = new Date();
            const data = pedidoSchema.parse({ ...req.body, fecha: fechaPedido, estado: 'pendiente' });

            const { cliente_id, usuario_id, fecha, fecha_entrega, estado, total, observaciones, iva_id, detalles } =
                data;
            if (
                (fecha_entrega && new Date(fecha_entrega) < fechaPedido) ||
                new Date(fecha_entrega).toDateString() === fechaPedido.toDateString()
            ) {
                return res.status(400).json({
                    message:
                        'La fecha de entrega no puede ser anterior a la fecha del pedido o igual a la fecha del pedido',
                });
            }
            // Crear pedido principal
            const pedidoNew = await models.Pedido.create(
                { cliente_id, usuario_id, fecha, fecha_entrega, estado, total, observaciones, iva_id },
                { transaction: t },
            );

            // Agrupar cantidades por producto
            const cantidadesPorProducto = {};
            for (const item of detalles) {
                cantidadesPorProducto[item.producto_id] =
                    (cantidadesPorProducto[item.producto_id] || 0) + item.cantidad;
            }

            // Validar stock disponible
            for (const [productoId, cantidadTotal] of Object.entries(cantidadesPorProducto)) {
                const producto = await models.Producto.findByPk(productoId, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });
                if (!producto) return res.status(404).json({ message: `Producto con ID ${productoId} no encontrado` });

                if (producto.stock < cantidadTotal) {
                    return res.status(400).json({
                        message: `Stock insuficiente para el producto ${producto.nombre}. Disponible: ${producto.stock}, Requerido: ${cantidadTotal}`,
                    });
                }
            }

            // Crear detalles y movimientos

            for (const item of detalles) {
                // Buscar producto actualizado (puede cambiar el stock si varios usan el mismo)
                const producto = await models.Producto.findByPk(item.producto_id, {
                    transaction: t,
                    lock: t.LOCK.UPDATE,
                });

                const stockAntes = producto.stock;
                const stockDespues = stockAntes - item.cantidad;

                // Actualizar stock
                await producto.update({ stock: stockDespues }, { transaction: t });

                // Crear detalle del pedido
                await models.PedidoDetalle.create(
                    {
                        pedido_id: pedidoNew.id,
                        ...item,
                    },
                    { transaction: t },
                );

                // Crear movimiento de salida
                await models.MovimientoProducto.create(
                    {
                        producto_id: item.producto_id,
                        tipo: 'salida',
                        cantidad: item.cantidad,
                        stock_antes: stockAntes,
                        stock_despues: stockDespues,
                        fecha: fechaPedido,
                        usuario_id: usuario_id,
                        observacion: 'Pedido' + ' #' + pedidoNew.id + ' ' + pedidoNew.observaciones,
                    },
                    { transaction: t },
                );
            }

            await t.commit();
            res.status(201).json({ pedido: pedidoNew, message: 'Pedido creado correctamente' });
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        const { id } = req.params;
        const t = await models.sequelize.transaction();
        try {
            const pedido = await models.Pedido.findByPk(id);
            if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

            await models.PedidoDetalle.destroy({ where: { pedido_id: id }, transaction: t });
            await pedido.destroy({ transaction: t });

            await t.commit();
            res.json({ message: 'Pedido y detalles eliminados correctamente' });
        } catch (error) {
            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }

    static async updateEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado } = z.object({ estado: z.enum(['completado', 'procesado']) }).parse(req.body);

            const pedido = await models.Pedido.findByPk(id);
            if (!pedido) return res.status(404).json({ message: 'Pedido no encontrado' });

            await pedido.update({ estado });
            res.json({ message: 'Estado actualizado correctamente', pedido });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default PedidoController;
