import { Router } from 'express';
import PagoServicioController from '../../controllers/pagoServicio.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

// Historial de pagos de un servicio
router.get('/by-service/:id', PagoServicioController.getByServicio);

// Registrar pago de servicio
router.post('/', PagoServicioController.create);

export default router;
