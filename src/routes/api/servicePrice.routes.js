import { Router } from 'express';
import ServicioPrecioController from '../../controllers/servicePrice.controller.js';

const router = Router();

// Crear nuevo precio
router.post('/', ServicioPrecioController.create);

// Historial de precios de un servicio
router.get('/history/:id', ServicioPrecioController.history);

export default router;
