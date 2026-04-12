import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const ivaSchema = z.object({
    usuario_id: z.string(),
    porcentaje: z.string(),
    observacion: z.string().optional(),
});

class IvaController {
    static async getActual(req, res) {
        try {
            const actual = await models.Iva.findOne({
                where: { activa: true },
                include: ['usuario'],
            });
            res.json(actual);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getAll(req, res) {
        try {
            const ivas = await models.Iva.findAll({
                order: [['fecha', 'DESC']],
                include: ['usuario'],
            });
            res.json(ivas);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = ivaSchema.parse(req.body);

            const anterior = await models.Iva.findOne({
                where: { activa: true },
                order: [['fecha', 'DESC']],
            });

            if (anterior) {
                await anterior.update({ activa: false });
            }

            const nuevo = await models.Iva.create({
                ...data,
                activa: true,
                fecha: new Date(),
            });

            res.status(201).json({ message: 'IVA registrado', nuevo });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default IvaController;
