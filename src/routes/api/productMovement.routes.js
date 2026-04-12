import { Router } from 'express';
import MovimientoProductoController from '../../controllers/productMovement.controller.js';

const router = Router();

router.get('/', MovimientoProductoController.getAll);
router.get('/:id', MovimientoProductoController.getById);
router.post('/', MovimientoProductoController.create);
router.delete('/:id', MovimientoProductoController.delete);

export default router;
