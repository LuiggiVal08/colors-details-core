import { Router } from 'express';
import NominaEmpleadoController from '../../controllers/employeePayroll.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

router.get('/', NominaEmpleadoController.getAll);
router.get('/:id', NominaEmpleadoController.getById);
router.post('/', NominaEmpleadoController.create);
router.put('/:id', NominaEmpleadoController.update);
router.delete('/:id', NominaEmpleadoController.delete);

export default router;
