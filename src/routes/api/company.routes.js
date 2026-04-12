import { Router } from 'express';
import CompanyController from '../../controllers/company.controller.js';
// import UserController from '../../controllers/user.controller.js';

const router = Router();

// router.get('/', UserController.getAll);
// router.get('/:id', UserController.getById);
// router.post('/', UserController.create);
router.put('/:id', CompanyController.update);
// router.post('/:id', UserController.update);
// router.delete('/:id', UserController.delete);

export default router;
