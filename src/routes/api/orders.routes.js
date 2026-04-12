import { Router } from 'express';
import PedidoController from '../../controllers/orders.controller.js';

const router = Router();

router.get('/', PedidoController.getAll);
router.get('/:id', PedidoController.getById);
router.post('/', PedidoController.create);
router.put('/:id', PedidoController.updateEstado);
router.delete('/:id', PedidoController.delete);

export default router;
