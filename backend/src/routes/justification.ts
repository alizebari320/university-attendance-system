import { Router } from 'express';
import * as ctrl from '../controllers/justification.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER', 'STUDENT']));

router.post('/', ctrl.submitJustification);
router.get('/', ctrl.listJustifications);
router.put('/:id/review', ctrl.reviewJustification);

export default router;