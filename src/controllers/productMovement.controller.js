import { z } from 'zod';
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';

const schemaMovimiento = z.object({
    producto_id: z.string(),
    usuario_id: z.string(),
    tipo: z.enum(['entrada', 'salida']),
    cantidad: z.string(),
    observacion: z.string().optional(),
});

class MovimientoProductoController {
    static async getAll(req, res) {
        try {
            const movimientos = await models.MovimientoProducto.findAll({
                include: [
                    { model: models.Producto, as: 'producto' },
                    { model: models.Usuario, as: 'usuario' },
                ],
                order: [['fecha', 'DESC']],
            });
            res.json(movimientos);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const movimiento = await models.MovimientoProducto.findByPk(id, {
                include: [
                    { model: models.Producto, as: 'producto' },
                    { model: models.Usuario, as: 'usuario' },
                ],
            });
            if (!movimiento) return res.status(404).json({ message: 'Movimiento no encontrado' });

            res.json(movimiento);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = schemaMovimiento.parse(req.body);

            const producto = await models.Producto.findByPk(data.producto_id);
            if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
            data.cantidad = Number(data.cantidad);
            const stockAntes = producto.stock;
            let stockDespues = stockAntes;

            if (data.tipo === 'entrada') {
                stockDespues += data.cantidad;
            } else if (data.tipo === 'salida') {
                if (data.cantidad > stockAntes) {
                    return res.status(400).json({ message: 'Stock insuficiente para salida' });
                }
                stockDespues -= data.cantidad;
            }

            // Registrar el movimiento
            const movimiento = await models.MovimientoProducto.create({
                ...data,
                stock_antes: stockAntes,
                stock_despues: stockDespues,
            });

            // Actualizar stock del producto
            await producto.update({ stock: stockDespues });

            res.status(201).json({ movimiento });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const movimiento = await models.MovimientoProducto.findByPk(id);
            if (!movimiento) return res.status(404).json({ message: 'Movimiento no encontrado' });

            // Opcional: No se revierte el stock por defecto al eliminar un movimiento.
            await movimiento.destroy();
            res.json({ message: 'Movimiento eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default MovimientoProductoController;
