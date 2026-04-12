import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const metodoPagoSchema = z.object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    tipo: z.string().min(1, 'El tipo es obligatorio'),
    activo: z.boolean(),
    comision: z.string().optional(),
});

class MetodoPagoController {
    static async getAll(req, res) {
        try {
            const metodos = await models.MetodoPago.findAll();
            res.json(metodos);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const metodo = await models.MetodoPago.findByPk(id);
            if (!metodo) return res.status(404).json({ message: 'Método de pago no encontrado' });
            res.json(metodo);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = metodoPagoSchema.parse(req.body);

            const yaExiste = await models.MetodoPago.findOne({
                where: { nombre: data.nombre },
            });

            if (yaExiste) {
                return res.status(400).json({ message: 'Ya existe un método de pago con ese nombre' });
            }

            const metodo = await models.MetodoPago.create(data);
            res.status(201).json({ metodo });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const metodo = await models.MetodoPago.findByPk(id);
            if (!metodo) return res.status(404).json({ message: 'Método de pago no encontrado' });

            const data = metodoPagoSchema.parse(req.body);
            await metodo.update(data);
            res.json({ metodo });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const metodo = await models.MetodoPago.findByPk(id);
            if (!metodo) return res.status(404).json({ message: 'Método de pago no encontrado' });

            await metodo.destroy();
            res.json({ message: 'Método de pago eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default MetodoPagoController;
