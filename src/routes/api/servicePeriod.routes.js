import { Router } from 'express';
import ServicioPeriodoController from '../../controllers/ServicioPeriodo.controller.js';

const router = Router();

// Obtener periodos por servicio
router.get('/by-service/:id', ServicioPeriodoController.getByServicio);

// Crear periodo manual
router.post('/', ServicioPeriodoController.create);

export default router;
