import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const studentSchema = z.object({
  userId: z.string().min(1),
  studentNumber: z.string().min(1),
  collegeId: z.string(),
  departmentId: z.string(),
  enrollmentYear: z.number().min(1900).max(2100),
  enrollmentSemester: z.string(),
  absenceThreshold: z.number().min(0).default(5),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

export const listStudents = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { collegeId, departmentId } = req.query;
    const actorId = (req as any).user.id;
    const actorRole = (req as any).user.role;
    const where: any = {
      ...(collegeId ? { collegeId: String(collegeId) } : {}),
      ...(departmentId ? { departmentId: String(departmentId) } : {}),
    };

    if (actorRole === 'DEPARTMENT_ADMIN') {
      const admin = await prisma.departmentAdminProfile.findUnique({ where: { userId: actorId } });
      where.departmentId = admin ? admin.departmentId : '__none__';
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: { user: true, college: true, department: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: students });
  } catch (error) { next(error); }
};

export const createStudent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = studentSchema.parse(req.body);
    const student = await prisma.studentProfile.create({ data });
    res.status(201).json({ success: true, data: student });
  } catch (error) { next(error); }
};