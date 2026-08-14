import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { createIsolatedSupabaseClient, supabase } from '@/lib/supabase';
import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_BYTES,
  buildStoragePath,
  normalizeAvatarStoragePath,
  validateUploadFile,
} from '@/lib/fileUpload';
import {
  type ActivityItem,
  type ActivityType,
  type Announcement,
  type Conversation,
  type ExamResult,
  type LibraryNote,
  type Note,
  type Notification,
  type Role,
  type User,
} from '../data/mockData';

type AnnouncementInput = Omit<
  Announcement,
  'id' | 'date' | 'timeAgo'
> & {
  attachmentFile?: File;
  attachmentName?: string | null;
  attachmentMimeType?: string | null;
  attachmentSize?: number | null;
  attachmentPath?: string | null;
};

interface AuthContextType {
  currentUser: User | null;
  teacherProfile: User | null;
  loading: boolean;
  login: (
    username: string,
    password: string,
    role: Role,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerTeacher: (
    name: string,
    username: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  changePassword: (
    oldPassword: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  resetStudentPassword: (
    studentId: string,
    newPassword: string,
  ) => Promise<{ success: boolean; error?: string }>;
  updateUserPhoto: (
    userId: string,
    file: File,
  ) => Promise<{ success: boolean; error?: string }>;
  students: User[];
  addStudent: (
    student: Omit<User, 'id' | 'role'> & { password: string },
  ) => Promise<{ success: boolean; error?: string }>;
  removeStudent: (studentId: string) => Promise<void>;
  updateStudent: (
    studentId: string,
    updates: Partial<User>,
  ) => Promise<void>;
  notes: Note[];
  addNote: (
    note: Omit<Note, 'id' | 'date' | 'hasFile' | 'storagePath'> & {
      file?: File;
    },
  ) => Promise<void>;
  getSignedNoteUrl: (storagePath: string) => Promise<string | null>;
  results: ExamResult[];
  addResult: (result: Omit<ExamResult, 'id' | 'date'>) => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (announcement: AnnouncementInput) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;
  conversations: Conversation[];
  sendMessage: (
    studentId: string,
    senderId: string,
    text: string,
    file?: File,
  ) => Promise<void>;
  notifications: Notification[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: (studentId: string) => Promise<void>;
  library: LibraryNote[];
  addToLibrary: (
    note: Omit<LibraryNote, 'id' | 'date'> & { file?: File },
  ) => Promise<void>;
  removeFromLibrary: (id: string) => Promise<void>;
  getLibraryForTeacher: (teacherId: string) => LibraryNote[];
  activityLog: ActivityItem[];
  getStudentsForTeacher: (teacherId: string) => User[];
  getNotesForStudent: (student: User) => Note[];
  getResultsForStudent: (studentId: string) => ExamResult[];
  getNotificationsForStudent: (studentId: string) => Notification[];
  getNotificationsUnreadCount: (studentId: string) => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_PUBLIC_SELECT =
  'id, name, username, role, class, roll_number, teacher_id, photo_url';
const PROFILE_PRIVATE_SELECT =
  'id, name, username, role, class, roll_number, guardian_name, guardian_phone, teacher_id, photo_url';

const toEmail = (username: string) =>
  `${username.trim().toLowerCase()}@taskmate.app`;

function asRecord(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as Role,
    username: row.username as string,
    class: (row.class as string) ?? undefined,
    rollNumber: (row.roll_number as string) ?? undefined,
    guardianName: (row.guardian_name as string) ?? undefined,
    guardianPhone: (row.guardian_phone as string) ?? undefined,
    teacherId: (row.teacher_id as string) ?? undefined,
    photoUrl: (row.photo_url as string) ?? undefined,
  };
}

function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string,
    class: row.class as string,
    subject: row.subject as string,
    chapter: row.chapter as string,
    filename: row.filename as string,
    description: (row.description as string) ?? undefined,
    date: (row.date as string) ?? (row.created_at as string),
    teacherId: row.teacher_id as string,
    hasFile: Boolean(row.storage_path),
    storagePath: (row.storage_path as string) ?? undefined,
  };
}

function rowToResult(row: Record<string, unknown>): ExamResult {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    examName: row.exam_name as string,
    subject: row.subject as string,
    marksObtained: Number(row.marks_obtained),
    totalMarks: Number(row.total_marks),
    remarks: (row.remarks as string) ?? '',
    date: (row.date as string) ?? (row.created_at as string),
    teacherId: row.teacher_id as string,
  };
}

function rowToAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    title: row.title as string,
    content: row.content as string,
    classScope: row.class_scope as string,
    date: (row.date as string) ?? (row.created_at as string),
    timeAgo: '',
    teacherId: row.teacher_id as string,
    attachmentPath: (row.attachment_path as string | null) ?? undefined,
    attachmentName: (row.attachment_name as string | null) ?? undefined,
    attachmentMimeType:
      (row.attachment_mime_type as string | null) ?? undefined,
    attachmentSize: (row.attachment_size as number | null) ?? undefined,
  };
}

function rowToLibrary(row: Record<string, unknown>): LibraryNote {
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    subject: row.subject as string,
    chapter: row.chapter as string,
    filename: row.filename as string,
    description: (row.description as string) ?? undefined,
    date: (row.date as string) ?? (row.created_at as string),
    storagePath: (row.storage_path as string) ?? undefined,
  };
}

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    type: row.type as Notification['type'],
    message: row.message as string,
    read: Boolean(row.read),
    date: (row.date as string) ?? (row.created_at as string),
  };
}

function rowToActivity(row: Record<string, unknown>): ActivityItem {
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    type: row.type as ActivityType,
    description: row.description as string,
    date: (row.date as string) ?? (row.created_at as string),
  };
}

function storageTarget(storagePath: string): {
  bucket: 'notes' | 'announcements' | 'library' | 'avatars' | 'message_files';
  path: string;
} {
  const normalized = storagePath.replace(/^\/+/, '');
  const parts = normalized.split('/').filter(Boolean);
  const first = parts[0];

  if (
    first === 'notes' ||
    first === 'announcements' ||
    first === 'library' ||
    first === 'avatars' ||
    first === 'message_files'
  ) {
    return {
      bucket: first,
      path: parts.slice(1).join('/'),
    };
  }

  return { bucket: 'notes', path: normalized };
}

function messageFromRow(row: Record<string, unknown>) {
  const createdAt = row.created_at as string;

  return {
    id: row.id as string,
    senderId: row.sender_id as string,
    text: row.text as string,
    timestamp: new Date(createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    createdAt,
    deliveryStatus: 'sent' as const,
    attachmentPath: (row.attachment_path as string | null) ?? undefined,
    attachmentName: (row.attachment_name as string | null) ?? undefined,
    attachmentMimeType: (row.attachment_mime_type as string | null) ?? undefined,
    attachmentSize: (row.attachment_size as number | null) ?? undefined,
  };
}

function sortConversations(conversations: Conversation[]) {
  return [...conversations].sort((a, b) => {
    const aLast = a.messages[a.messages.length - 1];
    const bLast = b.messages[b.messages.length - 1];

    if (!aLast && !bLast) return 0;
    if (!aLast) return 1;
    if (!bLast) return -1;

    return (
      new Date(bLast.createdAt ?? 0).getTime() -
      new Date(aLast.createdAt ?? 0).getTime()
    );
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadVersionRef = useRef(0);
  const [students, setStudents] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [library, setLibrary] = useState<LibraryNote[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);

  const loadConversations = useCallback(
    async (userId: string, role: 'teacher' | 'student') => {
      const response =
        role === 'teacher'
          ? await supabase
              .from('conversations')
              .select('*, messages(*)')
              .eq('teacher_id', userId)
          : await supabase
              .from('conversations')
              .select('*, messages(*)')
              .eq('student_id', userId);

      if (response.error || !response.data) return;

      const mapped = response.data.map((rawConversation) => {
        const conversation = asRecord(rawConversation);
        const rawMessages = Array.isArray(conversation.messages)
          ? (conversation.messages as Record<string, unknown>[])
          : [];

        const messages = rawMessages
          .sort(
            (a, b) =>
              new Date(a.created_at as string).getTime() -
              new Date(b.created_at as string).getTime(),
          )
          .map(messageFromRow);

        return {
          studentId: conversation.student_id as string,
          messages,
        };
      });

      setConversations(sortConversations(mapped));
    },
    [],
  );

  const loadTeacherData = useCallback(
    async (teacherId: string) => {
      const [
        studentsResponse,
        notesResponse,
        resultsResponse,
        announcementsResponse,
        libraryResponse,
        activityResponse,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(PROFILE_PUBLIC_SELECT)
          .eq('teacher_id', teacherId)
          .eq('role', 'student'),
        supabase
          .from('notes')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('results')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('library')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('activity_log')
          .select('*')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      if (studentsResponse.data) {
        setStudents(studentsResponse.data.map((row) => rowToUser(asRecord(row))));
      }
      if (notesResponse.data) {
        setNotes(notesResponse.data.map((row) => rowToNote(asRecord(row))));
      }
      if (resultsResponse.data) {
        setResults(resultsResponse.data.map((row) => rowToResult(asRecord(row))));
      }
      if (announcementsResponse.data) {
        setAnnouncements(
          announcementsResponse.data.map((row) =>
            rowToAnnouncement(asRecord(row)),
          ),
        );
      }
      if (libraryResponse.data) {
        setLibrary(libraryResponse.data.map((row) => rowToLibrary(asRecord(row))));
      }
      if (activityResponse.data) {
        setActivityLog(
          activityResponse.data.map((row) => rowToActivity(asRecord(row))),
        );
      }

      await loadConversations(teacherId, 'teacher');
    },
    [loadConversations],
  );

  const loadStudentData = useCallback(
    async (student: User) => {
      if (!student.teacherId || !student.class) return;

      const [
        notesResponse,
        resultsResponse,
        announcementsResponse,
        notificationsResponse,
        teacherResponse,
        libraryResponse,
        classmatesResponse,
      ] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('teacher_id', student.teacherId)
          .eq('class', student.class)
          .order('created_at', { ascending: false }),
        supabase
          .from('results')
          .select('*')
          .eq('teacher_id', student.teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('announcements')
          .select('*')
          .eq('teacher_id', student.teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('notifications')
          .select('*')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select(PROFILE_PUBLIC_SELECT)
          .eq('id', student.teacherId)
          .maybeSingle(),
        supabase
          .from('library')
          .select('*')
          .eq('teacher_id', student.teacherId)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select(PROFILE_PUBLIC_SELECT)
          .eq('teacher_id', student.teacherId)
          .eq('class', student.class)
          .eq('role', 'student'),
      ]);

      if (teacherResponse.data) {
        setTeacherProfile(rowToUser(asRecord(teacherResponse.data)));
      }
      if (notesResponse.data) {
        setNotes(notesResponse.data.map((row) => rowToNote(asRecord(row))));
      }
      if (resultsResponse.data) {
        setResults(resultsResponse.data.map((row) => rowToResult(asRecord(row))));
      }
      if (announcementsResponse.data) {
        setAnnouncements(
          announcementsResponse.data
            .filter((row) => {
              const item = asRecord(row);
              return (
                item.class_scope === 'All Classes' ||
                item.class_scope === student.class
              );
            })
            .map((row) => rowToAnnouncement(asRecord(row))),
        );
      }
      if (notificationsResponse.data) {
        setNotifications(
          notificationsResponse.data.map((row) =>
            rowToNotification(asRecord(row)),
          ),
        );
      }
      if (libraryResponse.data) {
        setLibrary(libraryResponse.data.map((row) => rowToLibrary(asRecord(row))));
      }
      if (classmatesResponse.data) {
        const classmates = classmatesResponse.data.map((row) =>
          rowToUser(asRecord(row)),
        );
        const classmateIds = new Set(classmates.map(c => c.id));
        const merged = classmateIds.has(student.id)
          ? classmates
          : [student, ...classmates];
        setStudents(merged);
      }

      await loadConversations(student.id, 'student');
    },
    [loadConversations],
  );

  useEffect(() => {
    let mounted = true;
    let loadTimeoutId: ReturnType<typeof setTimeout> | null = null;

    const handleSession = async (session: Session) => {
      const generation = ++loadVersionRef.current;
      const { data: profile } = await supabase
        .from('profiles')
        .select(PROFILE_PRIVATE_SELECT)
        .eq('id', session.user.id)
        .maybeSingle();

      if (!mounted || generation !== loadVersionRef.current) return;

      if (!profile) {
        setLoading(false);
        return;
      }

      const user = rowToUser(asRecord(profile));
      setCurrentUser(user);
      setTeacherProfile((previous) => (previous?.id === user.id ? previous : previous));

      if (mounted) setLoading(false);

      loadTimeoutId = setTimeout(async () => {
        if (!mounted || generation !== loadVersionRef.current) return;
        if (user.role === 'teacher') {
          await loadTeacherData(user.id);
        } else if (user.teacherId && user.class) {
          await loadStudentData(user);
        }
      }, 500);
    };

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void handleSession(session);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      loadVersionRef.current += 1;
      if (session?.user) {
        void handleSession(session);
      } else {
        setCurrentUser(null);
        setTeacherProfile(null);
        setStudents([]);
        setNotes([]);
        setResults([]);
        setAnnouncements([]);
        setConversations([]);
        setNotifications([]);
        setLibrary([]);
        setActivityLog([]);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (loadTimeoutId) clearTimeout(loadTimeoutId);
    };
  }, [loadStudentData, loadTeacherData]);

  useEffect(() => {
    if (!currentUser) return;

    const userId = currentUser.id;
    const role = currentUser.role;
    let messageLoadTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let notificationChannel: ReturnType<typeof supabase.channel> | null = null;

    const messageChannel = supabase
      .channel(`messages-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          // Debounce conversation reload to prevent excessive updates
          if (messageLoadTimeoutId) clearTimeout(messageLoadTimeoutId);
          messageLoadTimeoutId = setTimeout(() => {
            void loadConversations(userId, role);
          }, 300);
        },
      )
      .subscribe();

    if (role === 'student') {
      notificationChannel = supabase
        .channel(`notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `student_id=eq.${userId}`,
          },
          (payload) => {
            const notification = rowToNotification(asRecord(payload.new));
            setNotifications((previous) =>
              previous.some((item) => item.id === notification.id)
                ? previous
                : [notification, ...previous],
            );
          },
        )
        .subscribe();
    }

    return () => {
      if (messageLoadTimeoutId) clearTimeout(messageLoadTimeoutId);
      void messageChannel.unsubscribe();
      if (notificationChannel) void notificationChannel.unsubscribe();
    };
  }, [currentUser?.id, currentUser?.role, loadConversations]);

  const logActivity = async (
    teacherId: string,
    type: ActivityType,
    description: string,
  ) => {
    const { data } = await supabase
      .from('activity_log')
      .insert({ teacher_id: teacherId, type, description })
      .select()
      .single();

    if (data) {
      setActivityLog((previous) => [
        rowToActivity(asRecord(data)),
        ...previous,
      ].slice(0, 50));
    }
  };

  const login = async (
    username: string,
    password: string,
    role: Role,
  ) => {
    const normalizedUsername = username.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({
      email: toEmail(normalizedUsername),
      password,
    });

    if (error) {
      return { success: false, error: 'Incorrect username or password.' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (profile && asRecord(profile).role !== role) {
      await supabase.auth.signOut();
      return {
        success: false,
        error: `This account is registered as ${String(
          asRecord(profile).role,
        )}, not a ${role}.`,
      };
    }

    return { success: true };
  };

  const logout = async () => {
    setCurrentUser(null);
    setTeacherProfile(null);
    setStudents([]);
    setNotes([]);
    setResults([]);
    setAnnouncements([]);
    setConversations([]);
    setNotifications([]);
    setLibrary([]);
    setActivityLog([]);
    loadVersionRef.current += 1;
    await supabase.auth.signOut();
  };

  const registerTeacher = async (
    name: string,
    username: string,
    password: string,
  ) => {
    const normalizedUsername = username.trim().toLowerCase();
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        error: 'This username is already taken. Please choose another.',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email: toEmail(normalizedUsername),
      password,
    });

    if (error || !data.user) {
      return {
        success: false,
        error: error?.message ?? 'Could not create account.',
      };
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name: name.trim(),
      username: normalizedUsername,
      role: 'teacher',
    });

    if (profileError) {
      return { success: false, error: profileError.message };
    }

    return { success: true };
  };

  const changePassword = async (
    oldPassword: string,
    newPassword: string,
  ) => {
    if (!currentUser) return { success: false, error: 'Not logged in.' };
    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'New password must be at least 8 characters.',
      };
    }

    const { error: verifyError } =
      await supabase.auth.signInWithPassword({
        email: toEmail(currentUser.username),
        password: oldPassword,
      });

    if (verifyError) {
      return { success: false, error: 'Current password is incorrect.' };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return error
      ? { success: false, error: error.message }
      : { success: true };
  };

  const resetStudentPassword = async (
    studentId: string,
    newPassword: string,
  ) => {
    if (!currentUser || currentUser.role !== 'teacher') {
      return { success: false, error: 'Only teachers can reset student passwords.' };
    }
    if (newPassword.length < 8) {
      return { success: false, error: 'Password must be at least 8 characters.' };
    }
    const assignedStudent = students.some(
      (student) => student.id === studentId && student.teacherId === currentUser.id,
    );
    if (!assignedStudent) {
      return { success: false, error: 'This student is not assigned to you.' };
    }

    const { error } = await supabase.rpc('reset_student_password', {
      student_id: studentId,
      new_password: newPassword,
    });

    if (!error) {
      await logActivity(currentUser.id, 'password_reset', 'Reset a student password');
    }

    return error
      ? { success: false, error: error.message }
      : { success: true };
  };

  const updateUserPhoto = async (userId: string, file: File) => {
    if (!currentUser) return { success: false, error: 'You are not signed in.' };

    const authenticatedUserId = currentUser.id;
    if (userId !== authenticatedUserId) {
      return { success: false, error: 'You can only update your own profile photo.' };
    }

    const validation = validateUploadFile(file, {
      allowedMimeTypes: AVATAR_ALLOWED_MIME_TYPES,
      maxBytes: AVATAR_MAX_BYTES,
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const oldPath = normalizeAvatarStoragePath(currentUser.photoUrl ?? teacherProfile?.photoUrl ?? null);
    const nextPath = buildStoragePath(`avatars/${authenticatedUserId}`, file);
    const durablePath = `avatars/${nextPath}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(nextPath, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        return { success: false, error: 'Photo upload failed. Please try again.' };
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ photo_url: durablePath })
        .eq('id', authenticatedUserId);

      if (profileError) {
        await supabase.storage.from('avatars').remove([nextPath]);
        return {
          success: false,
          error: 'Could not save the photo to your profile.',
        };
      }

      const normalizedValue = normalizeAvatarStoragePath(durablePath);
      const updatedPhotoUrl = normalizedValue ?? durablePath;

      setCurrentUser((previous) =>
        previous?.id === authenticatedUserId
          ? { ...previous, photoUrl: updatedPhotoUrl }
          : previous,
      );
      setTeacherProfile((previous) =>
        previous?.id === authenticatedUserId
          ? { ...previous, photoUrl: updatedPhotoUrl }
          : previous,
      );
      setStudents((previous) =>
        previous.map((student) =>
          student.id === authenticatedUserId
            ? { ...student, photoUrl: updatedPhotoUrl }
            : student,
        ),
      );

      if (oldPath) {
        const { error: cleanupError } = await supabase.storage
          .from('avatars')
          .remove([oldPath]);

        if (cleanupError) {
          console.warn('Avatar cleanup failed after profile update.', cleanupError);
        }
      }

      return { success: true };
    } catch (error) {
      await supabase.storage.from('avatars').remove([nextPath]);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Photo upload failed. Please try again.',
      };
    }
  };

  const addStudent = async (
    student: Omit<User, 'id' | 'role'> & { password: string },
  ) => {
    if (!currentUser || currentUser.role !== 'teacher') {
      return { success: false, error: 'Only a teacher can create a student account.' };
    }

    const normalizedUsername = student.username.trim().toLowerCase();
    const safeName = student.name.trim();
    const safeClass = student.class?.trim() ?? '';
    const normalizedRoll = student.rollNumber?.trim() ?? '';
    const guardianName = student.guardianName?.trim() ?? '';
    const guardianPhone = student.guardianPhone?.trim() ?? '';

    if (!safeName || !normalizedUsername || !safeClass || !student.password.trim()) {
      return { success: false, error: 'Please complete all required student fields.' };
    }
    if (student.password.length < 8) {
      return { success: false, error: 'Student password must be at least 8 characters.' };
    }

    const teacherSessionBefore = await supabase.auth.getSession();
    if (!teacherSessionBefore.data.session || teacherSessionBefore.data.session.user.id !== currentUser.id) {
      return { success: false, error: 'Teacher session is no longer active.' };
    }

    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', normalizedUsername)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'This username is already taken.' };
    }

    const isolatedClient = createIsolatedSupabaseClient();
    const { data: authData, error: signUpError } = await isolatedClient.auth.signUp({
      email: toEmail(normalizedUsername),
      password: student.password,
    });

    if (signUpError || !authData.user) {
      return {
        success: false,
        error: signUpError?.message ?? 'Could not create student account.',
      };
    }

    const { error: rpcError } = await supabase.rpc('create_student_profile', {
      p_student_id: authData.user.id,
      p_name: safeName,
      p_username: normalizedUsername,
      p_class: safeClass,
      p_roll_number: normalizedRoll || null,
      p_guardian_name: guardianName || null,
      p_guardian_phone: guardianPhone || null,
    });

    if (rpcError) {
      return {
        success: false,
        error: `Student account creation did not complete: ${rpcError.message}. The Auth user may need manual cleanup in Supabase.`,
      };
    }

    const teacherSessionAfter = await supabase.auth.getSession();
    if (!teacherSessionAfter.data.session || teacherSessionAfter.data.session.user.id !== currentUser.id) {
      return {
        success: false,
        error: 'The teacher session changed during registration. Please sign back in and retry.',
      };
    }

    const newStudent: User = {
      id: authData.user.id,
      name: safeName,
      username: normalizedUsername,
      role: 'student',
      class: safeClass,
      rollNumber: normalizedRoll || undefined,
      guardianName: guardianName || undefined,
      guardianPhone: guardianPhone || undefined,
      teacherId: currentUser.id,
    };

    setStudents((previous) => [...previous, newStudent]);

    await logActivity(currentUser.id, 'student_registered', `Registered ${safeName}`);

    return { success: true };
  };

  const removeStudent = async (studentId: string) => {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', studentId);

    if (error) throw new Error('Could not remove the student.');
    setStudents((previous) =>
      previous.filter((student) => student.id !== studentId),
    );
  };

  const updateStudent = async (
    studentId: string,
    updates: Partial<User>,
  ) => {
    const databaseUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) databaseUpdates.name = updates.name;
    if (updates.class !== undefined) databaseUpdates.class = updates.class;
    if (updates.rollNumber !== undefined) {
      databaseUpdates.roll_number = updates.rollNumber;
    }
    if (updates.guardianName !== undefined) {
      databaseUpdates.guardian_name = updates.guardianName;
    }
    if (updates.guardianPhone !== undefined) {
      databaseUpdates.guardian_phone = updates.guardianPhone;
    }
    if (updates.photoUrl !== undefined) {
      databaseUpdates.photo_url = updates.photoUrl;
    }

    const { error } = await supabase
      .from('profiles')
      .update(databaseUpdates)
      .eq('id', studentId);

    if (error) throw new Error('Could not update the student.');

    setStudents((previous) =>
      previous.map((student) =>
        student.id === studentId ? { ...student, ...updates } : student,
      ),
    );
    setCurrentUser((previous) =>
      previous?.id === studentId ? { ...previous, ...updates } : previous,
    );
  };

  const addNote = async (
    note: Omit<Note, 'id' | 'date' | 'hasFile' | 'storagePath'> & {
      file?: File;
    },
  ) => {
    if (!currentUser) throw new Error('You are not logged in.');

    let storagePath: string | null = null;

    if (note.file) {
      const validation = validateUploadFile(note.file, {
        allowedMimeTypes: [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/jpg',
        ],
        maxBytes: 10 * 1024 * 1024,
      });

      if (!validation.valid) throw new Error(validation.error);

      storagePath = buildStoragePath(`notes/${currentUser.id}`, note.file);
      const { error: uploadError } = await supabase.storage
        .from('notes')
        .upload(storagePath, note.file, {
          contentType: note.file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        throw new Error('The note file could not be uploaded.');
      }
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        teacher_id: note.teacherId,
        class: note.class,
        subject: note.subject,
        chapter: note.chapter,
        filename: note.filename,
        description: note.description ?? null,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (error || !data) {
      if (storagePath) {
        await supabase.storage.from('notes').remove([storagePath]);
      }
      throw new Error('The note could not be saved.');
    }

    const newNote = rowToNote(asRecord(data));
    setNotes((previous) => [newNote, ...previous]);

    const targets = students.filter(
      (student) =>
        student.class === note.class &&
        student.teacherId === note.teacherId,
    );

    if (targets.length > 0) {
      await supabase.from('notifications').insert(
        targets.map((student) => ({
          student_id: student.id,
          type: 'notes',
          message: `New notes: ${note.filename} for ${note.chapter} (${note.subject})`,
        })),
      );
    }

    await logActivity(
      note.teacherId,
      'notes_uploaded',
      `Uploaded ${note.filename} for ${note.class}`,
    );
  };

  const getSignedNoteUrl = useCallback(async (path: string) => {
    const target = storageTarget(path);
    const { data, error } = await supabase.storage
      .from(target.bucket)
      .createSignedUrl(target.path, 3600);

    return error || !data?.signedUrl ? null : data.signedUrl;
  }, []);

  const addResult = async (
    result: Omit<ExamResult, 'id' | 'date'>,
  ) => {
    if (!currentUser) throw new Error('You are not logged in.');
    if (
      result.totalMarks <= 0 ||
      result.marksObtained < 0 ||
      result.marksObtained > result.totalMarks
    ) {
      throw new Error('Please enter valid marks.');
    }

    const student = students.find(
      (item) =>
        item.id === result.studentId &&
        item.teacherId === result.teacherId,
    );

    if (!student) throw new Error('This student is not assigned to you.');

    const { data, error } = await supabase
      .from('results')
      .insert({
        teacher_id: result.teacherId,
        student_id: result.studentId,
        exam_name: result.examName,
        subject: result.subject,
        marks_obtained: result.marksObtained,
        total_marks: result.totalMarks,
        remarks: result.remarks ?? '',
      })
      .select()
      .single();

    if (error || !data) throw new Error('The result could not be saved.');

    setResults((previous) => [rowToResult(asRecord(data)), ...previous]);

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        student_id: result.studentId,
        type: 'result',
        message: `New result published: ${result.examName}`,
      });

    if (notificationError) {
      throw new Error(
        'The result was saved, but the student notification could not be created.',
      );
    }

    await logActivity(
      result.teacherId,
      'result_published',
      `Published ${result.examName} for ${student.name}`,
    );
  };

  const addAnnouncement = async (
    announcement: AnnouncementInput,
  ) => {
    let storagePath: string | null = null;
    let uploadedPath: string | null = null;
    let attachmentName = announcement.attachmentName ?? null;
    let attachmentMimeType = announcement.attachmentMimeType ?? null;
    let attachmentSize = announcement.attachmentSize ?? null;

    if (announcement.attachmentFile) {
      const validation = validateUploadFile(
        announcement.attachmentFile,
        {
          allowedMimeTypes: [
            'application/pdf',
            'image/png',
            'image/jpeg',
            'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ],
          maxBytes: 10 * 1024 * 1024,
        },
      );

      if (!validation.valid) throw new Error(validation.error);

      uploadedPath = buildStoragePath(
        `announcements/${announcement.teacherId}`,
        announcement.attachmentFile,
      );

      const { error: uploadError } = await supabase.storage
        .from('announcements')
        .upload(uploadedPath, announcement.attachmentFile, {
          contentType:
            announcement.attachmentFile.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        throw new Error('The announcement attachment could not be uploaded.');
      }

      storagePath = `announcements/${uploadedPath}`;
      attachmentName = announcement.attachmentFile.name;
      attachmentMimeType = announcement.attachmentFile.type || null;
      attachmentSize = announcement.attachmentFile.size;
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert({
        teacher_id: announcement.teacherId,
        title: announcement.title,
        content: announcement.content,
        class_scope: announcement.classScope,
        attachment_path: storagePath,
        attachment_name: attachmentName,
        attachment_mime_type: attachmentMimeType,
        attachment_size: attachmentSize,
      })
      .select()
      .single();

    if (error || !data) {
      if (uploadedPath) {
        await supabase.storage.from('announcements').remove([uploadedPath]);
      }
      throw new Error('The announcement could not be saved.');
    }

    setAnnouncements((previous) => [
      rowToAnnouncement(asRecord(data)),
      ...previous,
    ]);

    const targets = students.filter(
      (student) =>
        student.teacherId === announcement.teacherId &&
        (announcement.classScope === 'All Classes' ||
          student.class === announcement.classScope),
    );

    if (targets.length > 0) {
      await supabase.from('notifications').insert(
        targets.map((student) => ({
          student_id: student.id,
          type: 'announcement',
          message: `New announcement: ${announcement.title}`,
        })),
      );
    }

    await logActivity(
      announcement.teacherId,
      'announcement_posted',
      `Posted "${announcement.title}"`,
    );
  };

  const removeAnnouncement = async (id: string) => {
    const item = announcements.find((announcement) => announcement.id === id);
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) throw new Error('The announcement could not be removed.');

    if (item?.attachmentPath) {
      const target = storageTarget(item.attachmentPath);
      await supabase.storage.from(target.bucket).remove([target.path]);
    }

    setAnnouncements((previous) =>
      previous.filter((announcement) => announcement.id !== id),
    );
  };

  const sendMessage = async (
    studentId: string,
    senderId: string,
    text: string,
    file?: File,
  ) => {
    if (!currentUser) throw new Error('You are not logged in.');

    const cleanText = text.trim();
    if (!cleanText && !file) throw new Error('Message cannot be empty.');
    if (senderId !== currentUser.id) {
      throw new Error('You cannot send a message as another user.');
    }

    const teacherId =
      currentUser.role === 'teacher'
        ? currentUser.id
        : currentUser.teacherId;

    if (!teacherId) {
      throw new Error('No teacher is assigned to this account.');
    }

    if (
      currentUser.role === 'student' &&
      studentId !== currentUser.id
    ) {
      throw new Error('Students can only use their own conversation.');
    }

    if (currentUser.role === 'teacher') {
      const assigned = students.some(
        (student) =>
          student.id === studentId &&
          student.teacherId === teacherId,
      );

      if (!assigned) {
        throw new Error('This student is not assigned to you.');
      }
    }

    const lookup = await supabase
      .from('conversations')
      .select('id')
      .eq('teacher_id', teacherId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (lookup.error) {
      throw new Error('The conversation could not be loaded.');
    }

    let conversationId = asRecord(lookup.data).id as string | undefined;

    if (!conversationId) {
      const created = await supabase
        .from('conversations')
        .insert({
          teacher_id: teacherId,
          student_id: studentId,
        })
        .select('id')
        .single();

      if (created.error || !created.data) {
        const retry = await supabase
          .from('conversations')
          .select('id')
          .eq('teacher_id', teacherId)
          .eq('student_id', studentId)
          .maybeSingle();

        conversationId = asRecord(retry.data).id as string | undefined;
      } else {
        conversationId = asRecord(created.data).id as string;
      }
    }

    if (!conversationId) {
      throw new Error('The conversation could not be created.');
    }

    // Handle file upload if provided
    let attachmentPath: string | null = null;
    let attachmentName: string | null = null;
    let attachmentMimeType: string | null = null;
    let attachmentSize: number | null = null;

    if (file) {
      const validation = validateUploadFile(file, {
        allowedMimeTypes: [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        maxBytes: 20 * 1024 * 1024,
      });

      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const path = buildStoragePath(`message_files/${senderId}`, file);
      const uploadResult = await supabase.storage
        .from('message_files')
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadResult.error) {
        throw new Error('File upload failed. Please try again.');
      }

      attachmentPath = path;
      attachmentName = file.name;
      attachmentMimeType = file.type;
      attachmentSize = file.size;
    }

    const messageResponse = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        text: cleanText,
        attachment_path: attachmentPath,
        attachment_name: attachmentName,
        attachment_mime_type: attachmentMimeType,
        attachment_size: attachmentSize,
      })
      .select()
      .single();

    if (messageResponse.error || !messageResponse.data) {
      if (attachmentPath) {
        await supabase.storage.from('message_files').remove([attachmentPath]);
      }
      throw new Error('The message could not be sent. Please try again.');
    }

    const message = messageFromRow(asRecord(messageResponse.data));

    setConversations((previous) => {
      const index = previous.findIndex(
        (conversation) => conversation.studentId === studentId,
      );

      if (index === -1) {
        return sortConversations([
          { studentId, messages: [message] },
          ...previous,
        ]);
      }

      const updated = [...previous];
      updated[index] = {
        ...updated[index],
        messages: [...updated[index].messages, message],
      };

      return sortConversations(updated);
    });

    if (currentUser.role === 'teacher') {
      await supabase.from('notifications').insert({
        student_id: studentId,
        type: 'message',
        message: 'New message from your teacher',
      });

      await logActivity(
        senderId,
        'message_sent',
        'Sent message to a student',
      );
    }
  };

  const markNotificationRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) throw new Error('The notification could not be updated.');

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === id
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  const markAllNotificationsRead = async (studentId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('student_id', studentId);

    if (error) throw new Error('The notifications could not be updated.');

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.studentId === studentId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  };

  const addToLibrary = async (
    note: Omit<LibraryNote, 'id' | 'date'> & { file?: File },
  ) => {
    if (!currentUser) throw new Error('You are not logged in.');

    let storagePath: string | null = null;

    if (note.file) {
      const validation = validateUploadFile(note.file, {
        allowedMimeTypes: [
          'application/pdf',
          'image/png',
          'image/jpeg',
          'image/jpg',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
        maxBytes: 10 * 1024 * 1024,
      });

      if (!validation.valid) throw new Error(validation.error);

      storagePath = buildStoragePath(`library/${currentUser.id}`, note.file);
      const { error: uploadError } = await supabase.storage
        .from('library')
        .upload(storagePath, note.file, {
          contentType: note.file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        throw new Error('The library file could not be uploaded.');
      }
    }

    const databasePath = storagePath
      ? `library/${storagePath}`
      : null;

    const { data, error } = await supabase
      .from('library')
      .insert({
        teacher_id: note.teacherId,
        subject: note.subject,
        chapter: note.chapter,
        filename: note.filename,
        description: note.description ?? null,
        storage_path: databasePath,
      })
      .select()
      .single();

    if (error || !data) {
      if (storagePath) {
        await supabase.storage.from('library').remove([storagePath]);
      }
      throw new Error('The library item could not be saved.');
    }

    setLibrary((previous) => [
      rowToLibrary(asRecord(data)),
      ...previous,
    ]);
  };

  const removeFromLibrary = async (id: string) => {
    const item = library.find((libraryItem) => libraryItem.id === id);
    const { error } = await supabase
      .from('library')
      .delete()
      .eq('id', id);

    if (error) throw new Error('The library item could not be removed.');

    if (item?.storagePath) {
      const target = storageTarget(item.storagePath);
      await supabase.storage.from(target.bucket).remove([target.path]);
    }

    setLibrary((previous) =>
      previous.filter((libraryItem) => libraryItem.id !== id),
    );
  };

  const getLibraryForTeacher = useCallback(
    (teacherId: string) =>
      library.filter((item) => item.teacherId === teacherId),
    [library],
  );

  const getStudentsForTeacher = useCallback(
    (teacherId: string) =>
      students.filter((student) => student.teacherId === teacherId),
    [students],
  );

  const getNotesForStudent = useCallback(
    (student: User) =>
      notes.filter(
        (note) =>
          note.class === student.class &&
          note.teacherId === student.teacherId,
      ),
    [notes],
  );

  const getResultsForStudent = useCallback(
    (studentId: string) =>
      results.filter((result) => result.studentId === studentId),
    [results],
  );

  const getNotificationsForStudent = useCallback(
    (studentId: string) =>
      [...notifications]
        .filter((notification) => notification.studentId === studentId)
        .sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
    [notifications],
  );

  const getNotificationsUnreadCount = useCallback(
    (studentId: string) =>
      notifications.filter(
        (notification) =>
          notification.studentId === studentId && !notification.read,
      ).length,
    [notifications],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        teacherProfile,
        loading,
        login,
        logout,
        registerTeacher,
        changePassword,
        resetStudentPassword,
        updateUserPhoto,
        students,
        addStudent,
        removeStudent,
        updateStudent,
        notes,
        addNote,
        getSignedNoteUrl,
        results,
        addResult,
        announcements,
        addAnnouncement,
        removeAnnouncement,
        conversations,
        sendMessage,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        library,
        addToLibrary,
        removeFromLibrary,
        getLibraryForTeacher,
        activityLog,
        getStudentsForTeacher,
        getNotesForStudent,
        getResultsForStudent,
        getNotificationsForStudent,
        getNotificationsUnreadCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}