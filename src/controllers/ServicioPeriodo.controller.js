import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const schemaPeriodo = z.object({
    servicio_id: z.number(),
    fecha_corte: z.string().refine((v) => !isNaN(Date.parse(v)), {
        message: 'Fecha de corte inválida',
    }),
    descripcion: z.string().optional(),
});

class ServicioPeriodoController {
    static async getByServicio(req, res) {
        try {
            const { id } = req.params;
            const periodos = await models.ServicioPeriodo.findAll({
                where: { servicio_id: id },
                order: [['fecha_corte', 'ASC']],
            });
            return res.status(200).json({ error: false, data: periodos });
        } catch (error) {
            return handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        const t = await models.sequelize.transaction();

        try {
            const normalized = {
                ...req.body,
                servicio_id: Number(req.body.servicio_id ?? req.body.service_id),
            };
            const data = schemaPeriodo.parse(normalized);

            const servicio = await models.ServicioEmpresa.findByPk(data.servicio_id, { transaction: t });
            if (!servicio) {
                await t.rollback();
                return res.status(404).json({ error: true, message: 'Servicio no encontrado' });
            }

            const precioNum = Number(servicio.precio);
            if (!precioNum || precioNum <= 0) {
                await t.rollback();
                return res.status(400).json({ error: true, message: 'El servicio no tiene un precio definido' });
            }

            const fechaCorte = new Date(data.fecha_corte);
            if (isNaN(fechaCorte.getTime())) {
                await t.rollback();
                return res.status(400).json({ error: true, message: 'La fecha de corte es inválida' });
            }

            const usuario_id = res.locals?.user?.id ?? null;
            const fechaGenerada = req.body.fecha_generada ? new Date(req.body.fecha_generada) : new Date();
            const mes = fechaCorte.getMonth() + 1;
            const anualidad = fechaCorte.getFullYear();

            const periodo = await models.ServicioPeriodo.create(
                {
                    servicio_id: data.servicio_id,
                    usuario_id,
                    mes,
                    anualidad,
                    fecha_generada: fechaGenerada,
                    fecha_corte: fechaCorte,
                    amount_due: precioNum,
                    amount_balance: precioNum,
                    estado: 'pending',
                    tiene_pagos: false,
                    pago_tardio: false,
                    descripcion: data.descripcion ?? 'Periodo agregado manualmente',
                },
                { transaction: t },
            );

            await t.commit();

            return res.status(201).json({ error: false, data: periodo });
        } catch (error) {
            await t.rollback();
            return handleErrorsController(error, res, req);
        }
    }
}

export default ServicioPeriodoController;
