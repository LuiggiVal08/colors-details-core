import { Router } from 'express';
import ControlCajaController from '../../controllers/boxController.controller.js';

const router = Router();

// LISTAR
router.get('/', ControlCajaController.getAll);
router.get('/by-id/:id', ControlCajaController.getById);
router.get('/by-box/:caja_id', ControlCajaController.getByCaja);
router.get('/actual/:caja_id', ControlCajaController.getActualByCaja);

// OPERACIONES
router.post('/apertura/:caja_id', ControlCajaController.apertura);
router.post('/cierre/:caja_id', ControlCajaController.cierre);

export default router;
