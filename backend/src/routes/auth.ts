import { Router } from 'express';
import { login, logout, refresh, authenticate } from '../middleware/auth';
import { getCurrentUser } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
    rememberMe: z.boolean().optional(),
  }),
});

router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refresh);
router.get('/me', authenticate, getCurrentUser);

export default router;