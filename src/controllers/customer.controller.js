import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const clienteSchema = z.object({
    nombre: z.string().min(1),
    apellido: z.string().min(1),
    cedula: z.string().min(1),
    telefono: z.string().min(1),
    email: z.string().email(),
    direccion: z.string().min(1),
    fecha_registro: z.coerce.date().optional(),
    activo: z.boolean().optional(),
});

class ClienteController {
    static async getAll(req, res) {
        try {
            const clientes = await models.Cliente.findAll();
            res.json(clientes);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const cliente = await models.Cliente.findByPk(id);
            if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

            res.json(cliente);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = clienteSchema.parse(req.body);

            const clienteExistente = await models.Cliente.findOne({
                where: { cedula: data.cedula },
            });
            if (clienteExistente) {
                return res.status(400).json({ message: 'Ya existe un cliente con esa cédula' });
            }

            // Si no mandan fecha, se la agregamos con la actual
            if (!data.fecha_registro) data.fecha_registro = new Date();

            const cliente = await models.Cliente.create(data);
            res.status(201).json({ cliente });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const cliente = await models.Cliente.findByPk(id);
            if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

            const data = clienteSchema.parse(req.body);
            await cliente.update(data);
            res.json({ cliente });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const cliente = await models.Cliente.findByPk(id);
            if (!cliente) return res.status(404).json({ message: 'Cliente no encontrado' });

            await cliente.destroy();
            res.json({ message: 'Cliente eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default ClienteController;
