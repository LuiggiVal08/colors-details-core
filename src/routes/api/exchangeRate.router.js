import { Router } from 'express';
import TasaDolarController from '../../controllers/exchangeRate.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();

// Tasa actual: dato de solo lectura usado en páginas públicas (aside/sidebar)
router.get('/actual', TasaDolarController.getActual);

router.use(isAuthenticated);

router.get('/', TasaDolarController.getAll);
router.post('/', TasaDolarController.create);

export default router;
