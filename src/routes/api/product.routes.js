import { Router } from 'express';
import { upload } from '../../config/multer.js';
import ProductoController from '../../controllers/product.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

const uploadImagen = (req, res, next) => {
    upload.single('imagen')(req, res, (err) => {
        if (err) {
            const message = err.code === 'LIMIT_FILE_SIZE'
                ? 'La imagen supera el tamaño máximo permitido (10MB)'
                : err.message || 'Error al subir la imagen';
            return res.status(400).json({ message });
        }
        next();
    });
};

// Importing the ProductoController to handle product-related requests
router.get('/', ProductoController.getAll);
router.post('/report/get-all', ProductoController.getAllReportPDF);
router.get('/:id', ProductoController.getById);
router.post('/', uploadImagen, ProductoController.create);
router.put('/:id', uploadImagen, ProductoController.update);
router.delete('/:id', ProductoController.delete);

export default router;
