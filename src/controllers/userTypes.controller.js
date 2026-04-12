import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const tipoUsuarioSchema = z.object({
    nombre: z.string().min(1, 'El nombre del tipo de usuario es obligatorio'),
});

class TipoUsuarioController {
    static async getAll(req, res) {
        try {
            const tipos = await models.TipoUsuario.findAll();
            res.json(tipos);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const tipo = await models.TipoUsuario.findByPk(id);
            if (!tipo) return res.status(404).json({ message: 'Tipo de usuario no encontrado' });
            res.json(tipo);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = tipoUsuarioSchema.parse(req.body);

            const existe = await models.TipoUsuario.findOne({ where: { nombre: data.nombre } });
            if (existe) {
                return res.status(400).json({ message: 'Ya existe un tipo de usuario con ese nombre' });
            }

            const tipo = await models.TipoUsuario.create(data);
            res.status(201).json({ tipo });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const tipo = await models.TipoUsuario.findByPk(id);
            if (!tipo) return res.status(404).json({ message: 'Tipo de usuario no encontrado' });

            const data = tipoUsuarioSchema.parse(req.body);

            if (data.nombre !== tipo.nombre) {
                const yaExiste = await models.TipoUsuario.findOne({ where: { nombre: data.nombre } });
                if (yaExiste) {
                    return res.status(400).json({ message: 'Ya existe otro tipo de usuario con ese nombre' });
                }
            }

            await tipo.update(data);
            res.json({ tipo });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const tipo = await models.TipoUsuario.findByPk(id);
            if (!tipo) return res.status(404).json({ message: 'Tipo de usuario no encontrado' });

            await tipo.destroy();
            res.json({ message: 'Tipo de usuario eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default TipoUsuarioController;
