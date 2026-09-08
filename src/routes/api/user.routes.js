import { Router } from 'express';
import UserController from '../../controllers/user.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';
import requireRole from '../../middlewares/requireRole.js';

const router = Router();

router.post('/signin', UserController.singIn);
router.delete('/logout', UserController.logout);

router.post('/change-password/:id', isAuthenticated, UserController.changePassword);
router.get('/', isAuthenticated, UserController.getAll);
router.get('/:id', isAuthenticated, UserController.getById);
router.post('/', isAuthenticated, requireRole(['admin', 'superadmin']), UserController.create);
router.put('/:id', isAuthenticated, UserController.update);
router.delete('/:id', isAuthenticated, requireRole(['admin', 'superadmin']), UserController.delete);

export default router;
