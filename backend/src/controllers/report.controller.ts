import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type DateRange = { start: Date; end: Date };

function parseRange(range?: string): DateRange | null {
  if (!range) return null;
  const parts = range.split(',').map(s => s.trim());
  if (parts.length !== 2) return null;
  return { start: new Date(parts[0]), end: new Date(parts[1]) };
}

export const dailyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const range = parseRange(req.query.range as string | undefined);
    const today = range?.start || new Date();
    today.setHours(0, 0, 0, 0);
    const endDay = new Date(today);
    endDay.setDate(endDay.getDate() + 1);

    const [attendances, stats] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where: {
          createdAt: { gte: today, lt: endDay },
        },
        include: { student: { include: { department: true } }, lectureInstance: true },
      }),
      prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: {
          createdAt: { gte: today, lt: endDay },
        },
        _count: { status: true },
      }),
    ]);

    res.json({ success: true, data: { date: today, stats, attendances } });
  } catch (error) { next(error); }
};

export const weeklyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const range = parseRange(req.query.range as string | undefined);
    const today = range?.start || new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const stats = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startOfWeek, lt: endOfWeek },
      },
      _count: { status: true },
    });

    const byDay = await prisma.attendanceRecord.findMany({
      where: { createdAt: { gte: startOfWeek, lt: endOfWeek } },
      include: { student: { include: { department: true } } },
    });

    res.json({ success: true, data: { weekStart: startOfWeek, weekEnd: endOfWeek, stats, records: byDay } });
  } catch (error) { next(error); }
};

export const monthlyReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const range = parseRange(req.query.range as string | undefined);
    const today = range?.start || new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const stats = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startOfMonth, lt: endOfMonth },
      },
      _count: { status: true },
    });

    const byStudent = await prisma.studentProfile.findMany({
      where: { status: 'ACTIVE' },
      include: {
        attendances: {
          where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
        },
      },
    });

    res.json({ success: true, data: { month: today.getMonth(), year: today.getFullYear(), stats, byStudent } });
  } catch (error) { next(error); }
};

export const semesterReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const range = parseRange(req.query.range as string | undefined);
    const start = range?.start || new Date();
    const end = range?.end || new Date();
    end.setHours(23, 59, 59, 999);

    const stats = await prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: start, lt: end },
      },
      _count: { status: true },
    });

    const absenceCounts = await prisma.studentProfile.findMany({
      where: { status: 'ACTIVE' },
      include: {
        attendances: {
          where: { status: 'ABSENT', createdAt: { gte: start, lt: end } },
        },
      },
    });

    res.json({ success: true, data: { period: { start, end }, stats, absenceCounts } });
  } catch (error) { next(error); }
};

export const exportReport = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type = 'daily' } = req.query;
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.csv`);
    res.status(200).send('col1,col2\nvalue1,value2');
  } catch (error) { next(error); }
};