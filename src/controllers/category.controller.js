import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const categoriaSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
});

class CategoriaController {
    static async getAll(req, res) {
        try {
            const categorias = await models.CategoriaProducto.findAll({
                include: [{ model: models.Producto, as: 'productos' }],
            });
            res.json(categorias);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const categoria = await models.CategoriaProducto.findByPk(id);
            if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });
            res.json(categoria);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = categoriaSchema.parse(req.body);

            const existe = await models.CategoriaProducto.findOne({
                where: { nombre: data.nombre },
            });

            if (existe) {
                return res.status(400).json({ message: 'Ya existe una categoría con ese nombre' });
            }

            const categoria = await models.CategoriaProducto.create(data);
            res.status(201).json({ categoria });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const categoria = await models.CategoriaProducto.findByPk(id);
            if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });

            const data = categoriaSchema.parse(req.body);

            await categoria.update(data);
            res.json({ categoria });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const categoria = await models.CategoriaProducto.findByPk(id);
            if (!categoria) return res.status(404).json({ message: 'Categoría no encontrada' });

            await categoria.destroy();
            res.json({ message: 'Categoría eliminada' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default CategoriaController;
