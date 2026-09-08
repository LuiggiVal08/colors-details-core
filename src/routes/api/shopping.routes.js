import { Router } from 'express';
import VentaController from '../../controllers/shopping.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', VentaController.getAll);
router.post('/report', VentaController.getSalesReportPDF);
router.get('/:id', VentaController.getById);
router.post('/', VentaController.create);
// router.put('/:id', VentaController.update);
router.delete('/:id', VentaController.delete);

export default router;
