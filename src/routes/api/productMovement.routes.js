import { Router } from 'express';
import MovimientoProductoController from '../../controllers/productMovement.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', MovimientoProductoController.getAll);
router.get('/:id', MovimientoProductoController.getById);
router.post('/', MovimientoProductoController.create);
router.delete('/:id', MovimientoProductoController.delete);

export default router;
