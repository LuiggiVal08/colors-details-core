import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const companySchema = z.object({
    nombre: z.string().min(1),
    rif: z.string().min(1),
    direccion: z.string().min(1),
    telefono: z.string().min(1),
    email: z.string().email(),
    logo: z.string().optional(), // opcional si no lo mandan al crear
});

class CompanyController {
    static async getAll(req, res) {
        try {
            const empresas = await models.Empresa.findAll();
            res.json(empresas);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async getById(req, res) {
        try {
            const { id } = req.params;
            const empresa = await models.Empresa.findByPk(id);
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

            res.json(empresa);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = companySchema.parse(req.body);

            const empresaExistente = await models.Empresa.findOne({ where: { rif: data.rif } });
            if (empresaExistente) {
                return res.status(400).json({ message: 'Ya existe una empresa con ese RIF' });
            }

            const empresa = await models.Empresa.create(data);
            res.status(201).json({ empresa });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const empresa = await models.Empresa.findByPk(id);
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

            const data = companySchema.parse(req.body);
            if (req.file?.filename) {
                data.logo = `/uploads/${req.file.filename}`;
            }

            await empresa.update(data);
            res.json({ empresa, message: 'Empresa actualizada con éxito' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async delete(req, res) {
        try {
            const { id } = req.params;
            const empresa = await models.Empresa.findByPk(id);
            if (!empresa) return res.status(404).json({ message: 'Empresa no encontrada' });

            await empresa.destroy();
            res.json({ message: 'Empresa eliminada' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default CompanyController;
