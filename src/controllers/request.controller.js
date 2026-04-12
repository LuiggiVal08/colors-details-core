import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { NotFoundError } from '../errors/NotFoundError.js';

const usernameSchema = z.object({
    username: z.string().min(1, 'El nombre de usuario es obligatorio'),
});
const securityQuestionsSchema = z.object({
    answers: z
        .array(
            z.object({
                question_id: z.number().positive(), // O z.string() si el ID viene como texto
                answer: z.string().min(1, 'La respuesta es obligatoria'),
            }),
        )
        .min(2, 'Debe ingresar al menos 2 respuestas'),
});
const schemaUserPass = z.object({
    password: z.string().min(1, 'La contraseña es obligatoria'),
    password_confirmation: z.string().min(1, 'La confirmación de contraseña es obligatoria'),
});
class RequestController {
    static async queryUsername(req, res) {
        try {
            const data = usernameSchema.parse(req.body);
            const { username } = data;
            const usuario = await models.Usuario.findOne({
                where: { username },
                include: [
                    {
                        model: models.PreguntaSeguridadUsuario,
                        as: 'preguntas_seguridad',
                        include: [{ model: models.PreguntaSeguridad, as: 'pregunta' }],
                    },
                ],
            });

            if (!usuario) throw new NotFoundError('Usuario no encontrado');
            // se envia las preguntas sin la respuesta
            res.json({
                user_id: usuario.id,
                preguntas_seguridad: usuario.preguntas_seguridad.map((pregunta) => pregunta.pregunta),
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async queryQuestions(req, res) {
        try {
            const data = securityQuestionsSchema.parse(req.body);
            const idUser = req.params.id;
            const { answers } = data; // Las 2 respuestas enviadas por el usuario

            // 1. Buscamos todas las preguntas que el usuario tiene registradas
            const questionsUser = await models.PreguntaSeguridadUsuario.findAll({
                where: { usuario_id: idUser },
            });

            if (questionsUser.length === 0) {
                return res.status(404).json({ message: 'El usuario no tiene preguntas configuradas.' });
            }

            // 2. Validamos cada respuesta enviada contra los registros de la DB
            // Usamos for...of para poder manejar el await de bcrypt adecuadamente
            for (const sentAnswer of answers) {
                // Buscamos en la DB el registro que coincida con el question_id enviado
                const dbQuestion = questionsUser.find((q) => q.pregunta_id === sentAnswer.question_id);

                // Si el usuario envía un ID de pregunta que no tiene registrada
                if (!dbQuestion) {
                    return res.status(400).json({
                        message: `La pregunta con ID ${sentAnswer.question_id} no pertenece al usuario.`,
                    });
                }

                // Comparamos el texto plano (sentAnswer.answer) con el hash (dbQuestion.respuesta)
                const isMatch = await bcrypt.compare(sentAnswer.answer.toLowerCase().trim(), dbQuestion.respuesta);

                if (!isMatch) {
                    return res.status(401).json({
                        message: 'Una o más respuestas de seguridad son incorrectas.',
                    });
                }
            }

            // 3. Si el bucle termina sin retornar error, las respuestas enviadas son válidas
            res.json({
                success: true,
                message: 'Validación exitosa. Puedes proceder a cambiar tu contraseña.',
            });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async changePassword(req, res) {
        try {
            const { id } = req.params;
            const data = schemaUserPass.parse(req.body);
            const { password, password_confirmation } = data;
            if (password !== password_confirmation) {
                return res.status(400).json({ message: 'Las contraseñas no coinciden' });
            }
            const usuario = await models.Usuario.findByPk(id);
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            const salt = await bcrypt.genSalt(10);
            const newPassword = await bcrypt.hash(password, salt);

            await usuario.update({ password: newPassword });
            res.json({ message: 'Contraseña actualizada con éxito' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default RequestController;
