import { Router } from 'express';
import CajaRegistradoraController from '../../controllers/box.controller.js';

const router = Router();

router.get('/', CajaRegistradoraController.getAll);
router.get('/:id', CajaRegistradoraController.getById);
router.post('/', CajaRegistradoraController.create);
router.put('/:id', CajaRegistradoraController.update);
router.delete('/:id', CajaRegistradoraController.delete);

export default router;
