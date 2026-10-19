import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import { Op, fn, col, where } from 'sequelize';

// "juan carlos" → "Juan Carlos"; "o'brien" → "O'Brien"; "maría-josé" → "María-José"
const capitalizarNombre = (valor) => {
    const limpio = valor.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-VE');
    return limpio.replace(/(^|[\s'-])(\p{L})/gu, (_, separador, letra) => separador + letra.toLocaleUpperCase('es-VE'));
};

const clienteSchema = z.object({
    nombre: z.string().trim().min(1).transform(capitalizarNombre),
    apellido: z.string().trim().min(1).transform(capitalizarNombre),
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
            const { search, page, limit } = req.query;
            let queryOptions = { where: {} };

            if (search) {
                queryOptions.where = {
                    [Op.or]: [
                        { nombre: { [Op.like]: `%${search}%` } },
                        { apellido: { [Op.like]: `%${search}%` } },
                        { cedula: { [Op.like]: `%${search}%` } },
                        where(fn('concat', col('nombre'), ' ', col('apellido')), { [Op.like]: `%${search}%` }),
                    ],
                };
            }

            // Paginación (opcional para el móvil)
            if (page && limit) {
                queryOptions.limit = parseInt(limit);
                queryOptions.offset = (parseInt(page) - 1) * parseInt(limit);
            }

            const clientes = await models.Cliente.findAll(queryOptions);
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
            res.status(201).json(cliente);
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
