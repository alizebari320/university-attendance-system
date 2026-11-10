import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const submitJustificationSchema = z.object({
  attendanceId: z.string(),
  reason: z.enum(['MEDICAL', 'FAMILY_EMERGENCY', 'TRAVEL', 'OTHER']),
  justificationText: z.string().min(10),
  evidenceUrls: z.array(z.string().url()).optional(),
});

const reviewJustificationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNotes: z.string().optional(),
});

export const submitJustification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { attendanceId, reason, justificationText, evidenceUrls = [] } = submitJustificationSchema.parse(req.body);
    const studentUserId = (req as any).user.id;

    const attendance = await prisma.attendanceRecord.findUnique({
      where: { id: attendanceId },
      include: { student: true },
    });
    if (!attendance) { res.status(404).json({ success: false, error: 'Attendance not found' }); return; }

    if (attendance.studentUserId !== studentUserId) {
      res.status(403).json({ success: false, error: 'Can only submit justification for your own attendance' });
      return;
    }

    const existing = await prisma.absenceJustification.findUnique({
      where: { attendanceId },
    });
    if (existing) { res.status(400).json({ success: false, error: 'Justification already submitted' }); return; }

    const justification = await prisma.absenceJustification.create({
      data: {
        attendanceId,
        studentId: attendance.studentId,
        reason,
        justificationText,
        evidenceUrls,
        status: 'PENDING',
      },
      include: { student: { include: { user: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: studentUserId,
        type: 'ABSENCE_REGISTRATION',
        title: 'Justification Submitted',
        message: `Your absence justification for lecture ${attendanceId} has been submitted and is pending review.`,
        relatedEntityType: 'AbsenceJustification',
        relatedEntityId: justification.id,
      },
    });

    res.status(201).json({ success: true, data: justification });
  } catch (error) { next(error); }
};

export const listJustifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, studentId } = req.query as any;
    const actorId = (req as any).user.id;
    const actorRole = (req as any).user.role;
    const where: any = {};
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    if (actorRole === 'STUDENT') {
      const profile = await prisma.studentProfile.findUnique({ where: { userId: actorId } });
      where.studentId = profile ? profile.id : '__none__';
    } else if (actorRole === 'LECTURER') {
      const lecturer = await prisma.lecturerProfile.findUnique({ where: { userId: actorId } });
      where.student = { departmentId: lecturer ? lecturer.departmentId : '__none__' };
    } else if (actorRole === 'DEPARTMENT_ADMIN') {
      const admin = await prisma.departmentAdminProfile.findUnique({ where: { userId: actorId } });
      where.student = { departmentId: admin ? admin.departmentId : '__none__' };
    }

    const justifications = await prisma.absenceJustification.findMany({
      where,
      include: {
        student: { include: { user: true, department: true } },
        reviewer: true,
        attendance: {
          include: { lectureInstance: { include: { slot: { include: { course: true } } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: justifications });
  } catch (error) { next(error); }
};

export const reviewJustification = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const justificationId = req.params.id;
    const { status, reviewNotes } = reviewJustificationSchema.parse(req.body);
    const reviewerId = (req as any).user.id;
    const reviewerRole = (req as any).user.role;

    const justification = await prisma.absenceJustification.findUnique({
      where: { id: justificationId },
      include: { attendance: { include: { student: true } }, student: true },
    });
    if (!justification) { res.status(404).json({ success: false, error: 'Justification not found' }); return; }

    const attendanceDept = justification.attendance.student.departmentId;
    let authorized = false;
    if (reviewerRole === 'SUPER_ADMIN' || reviewerRole === 'DOCTOR') authorized = true;
    else if (reviewerRole === 'DEPARTMENT_ADMIN') {
      const admin = await prisma.departmentAdminProfile.findUnique({ where: { userId: reviewerId } });
      authorized = admin ? admin.departmentId === attendanceDept : false;
    } else if (reviewerRole === 'LECTURER') {
      const lecturer = await prisma.lecturerProfile.findUnique({ where: { userId: reviewerId } });
      authorized = lecturer ? true : false;
    }

    if (!authorized) {
      res.status(403).json({ success: false, error: 'Not authorized to review this justification' });
      return;
    }

    const updated = await prisma.absenceJustification.update({
      where: { id: justificationId },
      data: {
        status,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        reviewNotes,
      },
      include: { student: { include: { user: true } } },
    });

    await prisma.notification.create({
      data: {
        userId: justification.student.userId,
        type: status === 'APPROVED' ? 'APPROVED_JUSTIFICATION' : 'REJECTED_JUSTIFICATION',
        title: status === 'APPROVED' ? 'Justification Approved' : 'Justification Rejected',
        message: `Your absence justification has been ${status.toLowerCase()}. ${reviewNotes || ''}`,
        relatedEntityType: 'AbsenceJustification',
        relatedEntityId: justificationId,
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) { next(error); }
};