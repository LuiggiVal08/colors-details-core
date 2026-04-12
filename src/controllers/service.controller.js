import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const servicioSchema = z.object({
    empresa_id: z.string(),
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    proveedor: z.string().optional(),
    coste: z.string().min(1, 'El coste es obligatorio'),
    dia_corte: z.string().min(1, 'El día de corte es obligatorio'),
    usuario_id: z.string(),
});

const servicioSchemaEdit = servicioSchema.omit({ usuario_id: true, coste: true });

class ServicioController {
    // =======================================================
    // GET all services con su precio actual y estado
    // =======================================================
    static async getAll(req, res) {
        try {
            const servicios = await models.ServicioEmpresa.findAll({
                include: [
                    {
                        model: models.ServicioPrecio,
                        as: 'precios',
                        order: [['fecha_inicio', 'DESC']],
                        limit: 1,
                    },
                ],
            });

            res.json(servicios);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =======================================================
    // GET by ID
    // =======================================================
    static async getById(req, res) {
        try {
            const servicio = await models.ServicioEmpresa.findByPk(req.params.id, {
                include: [
                    {
                        model: models.ServicioPrecio,
                        as: 'precios',
                        order: [['fecha_inicio', 'DESC']],
                        limit: 1,
                    },
                ],
            });

            if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });

            res.json(servicio);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =======================================================
    // CREATE servicio + precio inicial + período inicial
    // =======================================================
    static async create(req, res) {
        const t = await models.sequelize.transaction();
        const usuario_id = res.locals.user?.id;

        try {
            const data = servicioSchema.parse(req.body);

            const existe = await models.ServicioEmpresa.findOne({ where: { nombre: data.nombre } });

            if (existe) {
                await t.rollback();
                return res.status(400).json({ message: 'Ya existe un servicio con ese nombre' });
            }

            // 1) Crear servicio
            const servicio = await models.ServicioEmpresa.create(
                {
                    empresa_id: data.empresa_id,
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    proveedor: data.proveedor,
                    dia_corte: data.dia_corte,
                },
                { transaction: t },
            );

            // 2) Registrar precio inicial (histórico)
            const precio = await models.ServicioPrecio.create(
                { servicio_id: servicio.id, precio: data.coste, fecha_inicio: new Date() },
                { transaction: t },
            );

            // 3) Crear primer periodo
            const hoy = new Date();
            const mes = hoy.getMonth() + 1;
            const anio = hoy.getFullYear();

            let fechaCorte = new Date(anio, mes - 1, data.dia_corte);
            if (fechaCorte.getMonth() !== mes - 1) {
                // Día no existe (ej 31/02)
                fechaCorte = new Date(anio, mes, 0); // último del mes
            }
            console.log(precio.precio.toString().replace('.', ','));

            await models.ServicioPeriodo.create(
                {
                    servicio_id: servicio.id,
                    usuario_id,
                    mes,
                    anualidad: anio,
                    fecha_corte: fechaCorte,

                    amount_due: precio.precio.toString().replace('.', ','),
                    amount_balance: precio.precio.toString().replace('.', ','),

                    estado: 'pending',
                    pago_tardio: false,
                    tiene_pagos: false,
                    descripcion: 'Primer periodo autogenerado',
                },
                { transaction: t },
            );

            // 🛑 Mientras pruebas NO guardamos nada

            // await t.rollback();

            // return res.status(400).json({
            //     message: 'Rollback aplicado — Solo vista previa',
            //     servicio,
            //     precioInicial: precio,
            //     periodo_inicial_generado: true,
            // });

            // Cuando estés listo:
            await t.commit();
            return res.status(201).json({ message: 'Servicio creado', servicio });
        } catch (error) {
            if (!t.finished) await t.rollback();
            console.log(error);
            return handleErrorsController(error, res, req);
        }
    }

    // =======================================================
    // UPDATE servicio (NO toca costos)
    // =======================================================
    static async update(req, res) {
        try {
            const servicio = await models.ServicioEmpresa.findByPk(req.params.id);
            if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });

            const data = servicioSchemaEdit.parse(req.body);
            await servicio.update(data);

            return res.json({ message: 'Servicio actualizado', servicio });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    // =======================================================
    // DELETE servicio
    // =======================================================
    static async delete(req, res) {
        try {
            const servicio = await models.ServicioEmpresa.findByPk(req.params.id);
            if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });

            await servicio.destroy();
            return res.json({ message: 'Servicio eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default ServicioController;
