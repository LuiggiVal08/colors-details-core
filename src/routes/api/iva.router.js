import { Router } from 'express';
import IvaController from '../../controllers/iva.controller.js';

const router = Router();

router.get('/', IvaController.getAll);
router.get('/actual', IvaController.getActual);
router.post('/', IvaController.create);

export default router;
