import { Router } from 'express';
import NominaController from '../../controllers/nomina.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();

router.get('/', isAuthenticated, NominaController.getAll);
router.get('/:id', isAuthenticated, NominaController.getById);
router.post('/generate', isAuthenticated, NominaController.generate);

export default router;
