import { Router } from 'express';
import ServicioPeriodoController from '../../controllers/ServicioPeriodo.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

// Obtener periodos por servicio
router.get('/by-service/:id', ServicioPeriodoController.getByServicio);

// Crear periodo manual
router.post('/', ServicioPeriodoController.create);

export default router;
