import { Router } from 'express';
import ServicioController from '../../controllers/service.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', ServicioController.getAll);
router.get('/:id', ServicioController.getById);
router.post('/', ServicioController.create);
router.put('/:id', ServicioController.update);
router.delete('/:id', ServicioController.delete);

export default router;
