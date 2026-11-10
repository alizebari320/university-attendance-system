import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const collegeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(20),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const listColleges = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const colleges = await prisma.college.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        departments: true,
        students: true,
        lecturers: true,
      },
    });
    res.json({ success: true, data: colleges });
  } catch (error) { next(error); }
};

export const getCollege = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const college = await prisma.college.findUnique({
      where: { id: req.params.id },
      include: { departments: true },
    });
    if (!college) {
      res.status(404).json({ success: false, error: 'College not found' });
      return;
    }
    res.json({ success: true, data: college });
  } catch (error) { next(error); }
};

export const createCollege = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = collegeSchema.parse(req.body);
    const college = await prisma.college.create({ data });
    res.status(201).json({ success: true, data: college });
  } catch (error) { next(error); }
};

export const updateCollege = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const data = collegeSchema.partial().parse(req.body);
    const college = await prisma.college.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, data: college });
  } catch (error) { next(error); }
};

export const deleteCollege = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    await prisma.college.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'College deleted' });
  } catch (error) { next(error); }
};