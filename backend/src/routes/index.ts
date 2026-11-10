import { Router } from 'express';
import authRoutes from './auth';
import collegeRoutes from './college';
import departmentRoutes from './department';
import courseRoutes from './course';
import lecturerRoutes from './lecturer';
import studentRoutes from './student';
import lectureRoutes from './lecture';
import attendanceRoutes from './attendance';
import justificationRoutes from './justification';
import notificationRoutes from './notification';
import reportRoutes from './report';
import auditRoutes from './audit';
import fraudRoutes from './fraud';

const router = Router();

router.use('/auth', authRoutes);
router.use('/colleges', collegeRoutes);
router.use('/departments', departmentRoutes);
router.use('/courses', courseRoutes);
router.use('/lecturers', lecturerRoutes);
router.use('/students', studentRoutes);
router.use('/lectures', lectureRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/justifications', justificationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/reports', reportRoutes);
router.use('/audit', auditRoutes);
router.use('/fraud', fraudRoutes);

export default router;