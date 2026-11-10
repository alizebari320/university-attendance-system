import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create Super Admin user
  const _superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@university.edu' },
    update: {},
    create: {
      email: 'superadmin@university.edu',
      passwordHash: await bcrypt.hash('SuperAdmin123!', 10),
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
  });

  // Create Doctor user
  const _doctor = await prisma.user.upsert({
    where: { email: 'doctor@university.edu' },
    update: {},
    create: {
      email: 'doctor@university.edu',
      passwordHash: await bcrypt.hash('Doctor123!', 10),
      role: 'DOCTOR',
      status: 'ACTIVE',
    },
  });

  // Create College
  const college = await prisma.college.upsert({
    where: { code: 'ENG' },
    update: {},
    create: {
      name: 'College of Engineering',
      code: 'ENG',
      status: 'ACTIVE',
    },
  });

  // Create Department
  const department = await prisma.department.upsert({
    where: { code: 'CS' },
    update: {},
    create: {
      name: 'Computer Science Department',
      code: 'CS',
      collegeId: college.id,
      status: 'ACTIVE',
    },
  });

  // Create Lecturer user
  const lecturerUser = await prisma.user.upsert({
    where: { email: 'lecturer@university.edu' },
    update: {},
    create: {
      email: 'lecturer@university.edu',
      passwordHash: await bcrypt.hash('Lecturer123!', 10),
      role: 'LECTURER',
      status: 'ACTIVE',
    },
  });

  const lecturer = await prisma.lecturerProfile.upsert({
    where: { userId: lecturerUser.id },
    update: {},
    create: {
      userId: lecturerUser.id,
      employeeId: 'EMP-001',
      collegeId: college.id,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });

  // Create Student user
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@university.edu' },
    update: {},
    create: {
      email: 'student@university.edu',
      passwordHash: await bcrypt.hash('Student123!', 10),
      role: 'STUDENT',
      status: 'ACTIVE',
    },
  });

  const _student = await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentNumber: 'STU-2024-001',
      collegeId: college.id,
      departmentId: department.id,
      enrollmentYear: 2024,
      enrollmentSemester: 'Fall',
      absenceThreshold: 5,
      status: 'ACTIVE',
    },
  });

  // Create Course
  const course = await prisma.course.upsert({
    where: { code: 'CS101' },
    update: {},
    create: {
      name: 'Introduction to Programming',
      code: 'CS101',
      credits: 3,
      departmentId: department.id,
      status: 'ACTIVE',
    },
  });

  // Create Lecture Slot
  const slot = await prisma.lectureSlot.upsert({
    where: { id: 'slot-' + course.id },
    update: {},
    create: {
      id: 'slot-' + course.id,
      name: 'CS101 - Monday Lecture',
      courseId: course.id,
      lecturerId: lecturer.id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '10:30',
      room: 'Room 101',
      status: 'ACTIVE',
    },
  });

  // Create Lecture Instance for today
  const today = new Date();
  today.setHours(9, 0, 0, 0);

  const _lectureInstance = await prisma.lectureInstance.create({
    data: {
      slotId: slot.id,
      scheduledDate: today,
      status: 'SCHEDULED',
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });