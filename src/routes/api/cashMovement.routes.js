import { Router } from 'express';
import CashMovementController from '../../controllers/boxMovement.controller.js';
import isAuthenticated from '../../middlewares/isAuthenticate.js';

const router = Router();
router.use(isAuthenticated);

// ==============================================
// Create a new cash movement (deposit/withdrawal)
// POST /api/cash-movements
// ==============================================
router.post('/', CashMovementController.createMovement);

// ==============================================
// Get movements by control ID
// GET /api/cash-movements/by-control/:control_id
// ==============================================
router.get('/by-control/:control_id', CashMovementController.getByControl);

// ==============================================
// Get movements by box (finds active control)
// GET /api/cash-movements/by-box/:box_id
// ==============================================
router.get('/by-box/:box_id', CashMovementController.getByBox);

// ==============================================
// Get a single movement by ID
// GET /api/cash-movements/:id
// ==============================================
router.get('/:id', CashMovementController.getOne);

export default router;
