import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import TaskMateAvatar from '@/components/ui/TaskMateAvatar';
import { MessageCircle, Send, Search, ArrowLeft, RotateCcw, Paperclip, Download, XCircle, FileText } from 'lucide-react';

// ─── localStorage helpers for "last seen" message tracking ───
const STORAGE_KEY = 'tm_last_seen';

function getLastSeen(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}

function saveLastSeen(studentId: string, msgId: string) {
  const all = getLastSeen();
  all[studentId] = msgId;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function hasUnread(studentId: string, latestMsgId: string | undefined): boolean {
  if (!latestMsgId) return false;
  const seen = getLastSeen();
  return seen[studentId] !== latestMsgId;
}

export default function TeacherMessages() {
  const { currentUser, getStudentsForTeacher, conversations, sendMessage, getSignedNoteUrl } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [, forceUpdate] = useState(0); // trigger re-render when localStorage changes
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const teacherStudents = currentUser ? getStudentsForTeacher(currentUser.id) : [];

  // Sort students: those with most-recent messages first, then alphabetical
  const sortedStudents = [...teacherStudents].sort((a, b) => {
    const convA = conversations.find(c => c.studentId === a.id);
    const convB = conversations.find(c => c.studentId === b.id);
    const lastA = convA?.messages[convA.messages.length - 1];
    const lastB = convB?.messages[convB.messages.length - 1];
    if (lastA && lastB) {
      // sort by timestamp string (HH:MM) — approximate; both are same-day for real-time
      // use message index as tie-break since we don't have full date on Message
      return convB.messages.length - convA.messages.length;
    }
    if (lastA) return -1;
    if (lastB) return 1;
    return a.name.localeCompare(b.name);
  });

  const filteredStudents = sortedStudents.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.studentId === activeStudentId) ?? {
    studentId: activeStudentId ?? '',
    messages: [],
  };

  const activeStudent = teacherStudents.find(s => s.id === activeStudentId);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (activeStudentId) scrollToBottom();
  }, [activeConversation.messages, activeStudentId, scrollToBottom]);

  // Mark conversation as read when opened or when new messages arrive while open
  useEffect(() => {
    if (!activeStudentId) return;
    const conv = conversations.find(c => c.studentId === activeStudentId);
    const lastMsg = conv?.messages[conv.messages.length - 1];
    if (lastMsg) {
      saveLastSeen(activeStudentId, lastMsg.id);
      forceUpdate(n => n + 1);
    }
  }, [activeStudentId, activeConversation.messages.length, conversations]);

  const handleSelectStudent = (studentId: string) => {
    setActiveStudentId(studentId);
    setNewMessage('');
    setSelectedFile(null);
    // Mark as read immediately on click
    const conv = conversations.find(c => c.studentId === studentId);
    const lastMsg = conv?.messages[conv.messages.length - 1];
    if (lastMsg) {
      saveLastSeen(studentId, lastMsg.id);
      forceUpdate(n => n + 1);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeStudentId || !currentUser || sending) return;
    const messageText = newMessage.trim();
    setSending(true);
    try {
      await sendMessage(activeStudentId, currentUser.id, messageText, selectedFile ?? undefined);
      setNewMessage('');
      setSelectedFile(null);
    } finally {
      setSending(false);
    }
  };

  const handleDownload = async (msg: typeof activeConversation.messages[0]) => {
    if (!msg.attachmentPath) return;
    setLoadingFileId(msg.id);
    try {
      const url = await getSignedNoteUrl(msg.attachmentPath);
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = msg.attachmentName || 'download';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setLoadingFileId(null);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <header className="flex items-center gap-3 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Communicate directly with students</p>
        </div>
      </header>

      <div className="flex-1 glass-card rounded-2xl border border-border flex overflow-hidden shadow-sm min-h-0">

        {/* ── Left Sidebar: Student List ── */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col bg-background/30 ${activeStudentId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No students found.</div>
            ) : (
              filteredStudents.map(student => {
                const conv = conversations.find(c => c.studentId === student.id);
                const latestMsg = conv?.messages[conv.messages.length - 1];
                const isActive = activeStudentId === student.id;
                const unread = !isActive && hasUnread(student.id, latestMsg?.id);

                return (
                  <div
                    key={student.id}
                    onClick={() => handleSelectStudent(student.id)}
                    className={`p-4 border-b border-border/50 cursor-pointer transition-colors flex items-center gap-3 ${
                      isActive
                        ? 'bg-primary/10 border-l-4 border-l-primary'
                        : 'hover:bg-secondary/50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="relative shrink-0">
                      <TaskMateAvatar name={student.name} photoUrl={student.photoUrl} size={10} />
                      {unread && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-foreground truncate text-sm ${unread ? 'text-foreground' : ''}`}>
                        {student.name}
                      </p>
                      {latestMsg ? (
                        <p className={`text-xs truncate ${unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {latestMsg.senderId === currentUser?.id ? 'You: ' : ''}{latestMsg.text}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{student.class}</p>
                      )}
                    </div>
                    {latestMsg && (
                      <span className="text-[10px] text-muted-foreground shrink-0">{latestMsg.timestamp}</span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Chat Area ── */}
        <div className={`flex-1 flex flex-col bg-background/50 min-w-0 ${!activeStudentId ? 'hidden md:flex' : 'flex'}`}>
          {!activeStudentId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <MessageCircle className="w-14 h-14 text-muted-foreground/20" />
              <p className="text-lg font-semibold text-foreground">Select a Student</p>
              <p className="text-sm text-muted-foreground">Choose a student from the list to view or start a conversation.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-background shrink-0">
                <button
                  className="md:hidden p-2 -ml-1 rounded-lg hover:bg-secondary transition-colors"
                  onClick={() => setActiveStudentId(null)}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <TaskMateAvatar name={activeStudent?.name ?? ''} photoUrl={activeStudent?.photoUrl} size={10} />
                <div>
                  <h3 className="font-semibold text-foreground">{activeStudent?.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {activeStudent?.class} · Roll: {activeStudent?.rollNumber}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {activeConversation.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                    <MessageCircle className="w-10 h-10 opacity-20" />
                    <p className="text-sm">No messages yet. Say hi to {activeStudent?.name?.split(' ')[0]}!</p>
                  </div>
                ) : (
                  activeConversation.messages.map(msg => {
                    const isMine = msg.senderId === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                        {!isMine && (
                          <TaskMateAvatar name={activeStudent?.name ?? ''} photoUrl={activeStudent?.photoUrl} size={7} />
                        )}
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-card border border-border text-card-foreground rounded-bl-sm shadow-sm'
                          }`}
                        >
                          {msg.text && <p className="leading-relaxed text-sm">{msg.text}</p>}
                          
                          {msg.attachmentPath && (
                            <div className="mt-2 bg-white/10 rounded-lg p-2 flex items-center gap-2">
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="text-xs truncate flex-1">{msg.attachmentName}</span>
                              <button
                                onClick={() => handleDownload(msg)}
                                disabled={loadingFileId === msg.id}
                                className="p-1 hover:bg-white/20 rounded disabled:opacity-50"
                                title="Download"
                              >
                                {loadingFileId === msg.id ? (
                                  <RotateCcw className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Download className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          )}
                          
                          <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-background border-t border-border shrink-0">
                {selectedFile && (
                  <div className="mb-3 flex items-center gap-2 bg-muted p-2 rounded-lg text-xs">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="flex-1 truncate">{selectedFile.name}</span>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-muted-foreground/20 rounded"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={sending}
                    className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center shrink-0 hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeStudent?.name?.split(' ')[0] ?? ''}…`}
                    className="flex-1 bg-muted/50 border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  />
                  <button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedFile) || sending}
                    className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-[-2px]" />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
