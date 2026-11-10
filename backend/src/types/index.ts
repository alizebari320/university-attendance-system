export type UserRole = 'SUPER_ADMIN' | 'DOCTOR' | 'DEPARTMENT_ADMIN' | 'LECTURER' | 'STUDENT';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export type LectureStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED';

export type JustificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type NotificationType = 
  | 'ATTENDANCE_CONFIRMATION'
  | 'ABSENCE_REGISTRATION'
  | 'LATE_ARRIVAL'
  | 'ABSENCE_THRESHOLD_WARNING'
  | 'APPROVED_JUSTIFICATION'
  | 'REJECTED_JUSTIFICATION'
  | 'LECTURER_ANNOUNCEMENT';

export type AuditAction = 
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'LOGIN'
  | 'LOGOUT'
  | 'ATTENDANCE_SUBMIT'
  | 'ATTENDANCE_MODIFY'
  | 'PIN_GENERATE'
  | 'PIN_VERIFY'
  | 'PIN_EXPIRE'
  | 'LECTURE_OPEN'
  | 'LECTURE_CLOSE'
  | 'LECTURE_CANCEL'
  | 'JUSTIFICATION_APPROVE'
  | 'JUSTIFICATION_REJECT'
  | 'USER_ROLE_CHANGE'
  | 'USER_STATUS_CHANGE';

export type FraudDetectionType = 
  | 'DUPLICATE_ATTENDANCE'
  | 'FOREIGN_STUDENT_ATTENDANCE'
  | 'EXPIRED_PIN_USED'
  | 'BRUTE_FORCE_PIN'
  | 'LATE_CHECKIN'
  | 'CANCELLED_LECTURE_ATTENDANCE'
  | 'SUSPICIOUS_IP'
  | 'INVALID_CHECKIN';

export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuthenticatedRequest {
  user: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
  ipAddress: string;
  userAgent: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}