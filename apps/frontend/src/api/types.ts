export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  instructorId: string;
  instructorEmail: string;
  enrolledStudentEmails: string[];
  enrolledCount: number;
}

export interface Lesson {
  _id: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
}

export type CourseWithLessons = Course & { lessons: Lesson[] };

export type EnrollmentStatus = 'pending' | 'active' | 'failed';

export interface Enrollment {
  id: string;
  userId: string;
  userEmail: string;
  courseId: string;
  status: EnrollmentStatus;
  createdAt: string;
}

export interface NotificationEntry {
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  attempts: number;
  error?: string;
  lectureId: string;
  courseTitle: string;
  timestamp: string;
}
