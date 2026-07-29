import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Upload, FileUp, Save, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CLASS_LIST } from '@/data/constants';

export default function TeacherUploadNotes() {
  const { currentUser, addNote, notes, students } = useAuth();

  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [notifiedCount, setNotifiedCount] = useState(0);

  const [formData, setFormData] = useState({ class: '', subject: '', chapter: '', description: '' });

  const recentNotes = notes.filter(n => n.teacherId === currentUser?.id).slice(0, 5);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedFile) return;
    setBusy(true);

    await addNote({
      class: formData.class,
      subject: formData.subject,
      chapter: formData.chapter,
      filename: selectedFile.name,
      description: formData.description,
      teacherId: currentUser.id,
      file: selectedFile,
    });

    const count = students.filter(s => s.class === formData.class && s.teacherId === currentUser.id).length;
    setNotifiedCount(count);
    setBusy(false);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setSelectedFile(null);
      setFormData({ class: '', subject: '', chapter: '', description: '' });
    }, 4000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
          <Upload className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Notes</h1>
          <p className="text-muted-foreground mt-1">Distribute study materials to a class</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-3xl p-8 lg:col-span-2">
          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center h-full">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Upload Successful</h3>
              <p className="text-muted-foreground mb-4">The notes are now available in the student portal.</p>
              <div className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-medium">
                {notifiedCount > 0 ? `${notifiedCount} student${notifiedCount !== 1 ? 's' : ''} notified` : 'No students in this class yet'}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground ml-1">Class *</label>
                  <select name="class" value={formData.class} onChange={handleChange} required
                    className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Select class</option>
                    {CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground ml-1">Subject *</label>
                  <input name="subject" value={formData.subject} onChange={handleChange} required placeholder="e.g. Mathematics"
                    className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Chapter / Topic *</label>
                <input name="chapter" value={formData.chapter} onChange={handleChange} required placeholder="e.g. Chapter 3: Trigonometry"
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Description (optional)</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={2} placeholder="Brief description of these notes…"
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">PDF File *</label>
                <label className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${selectedFile ? 'border-primary/40 bg-primary/5' : 'border-border hover:border-primary/40 hover:bg-secondary/30'}`}>
                  <FileUp className={`w-8 h-8 ${selectedFile ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    {selectedFile ? (
                      <><p className="font-medium text-foreground">{selectedFile.name}</p><p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(0)} KB</p></>
                    ) : (
                      <><p className="font-medium text-foreground">Click to select PDF</p><p className="text-xs text-muted-foreground mt-1">PDF files only</p></>
                    )}
                  </div>
                  <input type="file" accept=".pdf,application/pdf" className="sr-only" onChange={handleFileChange} />
                </label>
              </div>
              <button type="submit" disabled={busy || !selectedFile} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</> : <><Save className="w-4 h-4" />Upload Notes</>}
              </button>
            </form>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <h3 className="font-semibold text-lg text-foreground px-1">Recent Uploads</h3>
          {recentNotes.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground text-sm border border-dashed">No notes uploaded yet.</div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map(note => (
                <div key={note.id} className="glass-card rounded-2xl p-4 flex gap-3 items-start">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">{note.filename}</p>
                    <p className="text-xs text-muted-foreground">{note.class} · {note.subject}</p>
                    <p className="text-xs text-muted-foreground">{new Date(note.date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
