import { Router } from 'express';
import {
  handleCreateTicket,
  handleCallNext,
  handleStartService,
  handleCompleteService,
  handleMarkNoShow,
  handleRecallCustomer,
  handleTransferTicket,
  handleGetState,
} from '../controllers/queueController.js';

const router = Router();

// Public kiosk ticket creation (no auth needed, no PII collected)
router.post('/ticket', handleCreateTicket);

// Full state snapshot for kiosk, display, operator, manager, admin
router.get('/state', handleGetState);

// Operator queue operations
router.post('/next', handleCallNext);
router.post('/:id/start', handleStartService);
router.post('/:id/complete', handleCompleteService);
router.post('/:id/no-show', handleMarkNoShow);
router.post('/:id/recall', handleRecallCustomer);
router.post('/:id/transfer', handleTransferTicket);

export default router;

