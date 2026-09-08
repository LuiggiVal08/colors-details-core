import { Router } from 'express';
import CompanyController from '../../controllers/company.controller.js';
import { upload } from '../../config/multer.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';
import requireRole from '../../middlewares/requireRole.js';

const router = Router();

router.put('/:id', isAuthenticated, requireRole(['admin', 'superadmin']), upload.single('logo'), CompanyController.update);

export default router;
