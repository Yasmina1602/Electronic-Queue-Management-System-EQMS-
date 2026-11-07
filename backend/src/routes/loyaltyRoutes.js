import { Router } from 'express';
import {
  lookupCustomer,
  getLoyaltyStats,
  getLoyaltyTiers,
  createLoyaltyTier,
  updateLoyaltyTier,
  deleteLoyaltyTier,
} from '../controllers/loyaltyController.js';

const router = Router();

router.get('/customer/:code', lookupCustomer);
router.get('/stats', getLoyaltyStats);

// Sodiqlik chegirma darajalari (Superadmin & Admin)
router.get('/tiers', getLoyaltyTiers);
router.post('/tiers', createLoyaltyTier);
router.put('/tiers/:id', updateLoyaltyTier);
router.delete('/tiers/:id', deleteLoyaltyTier);

export default router;

