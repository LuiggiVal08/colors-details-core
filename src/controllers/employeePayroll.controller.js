import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { formatearPrecio } from '../helpers/format.js';

export const nominaEmpleadoSchema = z.object({
    empleado_id: z.string(),
    tasa_id: z.number().int().optional(),
    fecha_inicio: z.string().min(1),
    fecha_fin: z.string().min(1),
    monto: z.string(),
    bono: z.string().optional().default('0'),
    deduccion: z.string().optional().default('0'),
    monto_usd: z.string().optional(),
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
                order: [['fecha', 'DESC'], ['id', 'DESC']],
            }) || await models.TasaDolar.findOne({ order: [['fecha', 'DESC'], ['id', 'DESC']] });
            if (!exchangeRate) {
                return res.status(400).json({ message: 'Registra una tasa de cambio antes de crear la nómina' });
            }

            const parsed = nominaEmpleadoSchema.parse({ ...req.body, tasa_id: exchangeRate.id });

            const parseNum = (v) => formatearPrecio(String(v ?? '0'));
            const montoNum = parseNum(parsed.monto);
            const bonoNum = parseNum(parsed.bono);
            const deduccionNum = parseNum(parsed.deduccion);
            const montoTotal = montoNum + bonoNum - deduccionNum;
            const tasaNum = parseNum(exchangeRate.tasa);
            if (tasaNum <= 0) {
                return res.status(400).json({ message: 'La tasa de cambio debe ser mayor que cero' });
            }
            const montoUsd = parsed.monto_usd
                ? parseNum(parsed.monto_usd)
                : Math.round((montoTotal / tasaNum) * 100) / 100;

            const data = {
                ...parsed,
                monto: String(montoTotal),
                bono: String(bonoNum),
                deduccion: String(deduccionNum),
                monto_usd: String(montoUsd),
            };

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

            const parseNum = (v) => formatearPrecio(String(v ?? '0'));
            const exchangeRate =
                (await models.TasaDolar.findOne({
                    where: { activa: true },
                    order: [['fecha', 'DESC'], ['id', 'DESC']],
                })) ||
                (await models.TasaDolar.findByPk(nomina.tasa_id)) ||
                (await models.TasaDolar.findOne({ order: [['fecha', 'DESC'], ['id', 'DESC']] }));
            const tasaNum = exchangeRate ? parseNum(exchangeRate.tasa) : 0;

            const montoNum = parseNum(data.monto);
            const bonoNum = parseNum(data.bono);
            const deduccionNum = parseNum(data.deduccion);
            const montoTotal = montoNum + bonoNum - deduccionNum;

            data.monto = String(montoTotal);
            data.bono = String(bonoNum);
            data.deduccion = String(deduccionNum);
            if (data.monto_usd !== undefined && data.monto_usd !== '') {
                data.monto_usd = String(parseNum(data.monto_usd));
            } else if (tasaNum > 0) {
                data.monto_usd = String(Math.round((montoTotal / tasaNum) * 100) / 100);
            }

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
