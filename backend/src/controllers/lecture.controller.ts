import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import crypto from 'crypto';

const prisma = new PrismaClient();

const lectureSlotSchema = z.object({
  name: z.string().min(1),
  courseId: z.string(),
  lecturerId: z.string(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  room: z.string().optional(),
});

const closeLectureSchema = z.object({
  cancel: z.boolean().default(false),
  reason: z.string().optional(),
});

export const listLectureSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { courseId, lecturerId } = req.query;
    const slots = await prisma.lectureSlot.findMany({
      where: {
        ...(courseId ? { courseId: String(courseId) } : {}),
        ...(lecturerId ? { lecturerId: String(lecturerId) } : {}),
        status: 'ACTIVE',
      },
      include: { course: true, lecturer: true },
      orderBy: { startTime: 'asc' },
    });
    res.json({ success: true, data: slots });
  } catch (error) { next(error); }
};

export const createLectureSlot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = lectureSlotSchema.parse(req.body);
    const slot = await prisma.lectureSlot.create({ data });
    res.status(201).json({ success: true, data: slot });
  } catch (error) { next(error); }
};

export const openLecture = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lectureId = req.params.id;
    const lecture = await prisma.lectureInstance.findUnique({
      where: { id: lectureId },
      include: { slot: true },
    });
    if (!lecture) { res.status(404).json({ success: false, error: 'Lecture not found' }); return; }

    // Generate a 6-digit PIN
    const pin = crypto.randomInt(100000, 999999).toString();
    const pinHash = crypto.createHash('sha256').update(pin).digest('hex');
    const pinExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const updated = await prisma.lectureInstance.update({
      where: { id: lectureId },
      data: {
        status: 'IN_PROGRESS',
        actualStart: new Date(),
        pinHash,
        pinExpiresAt,
        pinAttempts: 0,
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        entityType: 'LectureInstance',
        entityId: lectureId,
        action: 'LECTURE_OPEN',
        actorId: (req as any).user?.id,
        actorRole: (req as any).user?.role,
        ipAddress: (req as any).ipAddress,
        userAgent: (req as any).userAgent,
      },
    });

    res.json({ success: true, data: { ...updated, pin } });
  } catch (error) { next(error); }
};

export const closeLecture = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const lectureId = req.params.id;
    const { cancel, reason } = closeLectureSchema.parse(req.body);

    const lecture = await prisma.lectureInstance.findUnique({
      where: { id: lectureId },
      include: { slot: { include: { course: true } }, attendances: true },
    });
    if (!lecture) { res.status(404).json({ success: false, error: 'Lecture not found' }); return; }

    // Mark all enrolled students absent if not cancelled
    const students = await prisma.studentProfile.findMany({
      where: { departmentId: lecture.slot.course.departmentId, status: 'ACTIVE' },
    });

    // Auto-mark absences for students without attendance record
    const attendanceStudentIds = new Set(lecture.attendances.map(a => a.studentUserId));
    const absencesToCreate = students
      .filter(s => !attendanceStudentIds.has(s.userId))
      .map(s => ({
        lectureInstanceId: lectureId,
        studentId: s.id,
        studentUserId: s.userId,
        status: 'ABSENT' as const,
        checkInMethod: 'MANUAL' as const,
      }));

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.lectureInstance.update({
        where: { id: lectureId },
        data: {
          status: cancel ? 'CANCELLED' : 'CLOSED',
          actualEnd: new Date(),
          closedAt: new Date(),
          cancellationReason: cancel ? reason : undefined,
        },
      });
      if (!cancel) {
        await tx.attendanceRecord.createMany({ data: absencesToCreate });
      }
      return u;
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        entityType: 'LectureInstance',
        entityId: lectureId,
        action: cancel ? 'LECTURE_CANCEL' : 'LECTURE_CLOSE',
        actorId: (req as any).user?.id,
        actorRole: (req as any).user?.role,
        oldValues: { status: lecture.status },
        newValues: { status: cancel ? 'CANCELLED' : 'CLOSED', absencesCreated: absencesToCreate.length },
        reason: cancel ? reason : undefined,
        ipAddress: (req as any).ipAddress,
        userAgent: (req as any).userAgent,
      },
    });

    res.json({ success: true, data: { ...updated, absencesCreated: cancel ? 0 : absencesToCreate.length } });
  } catch (error) { next(error); }
};

export const listLectures = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slotId, status } = req.query;
    const lectures = await prisma.lectureInstance.findMany({
      where: {
        ...(slotId ? { slotId: String(slotId) } : {}),
        ...(status ? { status: status as any } : {}),
      },
      include: { slot: { include: { course: true } } },
      orderBy: { scheduledDate: 'desc' },
    });
    res.json({ success: true, data: lectures });
  } catch (error) { next(error); }
};