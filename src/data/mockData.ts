export type Role = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  role: Role;
  class?: string;
  rollNumber?: string;
  guardianName?: string;
  guardianPhone?: string;
  username: string;
  teacherId?: string;
  photoUrl?: string;
}

export interface Note {
  id: string;
  class: string;
  subject: string;
  chapter: string;
  filename: string;
  description?: string;
  date: string;
  teacherId: string;
  hasFile?: boolean;
  storagePath?: string;
}

export interface ExamResult {
  id: string;
  studentId: string;
  examName: string;
  marksObtained: number;
  totalMarks: number;
  remarks: string;
  date: string;
  teacherId: string;
  subject: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  classScope: string;
  date: string;
  timeAgo: string;
  teacherId: string;
  attachmentPath?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  deliveryStatus?: 'sending' | 'sent' | 'failed';
  attachmentPath?: string | null;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
}

export interface Conversation {
  studentId: string;
  messages: Message[];
}

export interface Notification {
  id: string;
  studentId: string;
  type: 'notes' | 'result' | 'announcement' | 'message';
  message: string;
  read: boolean;
  date: string;
}

export interface LibraryNote {
  id: string;
  teacherId: string;
  subject: string;
  chapter: string;
  filename: string;
  description?: string;
  date: string;
  storagePath?: string;
}

export type ActivityType =
  | 'student_registered'
  | 'notes_uploaded'
  | 'result_published'
  | 'announcement_posted'
  | 'message_sent'
  | 'password_reset';

export interface ActivityItem {
  id: string;
  teacherId: string;
  type: ActivityType;
  description: string;
  date: string;
}
