import { Router } from 'express';
import ClienteController from '../../controllers/customer.controller.js';

const router = Router();

router.get('/', ClienteController.getAll);
router.get('/:id', ClienteController.getById);
router.post('/', ClienteController.create);
router.put('/:id', ClienteController.update);
router.delete('/:id', ClienteController.delete);

export default router;
