import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Note } from '@/data/mockData';

export default function StudentNotes() {
  const { currentUser, getNotesForStudent, getSignedNoteUrl } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const classNotes = useMemo(() => {
    if (!currentUser) return [];
    return getNotesForStudent(currentUser);
  }, [currentUser, getNotesForStudent]);

  const groupedNotes = useMemo(() => {
    const groups: Record<string, Note[]> = {};
    classNotes.forEach(note => {
      if (!groups[note.subject]) groups[note.subject] = [];
      groups[note.subject].push(note);
    });
    return groups;
  }, [classNotes]);

  const subjectEmoji = (subject: string) =>
    ({ science:'🧪', math:'➗', mathematics:'➗', english:'📖', biology:'🔬', chemistry:'⚗️',
       physics:'⚡', history:'🏛️', geography:'🌍', computer:'💻', urdu:'✍️', islamiat:'☪️' } as Record<string, string>)
    [subject.toLowerCase()] ?? '📄';

  const handleView = async (note: Note) => {
    if (!note.storagePath) { alert('No PDF file is attached to this note.'); return; }
    setLoading(`view-${note.id}`);
    const url = await getSignedNoteUrl(note.storagePath);
    setLoading(null);
    if (!url) { alert('Could not load the file. Please try again.'); return; }
    window.open(url, '_blank');
  };

  const handleDownload = async (note: Note) => {
    if (!note.storagePath) { alert('No PDF file is attached to this note.'); return; }
    setLoading(`dl-${note.id}`);
    const url = await getSignedNoteUrl(note.storagePath);
    setLoading(null);
    if (!url) { alert('Could not load the file. Please try again.'); return; }
    const a = document.createElement('a');
    a.href = url;
    a.download = note.filename.endsWith('.pdf') ? note.filename : `${note.filename}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Notes</h1>
          <p className="text-muted-foreground mt-1">Your study materials for {currentUser?.class}</p>
        </div>
      </header>

      {Object.keys(groupedNotes).length === 0 ? (
        <div className="glass-card rounded-2xl py-20 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">📚</span>
          <p className="text-lg font-semibold text-foreground">No Notes Yet</p>
          <p className="text-sm text-muted-foreground">Your teacher hasn't uploaded anything for your class.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedNotes).map(([subject, subjectNotes], i) => (
            <motion.div key={subject} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="space-y-4">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span>{subjectEmoji(subject)}</span>{subject}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {subjectNotes.map(note => (
                  <div key={note.id} className="glass-card rounded-2xl p-5 border border-border hover:border-primary/40 transition-colors">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{note.filename}</p>
                        <p className="text-sm text-muted-foreground">{note.chapter}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(note.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {note.description && (
                      <p className="text-sm text-muted-foreground mb-4 pl-1">{note.description}</p>
                    )}
                    {note.hasFile ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleView(note)}
                          disabled={loading === `view-${note.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {loading === `view-${note.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(note)}
                          disabled={loading === `dl-${note.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                        >
                          {loading === `dl-${note.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                          Download
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-xl px-3 py-2">
                        <FileText className="w-3.5 h-3.5" />No file attached
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
