import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import TaskMateAvatar from '@/components/ui/TaskMateAvatar';
import MessageAttachment from '@/components/MessageAttachment';
import { usePersistentState } from '@/hooks/usePersistentState';
import { MessageCircle, Send, RotateCcw, Paperclip, XCircle, FileText } from 'lucide-react';

export default function StudentMessages() {
  const { currentUser, conversations, sendMessage, teacherProfile, getSignedNoteUrl } = useAuth();

  const [newMessage, setNewMessage] = usePersistentState(
    `taskmate:draft:student-message:${currentUser?.id ?? 'guest'}`,
    '',
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [pendingMessageId, setPendingMessageId] = useState<string | null>(null);
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeConv = conversations.find(c => c.studentId === currentUser?.id);
  const messages = activeConv?.messages ?? [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !currentUser || sending) return;
    const messageText = newMessage.trim();
    setSending(true);
    setPendingMessageId(`local-${Date.now()}`);
    setFailedMessageId(null);
    try {
      await sendMessage(currentUser.id, currentUser.id, messageText, selectedFile ?? undefined);
      setNewMessage('');
      setSelectedFile(null);
    } catch {
      setFailedMessageId(`local-${Date.now()}`);
    } finally {
      setSending(false);
      setPendingMessageId(null);
    }
  };

  const handleDownload = async (msg: typeof messages[0]) => {
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

  const teacherName = teacherProfile?.name ?? 'Teacher';
  const teacherPhoto = teacherProfile?.photoUrl;

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <header className="flex items-center gap-3 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Chat with your Teacher</p>
        </div>
      </header>

      <div className="flex-1 glass-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm max-w-4xl mx-auto w-full min-h-0">

        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-background/50 flex items-center gap-3 shrink-0">
          <TaskMateAvatar name={teacherName} photoUrl={teacherPhoto} size={10} />
          <div>
            <h3 className="font-semibold text-foreground">{teacherName}</h3>
            <p className="text-xs text-muted-foreground">Your Teacher · Direct Message</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
              <MessageCircle className="w-12 h-12 opacity-20" />
              <p className="text-sm">No messages yet. Say hi to your teacher!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {!isMine && (
                    <TaskMateAvatar name={teacherName} photoUrl={teacherPhoto} size={7} />
                  )}
                  <div
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-card border border-border text-card-foreground rounded-bl-sm shadow-sm'
                    }`}
                  >
                    {msg.text && <p className="leading-relaxed text-sm">{msg.text}</p>}
                    
                    {msg.attachmentPath && (
                      <MessageAttachment
                        message={msg}
                        getSignedUrl={getSignedNoteUrl}
                        onDownload={() => handleDownload(msg)}
                        loading={loadingFileId === msg.id}
                      />
                    )}
                    
                    <div className={`flex items-center justify-end gap-2 text-[10px] mt-1 ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      <span>{msg.timestamp}</span>
                      {isMine && msg.deliveryStatus === 'sending' && <span>Sending…</span>}
                      {isMine && msg.deliveryStatus === 'failed' && <span className="text-rose-200">Failed</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/50 border-t border-border shrink-0">
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
              placeholder="Type your message here..."
              className="flex-1 bg-background border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
      </div>
    </div>
  );
}
