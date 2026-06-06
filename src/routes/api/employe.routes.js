import { Router } from 'express';
import ClienteEmploye from '../../controllers/employe.controller.js';

const router = Router();

router.get('/', ClienteEmploye.getAll);
router.get('/deuda/:id', ClienteEmploye.deuda);
router.get('/:id', ClienteEmploye.getById);
router.get('/:id/user', ClienteEmploye.getByIdUser);
router.post('/', ClienteEmploye.create);
router.put('/:id', ClienteEmploye.update);
router.delete('/:id', ClienteEmploye.delete);

export default router;
