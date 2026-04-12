import { Router } from 'express';
import PagoServicioController from '../../controllers/pagoServicio.controller.js';

const router = Router();

// Registrar pago de servicio
router.post('/', PagoServicioController.create);

export default router;
