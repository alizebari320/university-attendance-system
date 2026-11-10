# University Attendance Management System

A full-stack, multi-tenant web application that lets a university record and audit student attendance across colleges, departments and courses — with role-based access control, PIN-verified check-in, absence justifications, in-app notifications, fraud detection and a full audit trail.

The problem it solves: paper sheets and spreadsheets make attendance easy to fake, hard to audit and impossible to report on. This system moves the whole flow online, records who did what and when, and refuses — on the server, not in the browser — any action a user is not entitled to perform.

---

## How it works

### 1. Roles

Five roles, each with a different scope. Scope is enforced in the API layer, so hiding a button in the UI is never the only protection.

| Role | What they can do |
|------|------------------|
| **Super Admin** | Everything, across every college. Full audit and fraud access. |
| **Doctor** | University-wide oversight: analytics, all students, fraud alerts, audit logs. Can switch between colleges. |
| **Department Admin** | Manages only their own department: courses, lecturers, students, lectures. |
| **Lecturer** | Manages only the lectures they own: opens attendance, marks students, reviews justifications, posts announcements. |
| **Student** | Sees only their own attendance history, checks into lectures with a PIN, submits absence justifications. |

### 2. Structure: College → Department → Course → Lecture

- A **College** contains **Departments**.
- A **Department** contains **Courses**, **Lecturers** and **Students**.
- A **Course** has **Lecture Slots** — the recurring weekly timetable (day of week, start and end time).
- A **Lecture Slot** generates **Lecture Instances** — one real, dated occurrence of that class.

Separating the recurring timetable from the dated occurrence is what makes reports, absences and per-session PINs possible.

### 3. Attendance flow

1. A lecturer **schedules** a lecture instance from a slot.
2. When class starts, the lecturer **opens** the lecture. The server generates a 6-digit PIN, valid for a limited window.
3. The lecturer shares the PIN verbally in the room.
4. Each student logs in and **checks in** with the PIN.
5. The server stamps the record as `PRESENT` or `LATE`, depending on how far into the lecture the check-in happened.
6. When the lecturer **closes** the lecture, every enrolled student without a record is written as `ABSENT`, and notifications are dispatched.

### 4. What the server refuses

These are real backend guards, not UI hints:

- A student can only ever write attendance for **their own** user id — the id is taken from the session, never from the request body.
- A student cannot read another student's attendance.
- A student is blocked from admin-only endpoints such as audit logs and college management.
- The same student cannot check in twice to the same lecture — a unique constraint on `(lecture, student)` makes a duplicate physically impossible.
- An expired or wrong PIN is rejected, and repeated wrong attempts are logged as brute-force attempts.
- A lecturer cannot open, close or edit a lecture they do not own.
- A department admin cannot touch records outside their department.
- Attendance records cannot be silently rewritten afterwards; changes are audited.

### 5. Absence justifications

When a student is marked absent, they can attach a written justification to that specific record. The lecturer who owns the lecture reviews it and approves or rejects it. Either outcome fires a notification back to the student, and the decision is written to the audit log.

### 6. Notifications

Delivered in-app: a bell in the top bar with a live unread count, plus a full notifications page with mark-as-read.

| Event | Notification |
|-------|--------------|
| Successful check-in | Attendance confirmed |
| Marked absent when the lecture closes | Absence registered |
| Checked in after the late threshold | Late arrival |
| Absences cross the allowed limit | Absence-threshold warning |
| Justification reviewed | Approved or rejected |
| Lecturer broadcast | Announcement |

### 7. Reporting, fraud and audit

- **Reports** aggregate attendance by day, week, month or semester, rendered as charts and tables.
- **Fraud detection** records suspicious events — duplicate attendance, brute-force PIN attempts — with a severity level, and surfaces them to the Doctor and Super Admin.
- **Audit logs** record the actor, entity, action and timestamp of meaningful changes, so any record can be traced back to the person who changed it.

### 8. Exports

Reports export real CSV generated on the server from the actual attendance records, respecting the caller's role scope. Excel and PDF export are not implemented.

---

## Tech stack

**Frontend** — React with TypeScript, Tailwind CSS, React Router, Recharts for analytics.
**Backend** — Node.js, Express, TypeScript, Zod for request validation, JWT authentication with access and refresh tokens in httpOnly cookies.
**Database** — PostgreSQL with Prisma ORM and versioned migrations.
**Testing** — TypeScript compilation checks, plus Playwright end-to-end smoke tests that walk every page for every role on desktop and mobile.

---

## Data model

| Entity | Purpose |
|--------|---------|
| `User` | Every account: email, password hash, role |
| `College` | Top-level academic unit |
| `Department` | Belongs to a college |
| `Course` | Belongs to a department, carries credits |
| `LecturerProfile` | Lecturer details: employee id, department |
| `StudentProfile` | Student details: student number, department |
| `LectureSlot` | Recurring weekly schedule entry for a course |
| `LectureInstance` | A dated occurrence of a slot, with status and PIN |
| `AttendanceRecord` | One student's attendance for one lecture |
| `AbsenceJustification` | Student's written excuse for an absence, with review status |
| `Notification` | Per-user in-app message |
| `AuditLog` | Who changed what, when |
| `FraudDetectionLog` | Security event with detection type and severity |

---

## Project structure

```
attendance-system/
├── backend/                 # Express API
│   ├── prisma/              # Schema and migrations
│   └── src/
│       ├── controllers/     # Business logic and scoping rules
│       ├── middleware/      # Authentication, validation, error handling
│       ├── routes/          # Endpoint definitions
│       ├── prisma/          # Seed script
│       └── types/           # Shared TypeScript types
│
├── frontend/                # React single-page app
│   └── src/
│       ├── components/      # Layout, navigation, shared UI
│       ├── contexts/        # Auth context
│       ├── data/            # Navigation definitions per role
│       ├── lib/             # API client and helpers
│       ├── pages/           # One page per feature
│       ├── App.tsx          # Routing and role-based dashboards
│       └── main.tsx         # Entry point
│
└── package.json             # Root scripts
```

---

## API surface

| Group | Endpoints |
|-------|-----------|
| Auth | login, logout, refresh, current user |
| Academic structure | colleges, departments, courses |
| People | students, lecturers |
| Scheduling | lecture slots, lecture instances, open, close, cancel |
| Attendance | student check-in, lecturer sheet, status changes, history |
| Justifications | submit, list, approve, reject |
| Reports | daily, weekly, monthly, semester, CSV export |
| Notifications | list, mark read, recipients, announcements |
| Oversight | audit logs, fraud alerts |

---

## Running it

Prerequisites: Node.js 22+, PostgreSQL 16 (local install or a container), npm.

```bash
git clone https://github.com/alizebari320/university-attendance-system.git
cd university-attendance-system

npm install
```

Create the backend and frontend environment files:

```bash
# backend/.env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=5000

# frontend/.env
VITE_API_URL=<protocol>://<host>:<port>/api
```

Then apply the schema, seed an initial dataset and start both apps:

```bash
npm run db:setup   # runs migrations and the seed script
npm run dev        # starts the API and the frontend together
```

The seed script creates one demo account per role. Open `backend/src/prisma/seed.ts` to see which addresses and passwords it generates, then change them before using this anywhere real.

---

## Implementation status

| Area | Status | Notes |
|------|--------|-------|
| Architecture and database schema | Done | 16 tables, versioned Prisma migrations |
| Design system | Done | Dark charcoal and navy surfaces, blue and orange accents, responsive layout |
| Authentication and RBAC | Done | JWT access and refresh tokens in httpOnly cookies, five roles |
| College, department, course CRUD | Done | Full create, edit, delete, with server-side scoping |
| Lecture scheduling | Done | Slots and dated instances, open, close, cancel, PIN generation |
| Student attendance | Done | PIN check-in with duplicate and expiry enforcement |
| Lecturer confirmation | Done | Attendance sheet, status changes, ownership checks |
| Reporting | Done | Daily, weekly, monthly, semester, with charts |
| Justifications and notifications | Done | Submit and review flow, six notification types |
| Fraud detection | Done | Duplicate attendance and brute-force PIN detection with severity levels |
| Exports | CSV only | Excel and PDF are not implemented |
| Testing and deployment | Partial | TypeScript builds clean, Playwright smoke tests pass for every role. No CI pipeline and no production deployment setup |

### What has actually been verified

- TypeScript compilation is clean on both backend and frontend.
- The frontend production build succeeds.
- Playwright smoke tests cover all roles, every page, desktop and mobile, with no console or page errors.
- Security rules were checked against the running API, not just the UI: a student cannot read another student's attendance, cannot reach audit or college endpoints, a duplicate check-in is rejected, a wrong or expired PIN is rejected, a lecturer cannot operate another lecturer's lecture, reviewing a justification emits notifications, and audit and fraud records are written.

---

## License

MIT
