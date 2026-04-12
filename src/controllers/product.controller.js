import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { queue } from '../config/queueConfig.js';

const productoSchema = z.object({
    categoria_id: z.string(),
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    precio: z.string().min(1, 'El precio es obligatorio'),
    stock: z.string().optional(),
    codigo: z.string().min(1, 'El codigo es obligatorio'),
});

class ProductoController {
    static async getAll(req, res) {
        try {
            const productos = await models.Producto.findAll({
                include: [{ model: models.CategoriaProducto, as: 'categoria' }],
            });
            res.json(productos);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    // ruta del logo: /public/img/logo.png

    static async getAllReportPDF(req, res) {
        try {
            const { socketId } = req.body; // Extraído por tu interceptor del front

            // 🚀 ENVIAMOS A LA COLA
            const job = await queue.add('reportes-pdf', {
                tipo: 'PRODUCTOS', // El worker ya tiene la lógica para PRODUCTOS
                socketId: socketId,
            });

            // Respondemos de inmediato
            res.status(202).json({
                message: 'Generando reporte de productos en segundo plano...',
                jobId: job.id,
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const producto = await models.Producto.findByPk(id, {
                include: [{ model: models.CategoriaProducto, as: 'categoria' }],
            });
            if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });
            res.json(producto);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = productoSchema.parse(req.body);

            const categoria = await models.CategoriaProducto.findByPk(data.categoria_id);
            if (!categoria) {
                return res.status(400).json({ message: 'Categoría no encontrada' });
            }
            if (await models.Producto.findOne({ where: { codigo: data.codigo } })) {
                return res.status(400).json({ message: 'El código ya existe' });
            }

            const producto = await models.Producto.create(data);
            res.status(201).json({ producto });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const producto = await models.Producto.findByPk(id);
            if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

            const data = productoSchema.parse(req.body);

            const categoria = await models.CategoriaProducto.findByPk(data.categoria_id);
            if (!categoria) {
                return res.status(400).json({ message: 'Categoría no encontrada' });
            }

            await producto.update(data);
            res.json({ producto });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const producto = await models.Producto.findByPk(id);
            if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

            await producto.destroy();
            res.json({ message: 'Producto eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default ProductoController;
