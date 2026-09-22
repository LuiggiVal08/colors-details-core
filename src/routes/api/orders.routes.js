import { Router } from 'express';
import PedidoController from '../../controllers/orders.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';
import { uploadPedidoDetalle } from '../../config/multer.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', PedidoController.getAll);
router.get('/:id', PedidoController.getById);
router.post('/', uploadPedidoDetalle.any(), PedidoController.create);
router.put('/:id', PedidoController.updateEstado);
router.delete('/:id', PedidoController.delete);

export default router;
