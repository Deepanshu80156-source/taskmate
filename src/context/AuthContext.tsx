import React, {
  createContext, useContext, useState, useEffect, useCallback, ReactNode,
} from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { buildStoragePath, validateUploadFile } from '@/lib/fileUpload';
import {
  User, Role, Note, ExamResult, Announcement,
  Conversation, Notification, LibraryNote, ActivityItem, ActivityType,
} from '../data/mockData';

interface AuthContextType {
  currentUser: User | null;
  teacherProfile: User | null;
  loading: boolean;
  login: (username: string, password: string, role: Role) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  registerTeacher: (name: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetStudentPassword: (studentId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateUserPhoto: (userId: string, file: File) => Promise<{ success: boolean; error?: string }>;
  students: User[];
  addStudent: (student: Omit<User, 'id' | 'role'> & { password: string }) => Promise<{ success: boolean; error?: string }>;
  removeStudent: (studentId: string) => Promise<void>;
  updateStudent: (studentId: string, updates: Partial<User>) => Promise<void>;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'date' | 'hasFile' | 'storagePath'> & { file?: File }) => Promise<void>;
  getSignedNoteUrl: (storagePath: string) => Promise<string | null>;
  results: ExamResult[];
  addResult: (result: Omit<ExamResult, 'id' | 'date'>) => Promise<void>;
  announcements: Announcement[];
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'date' | 'timeAgo'>) => Promise<void>;
  removeAnnouncement: (id: string) => Promise<void>;
  conversations: Conversation[];
  sendMessage: (studentId: string, senderId: string, text: string) => Promise<void>;
  notifications: Notification[];
  markNotificationRead: (notificationId: string) => Promise<void>;
  markAllNotificationsRead: (studentId: string) => Promise<void>;
  library: LibraryNote[];
  addToLibrary: (note: Omit<LibraryNote, 'id' | 'date'> & { file?: File }) => Promise<void>;
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

const toEmail = (username: string) => `${username.trim().toLowerCase()}@taskmate.app`;

function rowToUser(row: Record<string, unknown>): User {
  return {
    id: row.id as string, name: row.name as string, role: row.role as Role,
    username: row.username as string, class: (row.class as string) ?? undefined,
    rollNumber: (row.roll_number as string) ?? undefined,
    guardianName: (row.guardian_name as string) ?? undefined,
    guardianPhone: (row.guardian_phone as string) ?? undefined,
    teacherId: (row.teacher_id as string) ?? undefined,
    photoUrl: (row.photo_url as string) ?? undefined,
  };
}
function rowToNote(row: Record<string, unknown>): Note {
  return {
    id: row.id as string, class: row.class as string, subject: row.subject as string,
    chapter: row.chapter as string, filename: row.filename as string,
    description: (row.description as string) ?? undefined,
    date: (row.date as string) ?? (row.created_at as string),
    teacherId: row.teacher_id as string, hasFile: !!(row.storage_path),
    storagePath: (row.storage_path as string) ?? undefined,
  };
}
function rowToResult(row: Record<string, unknown>): ExamResult {
  return {
    id: row.id as string, studentId: row.student_id as string,
    examName: row.exam_name as string, marksObtained: Number(row.marks_obtained),
    totalMarks: Number(row.total_marks), remarks: (row.remarks as string) ?? '',
    date: (row.date as string) ?? (row.created_at as string),
    teacherId: row.teacher_id as string, subject: row.subject as string,
  };
}
function rowToAnn(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string, title: row.title as string, content: row.content as string,
    classScope: row.class_scope as string,
    date: (row.date as string) ?? (row.created_at as string),
    timeAgo: '', teacherId: row.teacher_id as string,
    attachmentPath: (row.attachment_path as string | null) ?? undefined,
    attachmentName: (row.attachment_name as string | null) ?? undefined,
    attachmentMimeType: (row.attachment_mime_type as string | null) ?? undefined,
    attachmentSize: (row.attachment_size as number | null) ?? undefined,
  };
}
function rowToLib(row: Record<string, unknown>): LibraryNote {
  return {
    id: row.id as string, teacherId: row.teacher_id as string,
    subject: row.subject as string, chapter: row.chapter as string,
    filename: row.filename as string, description: (row.description as string) ?? undefined,
    date: (row.date as string) ?? (row.created_at as string),
    storagePath: (row.storage_path as string) ?? undefined,
  };
}

function getStorageBucket(storagePath: string): 'notes' | 'announcements' | 'library' | 'avatars' {
  const normalized = storagePath.replace(/^\/+/, '');
  const [first] = normalized.split('/');
  switch (first) {
    case 'announcements': return 'announcements';
    case 'library': return 'library';
    case 'avatars': return 'avatars';
    case 'notes':
    default: return 'notes';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<User[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [library, setLibrary] = useState<LibraryNote[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityItem[]>([]);

  const loadConversations = useCallback(async (userId: string, role: 'teacher' | 'student') => {
    const { data } = await (role === 'teacher'
      ? supabase.from('conversations').select('*, messages(*)').eq('teacher_id', userId)
      : supabase.from('conversations').select('*, messages(*)').eq('student_id', userId));
    if (!data) return;
    setConversations(data.map((conv: Record<string, unknown>) => ({
      studentId: conv.student_id as string,
      messages: ((conv.messages as Record<string, unknown>[]) ?? [])
        .sort((a, b) => new Date(a.created_at as string).getTime() - new Date(b.created_at as string).getTime())
        .map((m) => ({
          id: m.id as string, senderId: m.sender_id as string, text: m.text as string,
          timestamp: new Date(m.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
    })));
  }, []);

  const loadTeacherData = useCallback(async (teacherId: string) => {
    const [sRes, nRes, rRes, aRes, lRes, acRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('teacher_id', teacherId).eq('role', 'student'),
      supabase.from('notes').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
      supabase.from('results').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
      supabase.from('library').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }),
      supabase.from('activity_log').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: false }).limit(50),
    ]);
    if (sRes.data) setStudents(sRes.data.map(rowToUser));
    if (nRes.data) setNotes(nRes.data.map(rowToNote));
    if (rRes.data) setResults(rRes.data.map(rowToResult));
    if (aRes.data) setAnnouncements(aRes.data.map(rowToAnn));
    if (lRes.data) setLibrary(lRes.data.map(rowToLib));
    if (acRes.data) setActivityLog(acRes.data.map((a: Record<string, unknown>) => ({
      id: a.id as string, teacherId: a.teacher_id as string, type: a.type as ActivityType,
      description: a.description as string, date: (a.date as string) ?? (a.created_at as string),
    })));
    await loadConversations(teacherId, 'teacher');
  }, [loadConversations]);

  const loadStudentData = useCallback(async (student: User) => {
    const [nRes, rRes, aRes, notifRes, teacherRes] = await Promise.all([
      supabase.from('notes').select('*').eq('teacher_id', student.teacherId!).eq('class', student.class!).order('created_at', { ascending: false }),
      supabase.from('results').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
      supabase.from('announcements').select('*').eq('teacher_id', student.teacherId!).order('created_at', { ascending: false }),
      supabase.from('notifications').select('*').eq('student_id', student.id).order('created_at', { ascending: false }),
      student.teacherId
        ? supabase.from('profiles').select('*').eq('id', student.teacherId).single()
        : Promise.resolve({ data: null }),
    ]);
    if (teacherRes.data) setTeacherProfile(rowToUser(teacherRes.data as Record<string, unknown>));
    if (nRes.data) setNotes(nRes.data.map(rowToNote));
    if (rRes.data) setResults(rRes.data.map(rowToResult));
    if (aRes.data) setAnnouncements(
      aRes.data.filter((a: Record<string, unknown>) => a.class_scope === 'All Classes' || a.class_scope === student.class).map(rowToAnn)
    );
    if (notifRes.data) setNotifications(notifRes.data.map((n: Record<string, unknown>) => ({
      id: n.id as string, studentId: n.student_id as string, type: n.type as Notification['type'],
      message: n.message as string, read: n.read as boolean,
      date: (n.date as string) ?? (n.created_at as string),
    })));
    await loadConversations(student.id, 'student');
  }, [loadConversations]);

  useEffect(() => {
    const handleSession = async (session: Session) => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (!profile) { setLoading(false); return; }
      const user = rowToUser(profile as Record<string, unknown>);
      setCurrentUser(user);
      if (user.role === 'teacher') await loadTeacherData(user.id);
      else if (user.teacherId && user.class) await loadStudentData(user);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) handleSession(session); else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setLoading(true); handleSession(session); }
      else {
        setCurrentUser(null); setTeacherProfile(null); setStudents([]); setNotes([]); setResults([]);
        setAnnouncements([]); setConversations([]); setNotifications([]);
        setLibrary([]); setActivityLog([]); setLoading(false);
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [loadTeacherData, loadStudentData]);

  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.id; const role = currentUser.role;
    const msgCh = supabase.channel(`messages-${uid}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async () => {
        await loadConversations(uid, role);
      }).subscribe();

    let notifCh: ReturnType<typeof supabase.channel> | null = null;
    if (role === 'student') {
      notifCh = supabase.channel(`notifications-${uid}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `student_id=eq.${uid}` },
          (payload) => {
            const n = payload.new as Record<string, unknown>;
            setNotifications(prev => [{
              id: n.id as string, studentId: n.student_id as string,
              type: n.type as Notification['type'], message: n.message as string,
              read: false, date: (n.date as string) ?? (n.created_at as string),
            }, ...prev]);
          }).subscribe();
    }
    return () => { msgCh.unsubscribe(); notifCh?.unsubscribe(); };
  }, [currentUser?.id, currentUser?.role, loadConversations]);

  const logActivity = async (teacherId: string, type: ActivityType, description: string) => {
    const { data } = await supabase.from('activity_log').insert({ teacher_id: teacherId, type, description }).select().single();
    if (data) {
      const d = data as Record<string, unknown>;
      setActivityLog(prev => [{ id: d.id as string, teacherId: d.teacher_id as string, type: d.type as ActivityType, description: d.description as string, date: (d.date as string) ?? (d.created_at as string) }, ...prev].slice(0, 50));
    }
  };

  const login = async (username: string, password: string, role: Role): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
    if (error) return { success: false, error: 'Incorrect username or password.' };
    const { data: profile } = await supabase.from('profiles').select('role').eq('username', username.trim().toLowerCase()).maybeSingle();
    if (profile && (profile as Record<string, unknown>).role !== role) {
      await supabase.auth.signOut();
      return { success: false, error: `This account is registered as a ${(profile as Record<string, unknown>).role}, not a ${role}.` };
    }
    return { success: true };
  };

  const logout = async () => { await supabase.auth.signOut(); };

  const registerTeacher = async (name: string, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = username.trim().toLowerCase();
    const { data: ex } = await supabase.from('profiles').select('id').eq('username', trimmed).maybeSingle();
    if (ex) return { success: false, error: 'This username is already taken. Please choose another.' };
    const { data, error } = await supabase.auth.signUp({ email: toEmail(trimmed), password });
    if (error || !data.user) return { success: false, error: error?.message ?? 'Could not create account.' };
    const { error: pErr } = await supabase.from('profiles').insert({ id: data.user.id, name: name.trim(), username: trimmed, role: 'teacher' });
    if (pErr) return { success: false, error: pErr.message };
    return { success: true };
  };

  const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) return { success: false, error: 'Not logged in.' };
    if (newPassword.length < 6) return { success: false, error: 'New password must be at least 6 characters.' };
    const { error: vErr } = await supabase.auth.signInWithPassword({ email: toEmail(currentUser.username), password: oldPassword });
    if (vErr) return { success: false, error: 'Current password is incorrect.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const resetStudentPassword = async (studentId: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const { error } = await supabase.rpc('reset_student_password', { student_id: studentId, new_password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  const updateUserPhoto = async (userId: string, file: File): Promise<{ success: boolean; error?: string }> => {
    const validation = validateUploadFile(file, { allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'], maxBytes: 2 * 1024 * 1024 });
    if (!validation.valid) return { success: false, error: validation.error };

    const storagePath = buildStoragePath(`avatars/${userId}`, file);
    const { error: uploadError } = await supabase.storage.from('avatars').upload(storagePath, file, { contentType: file.type });
    if (uploadError) return { success: false, error: 'Photo upload failed. Please try again.' };

    const { data: signedUrlData } = await supabase.storage.from('avatars').createSignedUrl(storagePath, 3600);
    const photoUrl = signedUrlData?.signedUrl ?? storagePath;

    const { error: updateError } = await supabase.from('profiles').update({ photo_url: photoUrl }).eq('id', userId);
    if (updateError) {
      await supabase.storage.from('avatars').remove([storagePath]);
      return { success: false, error: 'Could not save the photo to your profile.' };
    }

    setCurrentUser(prev => prev ? { ...prev, photoUrl } : prev);
    setStudents(prev => prev.map(s => s.id === userId ? { ...s, photoUrl } : s));
    setTeacherProfile(prev => prev?.id === userId ? { ...prev, photoUrl } : prev);
    return { success: true };
  };

  const addStudent = async (student: Omit<User, 'id' | 'role'> & { password: string }): Promise<{ success: boolean; error?: string }> => {
    const trimmed = student.username.trim().toLowerCase();
    const { data: ex } = await supabase.from('profiles').select('id').eq('username', trimmed).maybeSingle();
    if (ex) return { success: false, error: 'This username is already taken.' };
    const { data: { session: ts } } = await supabase.auth.getSession();
    const { data, error } = await supabase.auth.signUp({ email: toEmail(trimmed), password: student.password });
    if (error || !data.user) return { success: false, error: error?.message ?? 'Could not create student account.' };
    const { error: pErr } = await supabase.from('profiles').insert({
      id: data.user.id, name: student.name.trim(), username: trimmed, role: 'student',
      class: student.class ?? null, roll_number: student.rollNumber ?? null,
      guardian_name: student.guardianName ?? null, guardian_phone: student.guardianPhone ?? null,
      teacher_id: student.teacherId ?? null,
    });
    if (ts) await supabase.auth.setSession({ access_token: ts.access_token, refresh_token: ts.refresh_token });
    if (pErr) return { success: false, error: pErr.message };
    setStudents(prev => [...prev, { id: data.user!.id, name: student.name.trim(), username: trimmed, role: 'student', class: student.class, rollNumber: student.rollNumber, guardianName: student.guardianName, guardianPhone: student.guardianPhone, teacherId: student.teacherId }]);
    if (student.teacherId) await logActivity(student.teacherId, 'student_registered', `Registered ${student.name}`);
    return { success: true };
  };

  const removeStudent = async (studentId: string): Promise<void> => {
    await supabase.from('profiles').delete().eq('id', studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const updateStudent = async (studentId: string, updates: Partial<User>): Promise<void> => {
    const db: Record<string, unknown> = {};
    if (updates.name !== undefined) db.name = updates.name;
    if (updates.class !== undefined) db.class = updates.class;
    if (updates.rollNumber !== undefined) db.roll_number = updates.rollNumber;
    if (updates.guardianName !== undefined) db.guardian_name = updates.guardianName;
    if (updates.guardianPhone !== undefined) db.guardian_phone = updates.guardianPhone;
    if (updates.photoUrl !== undefined) db.photo_url = updates.photoUrl;
    await supabase.from('profiles').update(db).eq('id', studentId);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updates } : s));
    setCurrentUser(prev => prev?.id === studentId ? { ...prev, ...updates } : prev);
  };

  const addNote = async (note: Omit<Note, 'id' | 'date' | 'hasFile' | 'storagePath'> & { file?: File }): Promise<void> => {
    if (!currentUser) return;
    let storagePath: string | null = null;
    if (note.file) {
      const ext = note.file.name.split('.').pop() ?? 'pdf';
      const path = buildStoragePath(`notes/${currentUser.id}`, new File([note.file], `note.${ext}`, { type: note.file.type || 'application/pdf' }));
      const { error: upErr } = await supabase.storage.from('notes').upload(path, note.file, { contentType: note.file.type || 'application/pdf' });
      if (!upErr) storagePath = path;
    }
    const { data, error } = await supabase.from('notes').insert({
      teacher_id: note.teacherId, class: note.class, subject: note.subject,
      chapter: note.chapter, filename: note.filename, description: note.description ?? null, storage_path: storagePath,
    }).select().single();
    if (error || !data) return;
    const newNote = rowToNote(data as Record<string, unknown>);
    setNotes(prev => [newNote, ...prev]);
    const targets = students.filter(s => s.class === note.class && s.teacherId === note.teacherId);
    if (targets.length > 0) await supabase.from('notifications').insert(targets.map(s => ({ student_id: s.id, type: 'notes', message: `New notes: ${note.filename} for ${note.chapter} (${note.subject})` })));
    await logActivity(note.teacherId, 'notes_uploaded', `Uploaded ${note.filename} for ${note.class}`);
  };

  const getSignedNoteUrl = async (storagePath: string): Promise<string | null> => {
    const bucket = getStorageBucket(storagePath);
    const { data } = await supabase.storage.from(bucket).createSignedUrl(storagePath, 3600);
    return data?.signedUrl ?? null;
  };

  const addResult = async (result: Omit<ExamResult, 'id' | 'date'>): Promise<void> => {
    const { data, error } = await supabase.from('results').insert({
      teacher_id: result.teacherId, student_id: result.studentId, exam_name: result.examName,
      subject: result.subject, marks_obtained: result.marksObtained, total_marks: result.totalMarks, remarks: result.remarks ?? '',
    }).select().single();
    if (error || !data) return;
    setResults(prev => [rowToResult(data as Record<string, unknown>), ...prev]);
    await supabase.from('notifications').insert({ student_id: result.studentId, type: 'result', message: `New result published: ${result.examName}` });
    const student = students.find(s => s.id === result.studentId);
    await logActivity(result.teacherId, 'result_published', `Published ${result.examName} for ${student?.name ?? 'a student'}`);
  };

  const addAnnouncement = async (ann: Omit<Announcement, 'id' | 'date' | 'timeAgo'> & { attachmentFile?: File; attachmentName?: string; attachmentMimeType?: string; attachmentSize?: number; attachmentPath?: string }): Promise<void> => {
    let storagePath: string | null = null;
    let attachmentName = ann.attachmentName ?? null;
    let attachmentMimeType = ann.attachmentMimeType ?? null;
    let attachmentSize = ann.attachmentSize ?? null;
    if (ann.attachmentFile) {
      const validation = validateUploadFile(ann.attachmentFile, { allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxBytes: 10 * 1024 * 1024 });
      if (!validation.valid) throw new Error(validation.error);
      const path = buildStoragePath(`announcements/${ann.teacherId}`, ann.attachmentFile);
      const { error: uploadError } = await supabase.storage.from('announcements').upload(path, ann.attachmentFile, { contentType: ann.attachmentFile.type || 'application/octet-stream' });
      if (uploadError) throw new Error('The attachment could not be uploaded.');
      storagePath = path;
      attachmentName = ann.attachmentFile.name;
      attachmentMimeType = ann.attachmentFile.type || null;
      attachmentSize = ann.attachmentFile.size;
    }

    const { data, error } = await supabase.from('announcements').insert({
      teacher_id: ann.teacherId, title: ann.title, content: ann.content, class_scope: ann.classScope,
      attachment_path: storagePath,
      attachment_name: attachmentName,
      attachment_mime_type: attachmentMimeType,
      attachment_size: attachmentSize,
    }).select().single();
    if (error || !data) {
      if (storagePath) await supabase.storage.from('announcements').remove([storagePath]);
      throw new Error('Announcement could not be saved.');
    }
    setAnnouncements(prev => [rowToAnn(data as Record<string, unknown>), ...prev]);
    const targets = students.filter(s => s.teacherId === ann.teacherId && (ann.classScope === 'All Classes' || s.class === ann.classScope));
    if (targets.length > 0) await supabase.from('notifications').insert(targets.map(s => ({ student_id: s.id, type: 'announcement', message: `New announcement: ${ann.title}` })));
    await logActivity(ann.teacherId, 'announcement_posted', `Posted "${ann.title}"`);
  };

  const removeAnnouncement = async (id: string): Promise<void> => {
    await supabase.from('announcements').delete().eq('id', id);
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const sendMessage = async (studentId: string, senderId: string, text: string): Promise<void> => {
    if (!currentUser) return;
    const teacherId = currentUser.role === 'teacher' ? currentUser.id : currentUser.teacherId!;
    let { data: conv } = await supabase.from('conversations').select('id').eq('teacher_id', teacherId).eq('student_id', studentId).maybeSingle();
    if (!conv) {
      const { data: nc } = await supabase.from('conversations').insert({ teacher_id: teacherId, student_id: studentId }).select().single();
      conv = nc;
    }
    if (!conv) return;
    const { data: msg } = await supabase.from('messages').insert({ conversation_id: (conv as Record<string, unknown>).id, sender_id: senderId, text }).select().single();
    if (!msg) return;
    const m = msg as Record<string, unknown>;
    const timestamp = new Date(m.created_at as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setConversations(prev => {
      const idx = prev.findIndex(c => c.studentId === studentId);
      const newMsg = { id: m.id as string, senderId: m.sender_id as string, text: m.text as string, timestamp };
      if (idx >= 0) { const u = [...prev]; u[idx] = { ...u[idx], messages: [...u[idx].messages, newMsg] }; return u; }
      return [...prev, { studentId, messages: [newMsg] }];
    });
    if (currentUser.role === 'teacher') {
      await supabase.from('notifications').insert({ student_id: studentId, type: 'message', message: 'New message from your teacher' });
      await logActivity(senderId, 'message_sent', 'Sent message to a student');
    }
  };

  const markNotificationRead = async (id: string): Promise<void> => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async (studentId: string): Promise<void> => {
    await supabase.from('notifications').update({ read: true }).eq('student_id', studentId);
    setNotifications(prev => prev.map(n => n.studentId === studentId ? { ...n, read: true } : n));
  };

  const addToLibrary = async (note: Omit<LibraryNote, 'id' | 'date'> & { file?: File }): Promise<void> => {
    if (!currentUser) return;
    let storagePath: string | null = null;
    if (note.file) {
      const validation = validateUploadFile(note.file, { allowedMimeTypes: ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'], maxBytes: 10 * 1024 * 1024 });
      if (!validation.valid) throw new Error(validation.error);
      const path = buildStoragePath(`library/${currentUser.id}`, note.file);
      const { error } = await supabase.storage.from('library').upload(path, note.file, { contentType: note.file.type || 'application/octet-stream' });
      if (error) throw new Error('The file could not be uploaded to the library.');
      storagePath = path;
    }
    const { data, error } = await supabase.from('library').insert({
      teacher_id: note.teacherId, subject: note.subject, chapter: note.chapter,
      filename: note.filename, description: note.description ?? null, storage_path: storagePath,
    }).select().single();
    if (error || !data) {
      if (storagePath) await supabase.storage.from('library').remove([storagePath]);
      throw new Error('Library item could not be saved.');
    }
    setLibrary(prev => [rowToLib(data as Record<string, unknown>), ...prev]);
  };

  const removeFromLibrary = async (id: string): Promise<void> => {
    await supabase.from('library').delete().eq('id', id);
    setLibrary(prev => prev.filter(n => n.id !== id));
  };

  const getLibraryForTeacher = useCallback((teacherId: string) => library.filter(n => n.teacherId === teacherId), [library]);
  const getStudentsForTeacher = useCallback((teacherId: string) => students.filter(s => s.teacherId === teacherId), [students]);
  const getNotesForStudent = useCallback((student: User) => notes.filter(n => n.class === student.class && n.teacherId === student.teacherId), [notes]);
  const getResultsForStudent = useCallback((studentId: string) => results.filter(r => r.studentId === studentId), [results]);
  const getNotificationsForStudent = useCallback((studentId: string) => [...notifications].filter(n => n.studentId === studentId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notifications]);
  const getNotificationsUnreadCount = useCallback((studentId: string) => notifications.filter(n => n.studentId === studentId && !n.read).length, [notifications]);

  return (
    <AuthContext.Provider value={{
      currentUser, teacherProfile, loading, login, logout, registerTeacher, changePassword, resetStudentPassword, updateUserPhoto,
      students, addStudent, removeStudent, updateStudent,
      notes, addNote, getSignedNoteUrl,
      results, addResult,
      announcements, addAnnouncement, removeAnnouncement,
      conversations, sendMessage,
      notifications, markNotificationRead, markAllNotificationsRead,
      library, addToLibrary, removeFromLibrary, getLibraryForTeacher,
      activityLog,
      getStudentsForTeacher, getNotesForStudent, getResultsForStudent,
      getNotificationsForStudent, getNotificationsUnreadCount,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
