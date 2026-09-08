import { Router } from 'express';
import QuestionsController from '../../controllers/questions.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();

// Rutas públicas del flujo de recuperación de contraseña
router.get('/user-check', QuestionsController.userCheck);
router.post('/valid-user/:userId', QuestionsController.byValidUser);
router.post('/valid-questions/:id_usuario', QuestionsController.validQuestions);

// Gestión de preguntas de seguridad (requiere sesión)
router.get('/', isAuthenticated, QuestionsController.getAll);
router.get('/:id', isAuthenticated, QuestionsController.getById);
router.post('/', isAuthenticated, QuestionsController.create);
router.put('/:id', isAuthenticated, QuestionsController.update);
router.delete('/:id', isAuthenticated, QuestionsController.delete)

export default router;
