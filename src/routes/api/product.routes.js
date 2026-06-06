import { Router } from 'express';
import { upload } from '../../config/multer.js';
import ProductoController from '../../controllers/product.controller.js';

const router = Router();
// Importing the ProductoController to handle product-related requests
router.get('/', ProductoController.getAll);
router.post('/report/get-all', ProductoController.getAllReportPDF);
router.get('/:id', ProductoController.getById);
router.post('/', upload.single('imagen'), ProductoController.create);
router.put('/:id', upload.single('imagen'), ProductoController.update);
router.delete('/:id', ProductoController.delete);

export default router;
