import { Router } from 'express';
import ProductoController from '../../controllers/product.controller.js';

const router = Router();
// Importing the ProductoController to handle product-related requests
router.get('/', ProductoController.getAll);
router.post('/report/get-all', ProductoController.getAllReportPDF);
router.get('/:id', ProductoController.getById);
router.post('/', ProductoController.create);
router.put('/:id', ProductoController.update);
router.delete('/:id', ProductoController.delete);

export default router;
