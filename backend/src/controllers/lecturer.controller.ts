import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const lecturerSchema = z.object({
  userId: z.string().min(1),
  employeeId: z.string().min(1),
  collegeId: z.string(),
  departmentId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).default('ACTIVE'),
});

export const listLecturers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

    const lecturers = await prisma.lecturerProfile.findMany({
      where,
      include: { user: true, college: true, department: true, lectures: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: lecturers });
  } catch (error) { next(error); }
};

export const createLecturer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = lecturerSchema.parse(req.body);
    const lecturer = await prisma.lecturerProfile.create({ data });
    res.status(201).json({ success: true, data: lecturer });
  } catch (error) { next(error); }
};