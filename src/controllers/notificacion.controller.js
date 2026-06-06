import { models } from '../models/index.js';
import handleErrorsController from '../helpers/handdleErrorsController.js';

class NotificacionController {
    static async getUnread(req, res) {
        try {
            const usuario_id = res.locals.user.id;
            const notificaciones = await models.Notificacion.findAll({
                where: { usuario_id },
                order: [['creado_en', 'DESC']],
                limit: 50,
            });
            const count = notificaciones.filter(n => !n.leido).length;
            return res.json({ count, data: notificaciones });
        } catch (error) {
            return handleErrorsController(error, res, req);
        }
    }

    static async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const notif = await models.Notificacion.findByPk(id);
            if (!notif) return res.status(404).json({ error: true, message: 'Notificación no encontrada' });
            await notif.update({ leido: true });
            return res.json({ success: true });
        } catch (error) {
            return handleErrorsController(error, res, req);
        }
    }

    static async markAllAsRead(req, res) {
        try {
            const usuario_id = res.locals.user.id;
            await models.Notificacion.update(
                { leido: true },
                { where: { usuario_id, leido: false } },
            );
            return res.json({ success: true });
        } catch (error) {
            return handleErrorsController(error, res, req);
        }
    }
}

export default NotificacionController;
