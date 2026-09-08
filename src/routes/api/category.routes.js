import { Router } from 'express';
import MetodoPagoController from '../../controllers/category.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', MetodoPagoController.getAll);
router.get('/:id', MetodoPagoController.getById);
router.post('/', MetodoPagoController.create);
router.put('/:id', MetodoPagoController.update);
router.delete('/:id', MetodoPagoController.delete);

export default router;
