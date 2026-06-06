import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const servicioSchema = z.object({
    empresa_id: z.string(),
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    descripcion: z.string().optional(),
    proveedor: z.string().optional(),
    precio: z.string().min(1, 'El precio es obligatorio'),
    dia_corte: z.string().min(1, 'El día de corte es obligatorio'),
    usuario_id: z.string(),
});

const servicioSchemaEdit = servicioSchema.omit({ usuario_id: true });

class ServicioController {
    static async getAll(req, res) {
        try {
            const servicios = await models.ServicioEmpresa.findAll();
            res.json(servicios);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const servicio = await models.ServicioEmpresa.findByPk(req.params.id);
            if (!servicio) return res.status(404).json({ message: 'Servicio no encontrado' });
            res.json(servicio);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

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

            const servicio = await models.ServicioEmpresa.create(
                {
                    empresa_id: data.empresa_id,
                    nombre: data.nombre,
                    descripcion: data.descripcion,
                    proveedor: data.proveedor,
                    dia_corte: data.dia_corte,
                    precio: data.precio,
                },
                { transaction: t },
            );

            const hoy = new Date();
            const mes = hoy.getMonth() + 1;
            const anio = hoy.getFullYear();
            const precioNum = Number(String(data.precio).replace(',', '.'));

            let fechaCorte = new Date(anio, mes - 1, data.dia_corte);
            if (fechaCorte.getMonth() !== mes - 1) {
                fechaCorte = new Date(anio, mes, 0);
            }

            await models.ServicioPeriodo.create(
                {
                    servicio_id: servicio.id,
                    usuario_id,
                    mes,
                    anualidad: anio,
                    fecha_corte: fechaCorte,
                    amount_due: precioNum,
                    amount_balance: precioNum,
                    estado: 'pending',
                    pago_tardio: false,
                    tiene_pagos: false,
                    descripcion: 'Primer periodo autogenerado',
                },
                { transaction: t },
            );

            await t.commit();
            return res.status(201).json({ message: 'Servicio creado', servicio });
        } catch (error) {
            if (!t.finished) await t.rollback();
            console.log(error);
            return handleErrorsController(error, res, req);
        }
    }

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
