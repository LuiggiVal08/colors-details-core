import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const empleadoSchema = z.object({
    empresa_id: z.number().int(),
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    cedula: z.string().min(6),
    telefono: z.string().min(6),
    email: z.string().email(),
    direccion: z.string().min(1),
    fecha_ingreso: z.coerce.date(),
    salario_base: z.string(),
    activo: z.boolean().optional(),
});

class EmpleadoController {
    static async getAll(req, res) {
        try {
            const empleados = await models.Empleado.findAll({
                include: [
                    { model: models.Empresa, as: 'empresa' },
                    { model: models.NominaEmpleado, as: 'nominas', include: [{ model: models.TasaDolar, as: 'tasa' }] },
                ],
            });
            res.json(empleados);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const empleado = await models.Empleado.findByPk(id, {
                include: [
                    { model: models.Empresa, as: 'empresa' },
                    { model: models.NominaEmpleado, as: 'nominas', include: [{ model: models.TasaDolar, as: 'tasa' }] },
                ],
            });
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
            res.json(empleado);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async getByIdUser(req, res) {
        try {
            const { id: userId } = req.params;
            const user = await models.Usuario.findByPk(userId);
            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
            const empleado = await models.Empleado.findOne({ where: { id: user.empleado_id } });
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
            res.json(empleado);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async create(req, res) {
        try {
            const empresa = await models.Empresa.findOne();
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });
            const fecha_ingreso = new Date();
            const data = empleadoSchema.parse({ ...req.body, empresa_id: empresa.id, fecha_ingreso });

            const cedulaExistente = await models.Empleado.findOne({
                where: { cedula: data.cedula },
            });
            if (cedulaExistente) {
                return res.status(400).json({ message: 'Ya existe un empleado con esa cédula' });
            }

            const empleado = await models.Empleado.create(data);
            res.status(201).json({ empleado });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const empleado = await models.Empleado.findByPk(id);
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });
            const empresa = await models.Empresa.findOne();
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

            const data = empleadoSchema.parse({ ...req.body, empresa_id: empresa.id });
            await empleado.update(data);
            res.json({ empleado });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const empleado = await models.Empleado.findByPk(id);
            if (!empleado) return res.status(404).json({ message: 'Empleado no encontrado' });

            await empleado.destroy();
            res.json({ message: 'Empleado eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default EmpleadoController;
