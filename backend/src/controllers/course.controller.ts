import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const courseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  credits: z.number().min(1).default(3),
  departmentId: z.string(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});

export const listCourses = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { departmentId } = req.query;
    const actorId = (req as any).user.id;
    const actorRole = (req as any).user.role;
    const where: any = departmentId ? { departmentId: String(departmentId) } : {};

    if (actorRole === 'DEPARTMENT_ADMIN' || actorRole === 'LECTURER') {
      const profile = actorRole === 'DEPARTMENT_ADMIN'
        ? await prisma.departmentAdminProfile.findUnique({ where: { userId: actorId } })
        : await prisma.lecturerProfile.findUnique({ where: { userId: actorId } });
      where.departmentId = profile ? profile.departmentId : '__none__';
    } else if (actorRole === 'STUDENT') {
      const student = await prisma.studentProfile.findUnique({ where: { userId: actorId } });
      where.departmentId = student ? student.departmentId : '__none__';
    }

    const courses = await prisma.course.findMany({
      where,
      include: { department: { include: { college: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: courses });
  } catch (error) { next(error); }
};

export const getCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { department: true },
    });
    if (!course) { res.status(404).json({ success: false, error: 'Course not found' }); return; }
    res.json({ success: true, data: course });
  } catch (error) { next(error); }
};

export const createCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = courseSchema.parse(req.body);
    const course = await prisma.course.create({ data });
    res.status(201).json({ success: true, data: course });
  } catch (error) { next(error); }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = courseSchema.partial().parse(req.body);
    const course = await prisma.course.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: course });
  } catch (error) { next(error); }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) { next(error); }
};