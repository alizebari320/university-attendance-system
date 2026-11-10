# University Attendance Management System

A multi-tenant SaaS platform for university attendance management with RBAC, fraud detection, audit trails, and premium analytics.

## Architecture Overview

### Technology Stack

**Frontend:**
- React 19 + TypeScript
- Tailwind CSS (dark theme)
- Recharts for analytics
- React Router

**Backend:**
- Node.js + Express
- TypeScript
- Zod validation
- JWT Authentication

**Database:**
- PostgreSQL 16
- Prisma ORM

**Testing:**
- Vitest (unit tests)
- Playwright (E2E tests)

## Project Structure

```
attendance-system/
├── backend/                  # Express API
│   ├── src/
│   │   ├── controllers/       # Business logic
│   │   ├── middleware/        # Auth, validation, error handling
│   │   ├── routes/            # API endpoints
│   │   ├── prisma/            # Seed script
│   │   └── types/             # TypeScript types
│   ├── prisma/                # Database schema
│   └── dist/                  # Compiled output
│
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── contexts/          # React context
│   │   ├── data/              # Nav items
│   │   ├── lib/               # API client, utils
│   │   ├── pages/             # Page components
│   │   ├── App.tsx            # Routing
│   │   └── main.tsx           # Entry point
│   ├── tailwind.config.js     # Design system
│   └── index.html
│
└── package.json               # Root scripts
```

## Database Schema

### Key Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **User** | All system users | email, passwordHash, role |
| **College** | University colleges | name, code, status |
| **Department** | Academic departments | name, code, collegeId |
| **Course** | Courses | name, code, credits, departmentId |
| **LecturerProfile** | Lecturer details | userId, employeeId, departmentId |
| **StudentProfile** | Student details | userId, studentNumber, departmentId |
| **LectureSlot** | Weekly lecture schedule | courseId, dayOfWeek, startTime, endTime |
| **LectureInstance** | Specific lecture date | slotId, scheduledDate, status, PIN |
| **AttendanceRecord** | Student attendance | lectureId, studentId, status |
| **AbsenceJustification** | Justification for absence | attendanceId, reason, status |
| **Notification** | User notifications | userId, type, title, message |
| **AuditLog** | System audit trail | entityType, entityId, action, actorId |
| **FraudDetectionLog** | Security events | userId, detectionType, severity |

### Security Constraints

1. **Attendance Ownership**: `UNIQUE(lecture_id, student_user_id)` prevents duplicates
2. **Student Self-Submission**: Backend enforces `student_user_id = current_user.id`
3. **No Modification**: Attendance records are immutable after creation
4. **Role-Based Access**: Lecturers only access assigned courses
5. **PIN Security**: 6-digit PIN, 30-minute expiry, brute-force protection

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Current user

### Core Modules
- `/api/colleges` - College management (Doctor/Super Admin)
- `/api/departments` - Department management (Doctor/Dept Admin)
- `/api/courses` - Course management
- `/api/students` - Student profiles
- `/api/lecturers` - Lecturer profiles
- `/api/lectures` - Lecture scheduling and management
- `/api/attendance` - Attendance check-in/submission
- `/api/justifications` - Absence justifications
- `/api/reports` - Daily/Weekly/Monthly/Semester reports
- `/api/notifications` - User notifications
- `/api/audit` - Audit logs (Doctor/Super Admin)
- `/api/fraud` - Fraud detection alerts (Doctor/Super Admin)

## Design System

### Color Palette
- **Background**: `#0a0a0a` (charcoal)
- **Surfaces**: `#171717` → `#262626` (gradient)
- **Primary**: Blue (`#3b82f6`, `#5c89ff`)
- **Accent**: Orange (`#f97316`, `#ea580c`)

### Components
- Cards with subtle borders
- Interactive tables with status badges
- Animated stat cards
- Responsive sidebar navigation

## Roles and Permissions

| Role | Access Level |
|------|-------------|
| **Super Admin** | All colleges/departments, full audit access |
| **Doctor** | Switch colleges, view all students, fraud alerts |
| **Department Admin** | Own department management |
| **Lecturer** | Own courses, attendance check-in, justifications |
| **Student** | Own attendance only |

## Getting Started

### Prerequisites
- Node.js 22+
- PostgreSQL 16
- Docker/Podman (for database)

### Setup

```bash
# Clone repository
git clone https://github.com/alizebari320/university-attendance-system.git
cd attendance-attendance-system

# Start PostgreSQL
podman run -d --name attendance-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=attendance_system \
  -p 5432:5432 postgres:16-alpine

# Install dependencies
npm install

# Run database setup
npm run db:setup

# Start development
npm run dev
```

### Environment Variables

```bash
# Backend (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/attendance_system
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=5000

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

## Development Phases

| Phase | Status |
|-------|--------|
| 1. Architecture & DB Schema | ✅ Complete |
| 2. Design System | ✅ Complete |
| 3. Auth & RBAC | ✅ Complete |
| 4. College/Dept/Course CRUD | ✅ Complete |
| 5. Lecture Scheduling | In Progress |
| 6. Student Attendance | In Progress |
| 7. Lecturer Confirmation | Pending |
| 8. Reporting | Pending |
| 9. Justifications & Notifications | Pending |
| 10. Fraud Detection | Pending |
| 11. Exports | Pending |
| 12. Testing & Deployment | Pending |

## Demo Credentials

```
Email: student@university.edu
Password: Student123!

Email: lecturer@university.edu
Password: Lecturer123!

Email: doctor@university.edu
Password: Doctor123!

Email: superadmin@university.edu
Password: SuperAdmin123!
```

## License

MIT