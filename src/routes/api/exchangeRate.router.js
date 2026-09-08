import { Router } from 'express';
import TasaDolarController from '../../controllers/exchangeRate.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', TasaDolarController.getAll);
router.get('/actual', TasaDolarController.getActual);
router.post('/', TasaDolarController.create);

export default router;
