import { Router } from 'express';
import { lookupCustomer, getLoyaltyStats } from '../controllers/loyaltyController.js';

const router = Router();

router.get('/customer/:code', lookupCustomer);
router.get('/stats', getLoyaltyStats);

export default router;

