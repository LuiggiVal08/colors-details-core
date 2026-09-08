import { Router } from 'express';
import ControlCajaController from '../../controllers/boxController.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

// LISTAR
router.get('/', ControlCajaController.getAll);
router.get('/by-id/:id', ControlCajaController.getById);
router.get('/by-box/:caja_id', ControlCajaController.getByCaja);
router.get('/actual/:caja_id', ControlCajaController.getActualByCaja);
router.get('/mi-actual', ControlCajaController.getMyActual);

// OPERACIONES
router.post('/apertura/:caja_id', ControlCajaController.apertura);
router.post('/cierre/:caja_id', ControlCajaController.cierre);

export default router;
