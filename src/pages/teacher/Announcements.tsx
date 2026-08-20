import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Megaphone, Calendar, Send, CheckCircle, Trash2, Paperclip, XCircle, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatBytes } from '@/lib/fileUpload';
import { usePersistentState } from '@/hooks/usePersistentState';

export default function TeacherAnnouncements() {
  const { currentUser, announcements, addAnnouncement, removeAnnouncement } = useAuth();
  
  const [newTitle, setNewTitle] = usePersistentState(
    `taskmate:form:announcement-title:${currentUser?.id ?? 'guest'}`,
    '',
  );
  const [newContent, setNewContent] = usePersistentState(
    `taskmate:form:announcement-content:${currentUser?.id ?? 'guest'}`,
    '',
  );
  const [classScope, setClassScope] = usePersistentState(
    `taskmate:form:announcement-class:${currentUser?.id ?? 'guest'}`,
    'All Classes',
  );
  const [isPosting, setIsPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const teacherAnnouncements = announcements.filter(a => a.teacherId === currentUser?.id);

  const handleRemove = async (id: string) => {
    setError(null);
    try {
      await removeAnnouncement(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the announcement.');
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || !newTitle.trim() || !currentUser) return;

    setIsPosting(true);
    setError(null);
    try {
      await addAnnouncement({
        title: newTitle,
        content: newContent,
        classScope,
        teacherId: currentUser.id,
        attachmentFile: selectedFile ?? undefined,
      });
      setNewTitle('');
      setNewContent('');
      setClassScope('All Classes');
      setSelectedFile(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post the announcement.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Broadcast messages to students</p>
        </div>
      </header>

      {/* Post New Announcement */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-6 border-2 border-primary/20"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">Post New Announcement</h2>
        
        {success ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <p className="font-medium">Announcement posted successfully!</p>
          </div>
        ) : (
          <form onSubmit={handlePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground ml-1">Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Holiday Notice"
                    className="w-full bg-background/50 border border-input rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
               </div>
               <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground ml-1">Class Scope</label>
                  <select 
                    value={classScope}
                    onChange={(e) => setClassScope(e.target.value)}
                    className="w-full bg-background/50 border border-input rounded-xl p-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="All Classes">All Classes</option>
                    <option value="Class 9">Class 9</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 11">Class 11</option>
                    <option value="Class 12">Class 12</option>
                  </select>
               </div>
            </div>
            
            <div className="space-y-1.5">
               <label className="text-sm font-medium text-foreground ml-1">Message</label>
               <textarea
                 value={newContent}
                 onChange={(e) => setNewContent(e.target.value)}
                 placeholder="Type your announcement here..."
                 className="w-full bg-background/50 border border-input rounded-xl p-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none min-h-[120px]"
                 required
               />
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                <Paperclip className="w-4 h-4" />
                <span>Attach one file (optional)</span>
                <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
              </label>
              {selectedFile && (
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="truncate">{selectedFile.name} · {formatBytes(selectedFile.size)}</span>
                  </div>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              )}
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="text-xs text-muted-foreground">Visible to selected classes immediately.</p>
              <button 
                type="submit" 
                disabled={isPosting || !newContent.trim() || !newTitle.trim()}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-6 py-2.5 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isPosting ? 'Posting...' : 'Post Announcement'}
              </button>
            </div>
          </form>
        )}
      </motion.div>

      {/* Announcement History */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground mb-4">Recent Announcements</h2>
        {teacherAnnouncements.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">📢</span>
            <p className="text-lg font-semibold text-foreground">No Announcements Yet</p>
            <p className="text-sm text-muted-foreground">Post your first announcement using the form above.</p>
          </div>
        ) : (
          teacherAnnouncements.map((announcement, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={announcement.id} 
              className="glass-card rounded-xl p-5 border-l-4 border-l-border hover:border-l-primary transition-colors relative group"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => void handleRemove(announcement.id)}
                  className="p-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="pr-12">
                 <h3 className="font-bold text-lg text-foreground mb-2 flex items-center gap-3">
                    {announcement.title}
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      {announcement.classScope}
                    </span>
                 </h3>
                 <p className="text-foreground leading-relaxed mb-3">
                   {announcement.content}
                 </p>
                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
                   <span className="flex items-center gap-1">
                     <Calendar className="w-4 h-4" />
                     {new Date(announcement.date).toLocaleDateString()}
                   </span>
                   <span className="font-medium">• {announcement.timeAgo}</span>
                 </div>
                 {announcement.attachmentName && (
                   <div className="mt-3 flex items-center gap-2 text-sm text-primary">
                     <Paperclip className="w-4 h-4" />
                     <span>{announcement.attachmentName}</span>
                   </div>
                 )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
