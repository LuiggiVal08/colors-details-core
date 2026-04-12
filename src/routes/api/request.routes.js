import { Router } from 'express';
import RequestController from '../../controllers/request.controller.js';

const router = Router();

router.post('/username/', RequestController.queryUsername);
router.post('/security-questions/:id', RequestController.queryQuestions);
router.post('/password-change/:id', RequestController.changePassword);

export default router;
