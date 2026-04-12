import { ZodError } from 'zod';
import { Error } from 'sequelize';
import logger from '../config/logger.js';
import { HttpError } from '../errors/HttpError.js';

const filterAction = (method) => {
    switch (method) {
        case 'POST':
            return 'crear';
        case 'PUT':
            return 'editar';
        case 'DELETE':
            return 'eliminar';
        default:
            return 'obtener';
    }
};

/**
 * Handles errors in controllers.
 * @param error The error to be handled.
 * @param {Response} res  The response object.
 * @param  {Request} req  The request object.
 * @returns {void}
 */

const handleErrorsController = (error, res, req) => {
    const method = req.method;
    const action = filterAction(method);
    const url = req.originalUrl;

    // Extraer la parte de la URL después de "/api/"
    const path = url.split('/api/')[1];
    if (error instanceof ZodError) {
        // Loguear de forma segura (evita problemas de inspección profunda)
        logger.error({ message: 'Error al validar el modelo', errors: error.errors });
        // Si el error es de Zod, puedes acceder a sus detalles de validación
        return void res.status(400).json({
            message: `Error al ${action} ${path}`,
            error: error.errors.map((err) => ({
                path: err.path.join('.'),
                message: err.message,
            })), // Muestra las validaciones que fallaron
        });
    } else if (error instanceof HttpError) {
        // Para errores HTTP
        return void res.status(error.status).json({
            message: `Error al ${action} ${path}`,
            error: error.message,
        });
    } else if (error instanceof Error) {
        // Para errores generales
        return void res.status(500).json({
            message: `Error al ${action} ${path}`,
            error: error.message,
        });
    } else {
        logger.error(error);
        // Si es un error desconocido
        return void res.status(500).json({
            message: 'Error desconocido',
            error,
        });
    }
};

export default handleErrorsController;
