import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

const submitAttendanceSchema = z.object({
  params: z.object({ lectureId: z.string() }),
  body: z.object({ pin: z.string().length(6) }),
});

const modifyAttendanceSchema = z.object({
  status: z.enum(['PRESENT', 'LATE', 'ABSENT']),
  reason: z.string().optional(),
});

export const submitAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const parsed = submitAttendanceSchema.safeParse({ params: req.params, body: req.body });
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.errors });
      return;
    }
    const { pin } = parsed.data.body;
    const lectureId = parsed.data.params.lectureId;
    const currentUserId = (req as any).user.id;
    const currentUserRole = (req as any).user.role;

    if (currentUserRole !== 'STUDENT') {
      res.status(403).json({ success: false, error: 'Only students can submit attendance' });
      return;
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: currentUserId },
    });
    if (!studentProfile) {
      res.status(404).json({ success: false, error: 'Student profile not found' });
      return;
    }

    const lecture = await prisma.lectureInstance.findUnique({
      where: { id: lectureId },
      include: { slot: { include: { course: true } } },
    });
    if (!lecture) {
      res.status(404).json({ success: false, error: 'Lecture not found' });
      return;
    }

    if (lecture.status === 'CANCELLED') {
      await prisma.fraudDetectionLog.create({
        data: {
          userId: currentUserId,
          lectureInstanceId: lectureId,
          detectionType: 'CANCELLED_LECTURE_ATTENDANCE',
          severity: 'HIGH',
          details: { lectureId, status: lecture.status },
          ipAddress: (req as any).ipAddress,
        },
      });
      res.status(400).json({ success: false, error: 'Cannot submit attendance for cancelled lecture' });
      return;
    }

    if (lecture.status !== 'IN_PROGRESS') {
      res.status(400).json({ success: false, error: 'Lecture is not open for check-in' });
      return;
    }

    if (!lecture.pinExpiresAt || lecture.pinExpiresAt < new Date()) {
      await prisma.fraudDetectionLog.create({
        data: {
          userId: currentUserId,
          lectureInstanceId: lectureId,
          detectionType: 'EXPIRED_PIN_USED',
          severity: 'MEDIUM',
          details: { lectureId },
          ipAddress: (req as any).ipAddress,
        },
      });
      res.status(400).json({ success: false, error: 'PIN has expired' });
      return;
    }

    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
    if (pinHash !== lecture.pinHash) {
      await prisma.lectureInstance.update({
        where: { id: lectureId },
        data: { pinAttempts: lecture.pinAttempts + 1 },
      });
      await prisma.fraudDetectionLog.create({
        data: {
          userId: currentUserId,
          lectureInstanceId: lectureId,
          detectionType: 'BRUTE_FORCE_PIN',
          severity: 'HIGH',
          details: { lectureId, attempts: lecture.pinAttempts + 1 },
          ipAddress: (req as any).ipAddress,
        },
      });
      res.status(401).json({ success: false, error: 'Invalid PIN' });
      return;
    }

    const existing = await prisma.attendanceRecord.findUnique({
      where: {
        lectureInstanceId_studentUserId: {
          lectureInstanceId: lectureId,
          studentUserId: currentUserId,
        },
      },
    });
    if (existing) {
      await prisma.fraudDetectionLog.create({
        data: {
          userId: currentUserId,
          lectureInstanceId: lectureId,
          detectionType: 'DUPLICATE_ATTENDANCE',
          severity: 'CRITICAL',
          details: { lectureId, existingAttendanceId: existing.id },
          ipAddress: (req as any).ipAddress,
        },
      });
      res.status(409).json({ success: false, error: 'Attendance already submitted for this lecture' });
      return;
    }

    if (studentProfile.departmentId !== lecture.slot.course.departmentId) {
      await prisma.fraudDetectionLog.create({
        data: {
          userId: currentUserId,
          lectureInstanceId: lectureId,
          detectionType: 'FOREIGN_STUDENT_ATTENDANCE',
          severity: 'HIGH',
          details: {
            lectureId,
            studentDept: studentProfile.departmentId,
            courseDept: lecture.slot.course.departmentId,
          },
          ipAddress: (req as any).ipAddress,
        },
      });
      res.status(403).json({ success: false, error: 'Student not enrolled in this course department' });
      return;
    }

    const scheduledTime = new Date(lecture.scheduledDate);
    const [startHour, startMin] = lecture.slot.startTime.split(':').map(Number);
    scheduledTime.setHours(startHour, startMin, 0, 0);
    const gracePeriod = 10 * 60 * 1000;
    const now = new Date();
    const isLate = now.getTime() > scheduledTime.getTime() + gracePeriod;
    const status = isLate ? 'LATE' : 'PRESENT';

    const attendance = await prisma.attendanceRecord.create({
      data: {
        lectureInstanceId: lectureId,
        studentId: studentProfile.id,
        studentUserId: currentUserId,
        status,
        checkInTime: now,
        checkInMethod: 'PIN',
        pinUsed: pin,
        ipAddress: (req as any).ipAddress,
        userAgent: (req as any).userAgent,
      },
    });

    await prisma.notification.create({
      data: {
        userId: currentUserId,
        type: status === 'LATE' ? 'LATE_ARRIVAL' : 'ATTENDANCE_CONFIRMATION',
        title: status === 'LATE' ? 'Late Arrival Recorded' : 'Attendance Confirmed',
        message: `Your attendance for ${lecture.slot.course.name} has been recorded as ${status}.`,
        relatedEntityType: 'AttendanceRecord',
        relatedEntityId: attendance.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'AttendanceRecord',
        entityId: attendance.id,
        action: 'ATTENDANCE_SUBMIT',
        actorId: currentUserId,
        actorRole: currentUserRole,
        newValues: { lectureId, studentId: currentUserId, status },
        ipAddress: (req as any).ipAddress,
        userAgent: (req as any).userAgent,
      },
    });

    res.status(201).json({ success: true, data: { attendance, status } });
  } catch (error) { next(error); }
};

export const modifyAttendance = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, reason } = modifyAttendanceSchema.parse(req.body);
    const attendanceId = req.params.attendanceId;
    const actorId = (req as any).user.id;
    const actorRole = (req as any).user.role;

    const attendance = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: { lectureInstance: { include: { slot: true } }, student: true },
    });
    if (!attendance) { res.status(404).json({ success: false, error: 'Attendance record not found' }); return; }

    const lecture = attendance.lectureInstance;
    const studentDept = attendance.student.departmentId;

    let authorized = false;
    if (actorRole === 'SUPER_ADMIN' || actorRole === 'DOCTOR') {
      authorized = true;
    } else if (actorRole === 'DEPARTMENT_ADMIN') {
      const admin = await prisma.departmentAdminProfile.findUnique({
        where: { userId: actorId },
      });
      authorized = admin ? admin.departmentId === studentDept : false;
    } else if (actorRole === 'LECTURER') {
      const lecturer = await prisma.lecturerProfile.findUnique({
        where: { userId: actorId },
      });
      authorized = lecturer ? lecture.slot.lecturerId === lecturer.id : false;
    }

    if (!authorized) {
      res.status(403).json({ success: false, error: 'Not authorized to modify this attendance' });
      return;
    }

    const oldStatus = attendance.status;
    const updated = await prisma.attendanceRecord.update({
      where: { id: attendanceId },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        entityType: 'AttendanceRecord',
        entityId: attendanceId,
        action: 'ATTENDANCE_MODIFY',
        actorId,
        actorRole,
        oldValues: { status: oldStatus },
        newValues: { status },
        reason,
        ipAddress: (req as any).ipAddress,
        userAgent: (req as any).userAgent,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};

export const getAttendanceSheet = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lectureId = req.params.lectureId;
    const sheet = await prisma.attendanceRecord.findMany({
      where: { lectureInstanceId: lectureId },
      include: { student: { include: { user: true, department: true } } },
      orderBy: { checkInTime: 'asc' },
    });
    res.json({ success: true, data: sheet });
  } catch (error) { next(error); }
};

export const getStudentAttendanceHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const studentUserId = req.params.userId || (req as any).user.id;
    const actorRole = (req as any).user.role;

    if (actorRole === 'STUDENT' && studentUserId !== (req as any).user.id) {
      res.status(403).json({ success: false, error: 'Can only access your own history' });
      return;
    }

    const history = await prisma.attendanceRecord.findMany({
      where: { studentUserId },
      include: {
        lectureInstance: { include: { slot: { include: { course: true } } } },
        justification: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: history });
  } catch (error) { next(error); }
};