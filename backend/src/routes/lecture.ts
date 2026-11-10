import { Router } from 'express';
import * as ctrl from '../controllers/lecture.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Students need to read the schedule to know which lecture is open for check-in
router.get('/slots', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'LECTURER', 'DEPARTMENT_ADMIN', 'STUDENT']), ctrl.listLectureSlots);
router.get('/', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'LECTURER', 'DEPARTMENT_ADMIN', 'STUDENT']), ctrl.listLectures);

router.use(authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'LECTURER', 'DEPARTMENT_ADMIN']));
router.post('/slots', ctrl.createLectureSlot);
router.post('/instances', ctrl.createLectureInstance);
router.post('/:id/open', ctrl.openLecture);
router.post('/:id/close', ctrl.closeLecture);

export default router;
