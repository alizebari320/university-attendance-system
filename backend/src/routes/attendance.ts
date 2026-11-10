import { Router } from 'express';
import * as ctrl from '../controllers/attendance.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

const submitSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ pin: z.string().length(6) }),
});

const modifySchema = z.object({
  params: z.object({ attendanceId: z.string() }),
  body: z.object({ status: z.enum(['PRESENT', 'LATE', 'ABSENT']), reason: z.string().optional() }),
});

// Student submits own attendance for a lecture
router.post('/:lectureId/submit', authenticate, authorize(['STUDENT']), validateRequest(submitSchema), ctrl.submitAttendance);

// Get student attendance history (must come before /:attendanceId to avoid matching 'student' as an id)
router.get('/student/:userId', authenticate, ctrl.getStudentAttendanceHistory);

// Get attendance sheet for a lecture
router.get('/sheet/:lectureId', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'LECTURER', 'DEPARTMENT_ADMIN']), ctrl.getAttendanceSheet);

// Modify attendance (lecturer/dept admin/doctor)
router.put('/:attendanceId', authenticate, authorize(['SUPER_ADMIN', 'DOCTOR', 'DEPARTMENT_ADMIN', 'LECTURER']), validateRequest(modifySchema), ctrl.modifyAttendance);

export default router;