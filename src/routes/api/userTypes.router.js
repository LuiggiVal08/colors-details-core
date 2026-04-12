import { Router } from 'express';
import TipoUsuarioController from '../../controllers/userTypes.controller.js';

const router = Router();

router.get('/', TipoUsuarioController.getAll);
router.get('/:id', TipoUsuarioController.getById);
router.post('/', TipoUsuarioController.create);
router.put('/:id', TipoUsuarioController.update);
router.delete('/:id', TipoUsuarioController.delete);

export default router;
