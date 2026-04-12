import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const cajaSchema = z.object({
    empresa_id: z.string(),
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    ubicacion: z.string(),
    activo: z.boolean(),
});

class CajaRegistradoraController {
    static async getAll(req, res) {
        try {
            const cajas = await models.Caja.findAll();

            const results = await Promise.all(
                cajas.map(async (caja) => {
                    const ultimoControl = await models.ControlCaja.findOne({
                        where: { caja_id: caja.id },
                        order: [['id', 'DESC']],
                    });
                    return { ...caja.toJSON(), controlActual: ultimoControl };
                }),
            );

            res.json(results);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;

            const caja = await models.Caja.findByPk(id);
            if (!caja) return res.status(404).json({ message: 'Caja Registradora no encontrada' });

            const ultimoControl = await models.ControlCaja.findOne({
                where: { caja_id: id },
                order: [['id', 'DESC']],
            });

            res.json({ ...caja.toJSON(), controlActual: ultimoControl });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = cajaSchema.parse(req.body);

            const yaExiste = await models.Caja.findOne({
                where: { nombre: data.nombre },
            });

            if (yaExiste) {
                return res.status(400).json({ message: 'Ya existe una Caja Registradora con ese nombre' });
            }

            const caja = await models.Caja.create(data);
            res.status(201).json({ caja });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const caja = await models.Caja.findByPk(id);
            if (!caja) return res.status(404).json({ message: 'Caja Registradora no encontrada' });

            const data = cajaSchema.parse(req.body);
            await caja.update(data);
            res.json({ caja });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const caja = await models.Caja.findByPk(id);
            if (!caja) return res.status(404).json({ message: 'Caja Registradora no encontrada' });

            await caja.destroy();
            res.json({ message: 'Caja Registradora eliminada' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default CajaRegistradoraController;
