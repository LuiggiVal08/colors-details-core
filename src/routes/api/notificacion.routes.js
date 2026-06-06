import { Router } from 'express';
import NotificacionController from '../../controllers/notificacion.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();

router.get('/', isAuthenticated, NotificacionController.getUnread);
router.patch('/:id/read', isAuthenticated, NotificacionController.markAsRead);
router.patch('/read-all', isAuthenticated, NotificacionController.markAllAsRead);

export default router;
