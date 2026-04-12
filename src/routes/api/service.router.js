import { Router } from 'express';
import ServicioController from '../../controllers/service.controller.js';

const router = Router();

router.get('/', ServicioController.getAll);
router.get('/:id', ServicioController.getById);
router.post('/', ServicioController.create);
router.put('/:id', ServicioController.update);
router.delete('/:id', ServicioController.delete);

export default router;
