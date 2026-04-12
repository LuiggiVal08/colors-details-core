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
    // =====================================================================
    // 1) Obtener periodos por servicio
    // =====================================================================
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

    // =====================================================================
    // 2) Crear un periodo manualmente
    // =====================================================================
    static async create(req, res) {
        const t = await models.sequelize.transaction();

        try {
            // Normalizar entrada: asegurarse que servicio_id sea number
            const normalized = {
                ...req.body,
                servicio_id: Number(req.body.servicio_id ?? req.body.service_id),
            };
            console.log('[ServicioPeriodo] normalized body:', normalized);
            const data = schemaPeriodo.parse(normalized);
            console.log('[ServicioPeriodo] data validated:', data);

            // ---------------------------------------------------------------
            // Buscar el precio vigente del servicio
            // ---------------------------------------------------------------
            const precio = await models.ServicioPrecio.findOne({
                where: {
                    servicio_id: data.servicio_id,
                    fecha_fin: null,
                },
                transaction: t,
            });

            if (!precio) {
                console.log('[ServicioPeriodo] precio vigente no encontrado para servicio:', data.servicio_id);
                await t.rollback();
                return res.status(404).json({
                    error: true,
                    message: 'Este servicio no tiene un precio vigente',
                });
            }
            console.log('[ServicioPeriodo] precio vigente encontrado:', precio.precio);

            // ---------------------------------------------------------------
            // Formato consistente con los periodos autogenerados (string "12,50")
            // ---------------------------------------------------------------
            const amount_due = precio.precio.toString().replace('.', ',');

            // ---------------------------------------------------------------
            // Validación estricta de fecha_corte
            // ---------------------------------------------------------------
            const fechaCorte = new Date(data.fecha_corte);
            if (isNaN(fechaCorte.getTime())) {
                await t.rollback();
                return res.status(400).json({
                    error: true,
                    message: 'La fecha de corte es inválida',
                });
            }

            // ---------------------------------------------------------------
            // Crear periodo consistente (llenar campos obligatorios mes/anualidad/usuario)
            // ---------------------------------------------------------------
            const usuario_id = res.locals?.user?.id ?? null;
            const fechaGenerada = req.body.fecha_generada ? new Date(req.body.fecha_generada) : new Date();
            const mes = fechaCorte.getMonth() + 1;
            const anualidad = fechaCorte.getFullYear();
            console.log(
                '[ServicioPeriodo] usuario_id:',
                usuario_id,
                'mes:',
                mes,
                'anualidad:',
                anualidad,
                'fecha_generada:',
                fechaGenerada,
            );

            const periodo = await models.ServicioPeriodo.create(
                {
                    servicio_id: data.servicio_id,
                    usuario_id,
                    mes,
                    anualidad,
                    fecha_generada: fechaGenerada,
                    fecha_corte: fechaCorte,
                    amount_due,
                    amount_balance: amount_due, // saldo pendiente igual al monto total
                    estado: 'pending',
                    tiene_pagos: false,
                    pago_tardio: false,
                    descripcion: data.descripcion ?? 'Periodo agregado manualmente',
                },
                { transaction: t },
            );

            await t.commit();

            return res.status(201).json({
                error: false,
                data: periodo,
            });
        } catch (error) {
            await t.rollback();
            return handleErrorsController(error, res, req);
        }
    }
}

export default ServicioPeriodoController;
