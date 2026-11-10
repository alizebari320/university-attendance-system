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
    const courses = await prisma.course.findMany({
      where: departmentId ? { departmentId: String(departmentId) } : {},
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