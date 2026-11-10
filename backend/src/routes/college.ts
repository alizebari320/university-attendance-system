import { Router } from 'express';
import * as ctrl from '../controllers/college.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR']));

router.get('/', ctrl.listColleges);
router.get('/:id', ctrl.getCollege);
router.post('/', ctrl.createCollege);
router.put('/:id', ctrl.updateCollege);
router.delete('/:id', ctrl.deleteCollege);

export default router;