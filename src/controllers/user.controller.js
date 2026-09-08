import { z } from 'zod';
import { models } from '../models/index.js';
import jwt from '../helpers/jwt.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';
import bcrypt from 'bcryptjs';
import { timeExpiresToken } from '../constants.js';
import logger from '../config/logger.js';
import { hashPassword, rehashIfPlain, verificarPassword } from '../helpers/password.js';

const schemaUserSingIn = z.object({
    username: z.string().min(1, 'El nombre de usuario es obligatorio'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

const schemaUserData = z.object({
    tipo_usuario_id: z.string(),
    activo: z.boolean(),
});

const schemaUser = schemaUserData.merge(schemaUserSingIn).extend({
    empleado_id: z.string(),
});

class UserController {
    static async singIn(req, res) {
        try {
            const data = schemaUserSingIn.parse(req.body);
            const { username, password } = data;
            const user = await models.Usuario.findOne({
                where: { username },
                include: [
                    { model: models.TipoUsuario, as: 'tipo' },
                    { model: models.Empleado, as: 'empleado' },
                ],
            });

            if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

            if (!(await verificarPassword(password, user)))
                return res.status(401).json({ message: 'Contraseña incorrecta' });

            await rehashIfPlain(password, user);

            const payload = {
                id: user.id,
                username: user.username,
                empleado_id: user.empleado_id,
                tipo_usuario_id: user.tipo_usuario_id,
                tipo_usuario_name: user.tipo ? user.tipo.nombre : null,
            };

            const token = await jwt(payload, 'access');

            res.cookie('sid', token, {
                httpOnly: true,
                sameSite: 'strict',
                expires: new Date(Date.now() + timeExpiresToken),
            });
            const dataResponse = {
                id: user.id,
                username: user.username,
                fullName: user.empleado ? `${user.empleado?.nombre} ${user.empleado?.apellido}` : null,
                role: user.tipo ? user.tipo.nombre : null,
                token: token,
            };
            res.setHeader('Authorization', `Bearer ${token}`);
            res.status(200).json(dataResponse);
        } catch (error) {
            logger.error(error);
            handleErrorsController(error, res, req);
        }
    }
    static async logout(req, res) {
        try {
            res.clearCookie('sid');
            res.status(200).json({ message: 'Sesión cerrada' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async changePassword(req, res) {
        try {
            const { id } = req.params;
            const usuario = await models.Usuario.findByPk(id);
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            const { passwordActual, passwordNueva, passwordConfirmacion } = req.body;
            // la contraseña debe ser encriptada antes de compararla
            const validPasswordActual = await verificarPassword(passwordActual, usuario);
            if (!validPasswordActual) {
                return res.status(400).json({ message: 'La contraseña actual no es correcta' });
            }
            if (passwordNueva !== passwordConfirmacion)
                return res.status(400).json({ message: 'Las contraseñas no coinciden' });
            const newPassword = await hashPassword(passwordNueva);
            await usuario.update({ password: newPassword });
            res.json({ message: 'Contraseña cambiada' });
        } catch (error) {
            handleErrorsController(error, res, req);
            return;
        }
    }
    static async getAll(req, res) {
        try {
            const usuarios = await models.Usuario.findAll({
                include: [
                    { model: models.Empleado, as: 'empleado' },
                    { model: models.TipoUsuario, as: 'tipo' },
                ],
            });
            res.json(usuarios);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const usuario = await models.Usuario.findByPk(id, {
                include: [
                    { model: models.Empleado, as: 'empleado' },
                    { model: models.TipoUsuario, as: 'tipo' },
                ],
            });
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            res.json(usuario);
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async create(req, res) {
        try {
            const data = schemaUser.parse(req.body);

            const usernameExistente = await models.Usuario.findOne({
                where: { username: data.username },
            });
            if (usernameExistente) {
                return res.status(400).json({ message: 'Ya existe un usuario con ese nombre de usuario' });
            }

            const tipoExiste = await models.TipoUsuario.findByPk(data.tipo_usuario_id);
            if (!tipoExiste) {
                return res.status(400).json({ message: 'Tipo de usuario no válido' });
            }
            const salt = await bcrypt.genSalt(10);
            const password = await bcrypt.hash(data.password, salt);
            const usuario = await models.Usuario.create({ ...data, password });
            res.status(201).json({ usuario });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const usuario = await models.Usuario.findByPk(id);
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            const data = schemaUserData.parse(req.body);
            await usuario.update(data);
            res.json({ usuario });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const usuario = await models.Usuario.findByPk(id);
            if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

            await usuario.destroy();
            res.json({ message: 'Usuario eliminado' });
        } catch (error) {
            handleErrorsController(error, res, req);
        }
    }
}

export default UserController;
