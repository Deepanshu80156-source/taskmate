import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookMarked, Trash2, Plus, Filter, Paperclip, FileText, XCircle, Download, ExternalLink } from 'lucide-react';
import { formatBytes } from '@/lib/fileUpload';
import { motion, AnimatePresence } from 'framer-motion';

const SUBJECT_ICONS: Record<string, string> = {
  science: '🧪', math: '➗', mathematics: '➗', english: '📖',
  biology: '🔬', chemistry: '⚗️', physics: '⚡', history: '🏛️',
  geography: '🌍', computer: '💻', urdu: '✍️', islamiat: '☪️',
};
const getSubjectIcon = (subject: string) =>
  SUBJECT_ICONS[subject?.toLowerCase()] ?? '📚';

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TeacherLibrary() {
  const { currentUser, getLibraryForTeacher, addToLibrary, removeFromLibrary } = useAuth();

  // Form state
  const [subject, setSubject] = useState('');
  const [chapter, setChapter] = useState('');
  const [filename, setFilename] = useState('');
  const [description, setDescription] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Filter state
  const [activeFilter, setActiveFilter] = useState('All');

  const library = currentUser ? getLibraryForTeacher(currentUser.id) : [];
  const subjects = ['All', ...Array.from(new Set(library.map(n => n.subject).filter(Boolean)))];
  const filtered = activeFilter === 'All' ? library : library.filter(n => n.subject === activeFilter);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setError(null);
    try {
      await addToLibrary({ teacherId: currentUser.id, subject, chapter, filename, description: description || undefined, file: selectedFile ?? undefined });
      setSubject(''); setChapter(''); setFilename(''); setDescription(''); setSelectedFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the library item.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
          <BookMarked className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Library</h1>
          <p className="text-muted-foreground mt-1">Save notes once — reuse them for any class, anytime.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Add to Library Form */}
        <div className="glass-card rounded-2xl p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Add to Library
          </h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subject <span className="text-destructive">*</span></label>
              <input
                required
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Science"
                className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Chapter / Topic <span className="text-destructive">*</span></label>
              <input
                required
                type="text"
                value={chapter}
                onChange={e => setChapter(e.target.value)}
                placeholder="e.g. Chapter 3: Motion"
                className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Filename / Reference <span className="text-destructive">*</span></label>
              <input
                required
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
                placeholder="e.g. Motion_Notes.pdf"
                className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Description <span className="text-xs font-normal">(optional)</span></label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief note about this resource…"
                rows={3}
                className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />
            </div>

            {saved && (
              <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-xl">
                ✅ Saved to library!
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <Paperclip className="w-4 h-4" /> Attach file (optional)
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

            <button
              type="submit"
              className="w-full py-2.5 bg-primary text-primary-foreground font-medium rounded-xl text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Save to Library
            </button>
          </form>
        </div>

        {/* Library Grid */}
        <div className="lg:col-span-2 space-y-5">
          {/* Subject filters */}
          {library.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
              {subjects.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveFilter(s)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {library.length === 0 ? (
            <div className="glass-card rounded-2xl border border-border py-20 flex flex-col items-center gap-3 text-center px-6">
              <span className="text-5xl">📚</span>
              <p className="text-lg font-semibold text-foreground">Your Library is Empty</p>
              <p className="text-sm text-muted-foreground max-w-xs">Add notes and resources on the left to save them here. Reuse them for any class without re-entering details.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="glass-card rounded-2xl border border-border py-16 flex flex-col items-center gap-2 text-center px-6">
              <span className="text-4xl">🔍</span>
              <p className="font-semibold text-foreground">No notes for "{activeFilter}"</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <AnimatePresence>
                {filtered.map(note => (
                  <motion.div
                    key={note.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="glass-card rounded-2xl p-5 border border-border group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl shrink-0">{getSubjectIcon(note.subject)}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground truncate">{note.filename}</p>
                          <p className="text-xs text-primary font-medium">{note.subject}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromLibrary(note.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        title="Remove from library"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-muted-foreground mt-3 flex items-center gap-1">
                      📑 {note.chapter}
                    </p>

                    {note.description && (
                      <p className="text-sm text-foreground/70 mt-2 leading-relaxed line-clamp-2">{note.description}</p>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                      <span>Added {fmtDate(note.date)}</span>
                      {note.storagePath ? <span className="inline-flex items-center gap-1 text-primary"><Paperclip className="w-3 h-3" /> Attached</span> : <span className="text-muted-foreground">Text-only</span>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
