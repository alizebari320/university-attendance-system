import { Router } from 'express';
import * as ctrl from '../controllers/lecture.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'LECTURER', 'DEPARTMENT_ADMIN']));

router.get('/slots', ctrl.listLectureSlots);
router.post('/slots', ctrl.createLectureSlot);
router.get('/', ctrl.listLectures);
router.post('/:id/open', ctrl.openLecture);
router.post('/:id/close', ctrl.closeLecture);

export default router;