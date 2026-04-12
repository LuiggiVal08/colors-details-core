import { models } from '../models/index.js';
import bcrypt from 'bcryptjs';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';

const questionsSchema = z.object({
    pregunta: z.string().min(1, 'La pregunta es obligatoria'),
});
const schemaUserPass = z.object({
    password: z.string().min(1, 'La contraseña es obligatoria'),
});
class QuestionsController {
    static async getAll(req, res) {
        try {
            const tipos = await models.PreguntaSeguridad.findAll();
            res.json(tipos);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async byValidUser(req, res) {
        try {
            const { userId } = req.params;
            const data = schemaUserPass.parse(req.body);
            const { password } = data;
            const user = await models.Usuario.findByPk(userId);
            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
            if (user.password !== password) return res.status(401).json({ message: 'Contraseña incorrecta' });

            const questionsUser = await models.PreguntaSeguridadUsuario.findAll({
                where: { usuario_id: userId },
            });

            res.json({ questionsUser });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    // En tu controlador de usuarios o preguntas
    static async validQuestions(req, res) {
        const t = await models.sequelize.transaction(); // Iniciamos transacción
        try {
            const { id_usuario } = req.params; // O sacarlo del token/sesión
            const { preguntas } = req.body; // Array que viene del form
            console.log('Datos recibidos:', req.body);

            if (!preguntas || !Array.isArray(preguntas)) {
                return res.status(400).json({ message: 'Datos de preguntas no válidos' });
            }

            // 1. Eliminar preguntas anteriores del usuario
            await models.PreguntaSeguridadUsuario.destroy({
                where: { usuario_id: id_usuario },
                transaction: t,
            });

            // 2. Preparar los nuevos datos con Hash
            // Dentro de tu controlador valid-questions
            const preguntasParaGuardar = await Promise.all(
                preguntas.map(async (p) => {
                    const salt = await bcrypt.genSalt(10);
                    const respuestaHasheada = await bcrypt.hash(p.respuesta.trim().toLowerCase(), salt);

                    return {
                        usuario_id: id_usuario, // <--- Asegúrate que se llame usuario_id como en tu init
                        pregunta_id: parseInt(p.pregunta_id), // <--- Asegúrate que se llame pregunta_id como en tu init
                        respuesta: respuestaHasheada,
                    };
                }),
            );

            // Ejecutamos el bulkCreate
            await models.PreguntaSeguridadUsuario.bulkCreate(preguntasParaGuardar, { transaction: t });

            await t.commit();
            res.json({ message: 'Preguntas de seguridad actualizadas con éxito' });
        } catch (error) {
            console.log(error);

            await t.rollback();
            handleErrorsController(error, res, req);
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const tipo = await models.PreguntaSeguridad.findByPk(id);
            if (!tipo) return res.status(404).json({ message: 'Pregunta no encontrada' });
            res.json(tipo);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async create(req, res) {
        try {
            const data = questionsSchema.parse(req.body);
            const { pregunta } = data;
            const existe = await models.PreguntaSeguridad.findOne({ where: { pregunta } });
            if (existe) {
                return res.status(400).json({ message: 'Ya existe esta pregunta' });
            }

            const tipo = await models.PreguntaSeguridad.create(data);
            res.status(201).json({ tipo });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }

    static async update(req, res) {
        try {
            const { id } = req.params;
            const tipo = await models.PreguntaSeguridad.findByPk(id);
            if (!tipo) return res.status(404).json({ message: 'Pregunta no encontrada' });

            const data = questionsSchema.parse(req.body);

            if (data.nombre !== tipo.nombre) {
                const yaExiste = await models.PreguntaSeguridad.findOne({ where: { nombre: data.nombre } });
                if (yaExiste) {
                    return res.status(400).json({ message: 'Ya existe otra Pregunta con ese nombre' });
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
            const tipo = await models.PreguntaSeguridad.findByPk(id);
            if (!tipo) return res.status(404).json({ message: 'Pregunta no encontrada' });

            await tipo.destroy();
            res.json({ message: 'Pregunta eliminada' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default QuestionsController;
