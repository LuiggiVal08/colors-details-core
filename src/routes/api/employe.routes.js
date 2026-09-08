import { Router } from 'express';
import ClienteEmploye from '../../controllers/employe.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';
import requireRole from '../../middlewares/requireRole.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', ClienteEmploye.getAll);
router.get('/deuda/:id', ClienteEmploye.deuda);
router.get('/:id', ClienteEmploye.getById);
router.get('/:id/user', ClienteEmploye.getByIdUser);
router.post('/', requireRole(['admin', 'superadmin']), ClienteEmploye.create);
router.put('/:id', ClienteEmploye.update);
router.delete('/:id', requireRole(['admin', 'superadmin']), ClienteEmploye.delete);

export default router;
