import { Op } from 'sequelize';
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { queue } from '../config/queueConfig.js';
import fs from 'fs';
import path from 'path';
import { cwd } from 'process';

const productoSchema = z.object({
    categoria_id: z.string(),
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    precio: z.string().min(1, 'El precio es obligatorio'),
    stock: z.string().optional(),
    codigo: z.string().min(1, 'El codigo es obligatorio'),
    imagen: z.string().optional(),
});

class ProductoController {
    static async getAll(req, res) {
        try {
            const { search, page, limit } = req.query;
            const lowStock = req.query.lowStock === 'true';
            const categoriaId = req.query.categoria_id;

            let queryOptions = { where: {} };

            if (search) {
                queryOptions.where = {
                    [Op.or]: [
                        { codigo: { [Op.like]: `%${search}%` } },
                        { nombre: { [Op.like]: `%${search}%` } },
                        { '$categoria.nombre$': { [Op.like]: `%${search}%` } },
                    ],
                };
            }
            if (page && limit) {
                queryOptions.limit = parseInt(limit);
                queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
            }
            if (categoriaId) {
                queryOptions.where.categoria_id = categoriaId;
            }

            if (lowStock) {
                queryOptions.where.stock = { [Op.lt]: 5 };
            }

            const products = await models.Producto.findAll({
                ...queryOptions,
                include: [{ model: models.CategoriaProducto, as: 'categoria' }],
            });

            res.json(products);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    // ruta del logo: /public/img/logo.png

    static async getAllReportPDF(req, res) {
        try {
            const { socketId } = req.body; // Extraído por tu interceptor del front
            const userId = req.user?.id;

            // 🚀 ENVIAMOS A LA COLA
            const job = await queue.add('reportes-pdf', {
                tipo: 'PRODUCTOS',
                socketId: socketId,
                userId: userId,
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
            if (req.file?.filename) {
                data.imagen = `/uploads/${req.file.filename}`;
            }

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

    static deleteImagenFile(imagenPath) {
        try {
            if (!imagenPath) return;
            const filename = path.basename(imagenPath);
            fs.rmSync(path.join(cwd(), 'public', 'uploads', filename), { force: true });
        } catch {
            // Si el archivo no existe o no se puede borrar, no bloqueamos la operación.
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const producto = await models.Producto.findByPk(id);
            if (!producto) return res.status(404).json({ message: 'Producto no encontrado' });

            const data = productoSchema.parse(req.body);
            const removeImagen = req.body._removeImagen === '1' || req.body._removeImagen === 'true';

            if (removeImagen) {
                if (producto.imagen) this.deleteImagenFile(producto.imagen);
                data.imagen = null;
            } else if (req.file?.filename) {
                if (producto.imagen) this.deleteImagenFile(producto.imagen);
                data.imagen = `/uploads/${req.file.filename}`;
            }

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

            if (producto.imagen) this.deleteImagenFile(producto.imagen);
            await producto.destroy();
            res.json({ message: 'Producto eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default ProductoController;
