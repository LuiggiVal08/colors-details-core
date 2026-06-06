import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const tasaSchema = z.object({
    usuario_id: z.string(),
    tasa: z.string(),
});

class TasaDolarController {
    static async getActual(req, res) {
        try {
            const actual = await models.TasaDolar.findOne({
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
            const tasas = await models.TasaDolar.findAll({
                order: [['fecha', 'DESC']],
                include: ['usuario'],
            });
            res.json(tasas);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = tasaSchema.parse(req.body);

            const anterior = await models.TasaDolar.findOne({
                where: { activa: true },
                order: [['fecha', 'DESC']],
            });

            if (anterior) {
                await anterior.update({ activa: false });
            }

            const nueva = await models.TasaDolar.create({
                ...data,
                cambio: anterior?.tasa || null,
                activa: true,
                fecha: new Date(),
            });

            const io = req.app.get('io');
            if (io) io.emit('tasa-dolar:updated', { tasa: nueva.tasa, cambio: nueva.cambio });

            res.status(201).json({ message: 'Tasa registrada', nueva });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default TasaDolarController;
