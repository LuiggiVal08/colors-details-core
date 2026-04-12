import { Router } from 'express';
import TasaDolarController from '../../controllers/exchangeRate.controller.js';

const router = Router();

router.get('/', TasaDolarController.getAll);
router.get('/actual', TasaDolarController.getActual);
router.post('/', TasaDolarController.create);

export default router;
