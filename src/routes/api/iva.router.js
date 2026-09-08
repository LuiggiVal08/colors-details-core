import { Router } from 'express';
import IvaController from '../../controllers/iva.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', IvaController.getAll);
router.get('/actual', IvaController.getActual);
router.post('/', IvaController.create);

export default router;
