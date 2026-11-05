import { Router } from 'express';
import { login, registerRequest, getMe } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register-request', registerRequest);
router.get('/me', authenticate, getMe);

export default router;

