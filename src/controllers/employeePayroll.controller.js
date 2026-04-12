import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

export const nominaEmpleadoSchema = z.object({
    empleado_id: z.string(),
    tasa_id: z.number().int().optional(),
    fecha_inicio: z.string().min(1),
    fecha_fin: z.string().min(1),
    monto: z.string(),
    descripcion: z.string().optional(),
});

class NominaEmpleadoController {
    static async getAll(req, res) {
        try {
            const data = await models.NominaEmpleado.findAll({
                include: [
                    { model: models.Empleado, as: 'empleado' },
                    { model: models.TasaDolar, as: 'tasa' },
                ],
                order: [['fecha_inicio', 'DESC']],
            });
            res.json(data);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const data = await models.NominaEmpleado.findByPk(id, {
                include: [
                    { model: models.Empleado, as: 'empleado' },
                    { model: models.TasaDolar, as: 'tasa' },
                ],
            });

            if (!data) return res.status(404).json({ message: 'Nómina no encontrada' });

            res.json(data);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const exchangeRate = await models.TasaDolar.findOne({
                where: { activa: true },
            });
            if (!exchangeRate) return res.status(404).json({ message: 'No se encontró la tasa actual del dólar' });

            const data = nominaEmpleadoSchema.parse({ ...req.body, tasa_id: exchangeRate.id });

            const nominaExistente = await models.NominaEmpleado.findOne({
                where: {
                    empleado_id: data.empleado_id,
                    fecha_inicio: data.fecha_inicio,
                    fecha_fin: data.fecha_fin,
                },
            });

            if (nominaExistente)
                return res
                    .status(400)
                    .json({ message: 'Ya existe una nómina registrada para ese empleado en ese periodo' });

            const nomina = await models.NominaEmpleado.create(data);
            res.status(201).json({ nomina });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const nomina = await models.NominaEmpleado.findByPk(id);

            if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });

            const data = nominaEmpleadoSchema.parse(req.body);

            await nomina.update(data);
            res.json({ nomina });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const nomina = await models.NominaEmpleado.findByPk(id);

            if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });

            await nomina.destroy();
            res.json({ message: 'Nómina eliminada' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default NominaEmpleadoController;
