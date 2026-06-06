import { Op } from 'sequelize';
import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { nominaQueue } from '../config/nominaQueue.js';

const generateSchema = z.object({
    periodo_inicio: z.string().min(1, 'Fecha inicio requerida'),
    periodo_fin: z.string().min(1, 'Fecha fin requerida'),
});

class NominaController {
    static async getAll(req, res) {
        try {
            const nominas = await models.Nomina.findAll({
                include: [
                    { model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] },
                    { model: models.TasaDolar, as: 'tasa', attributes: ['id', 'tasa'] },
                ],
                order: [['creado_en', 'DESC']],
            });
            res.json(nominas);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const nomina = await models.Nomina.findByPk(req.params.id, {
                include: [
                    { model: models.Usuario, as: 'usuario', attributes: ['id', 'username'] },
                    { model: models.TasaDolar, as: 'tasa', attributes: ['id', 'tasa'] },
                    {
                        model: models.NominaDetalle,
                        as: 'detalles',
                        include: [{ model: models.Empleado, as: 'empleado' }],
                    },
                ],
            });
            if (!nomina) return res.status(404).json({ message: 'Nómina no encontrada' });
            res.json(nomina);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async generate(req, res) {
        try {
            const data = generateSchema.parse(req.body);
            const empresa = await models.Empresa.findOne();
            if (!empresa) return res.status(400).json({ message: 'No hay empresa registrada' });

            const existente = await models.Nomina.findOne({
                where: {
                    periodo_inicio: data.periodo_inicio,
                    periodo_fin: data.periodo_fin,
                    empresa_id: empresa.id,
                    estado: { [Op.ne]: 'failed' },
                },
            });
            if (existente) {
                return res.status(409).json({
                    message: 'Ya existe una nómina para este período',
                    nomina: existente,
                });
            }

            const job = await nominaQueue.add('generar', {
                periodoInicio: data.periodo_inicio,
                periodoFin: data.periodo_fin,
                empresaId: empresa.id,
                usuarioId: req.user.id,
            });

            res.json({ message: 'Nómina en proceso', jobId: job.id });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default NominaController;
