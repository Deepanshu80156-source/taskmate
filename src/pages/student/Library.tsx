import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookMarked, Paperclip, Download, ExternalLink, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentLibrary() {
  const { currentUser, library, getSignedNoteUrl } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const studentLibrary = useMemo(() => {
    if (!currentUser?.teacherId) return [];
    return library.filter(item => item.teacherId === currentUser.teacherId);
  }, [currentUser, library]);

  const handleOpen = async (item: { id: string; storagePath?: string }) => {
    if (!item.storagePath) return;
    setLoadingId(item.id);
    const url = await getSignedNoteUrl(item.storagePath);
    setLoadingId(null);
    if (url) window.open(url, '_blank');
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
          <BookMarked className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Shared Library</h1>
          <p className="text-muted-foreground mt-1">Resources shared by your teacher</p>
        </div>
      </header>

      {studentLibrary.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">📚</span>
          <p className="text-lg font-semibold text-foreground">No shared resources yet</p>
          <p className="text-sm text-muted-foreground">Your teacher has not added anything to the library yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {studentLibrary.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="glass-card rounded-2xl p-5 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{item.filename}</p>
                  <p className="text-sm text-muted-foreground">{item.subject} · {item.chapter}</p>
                  {item.description && <p className="text-sm text-muted-foreground mt-2">{item.description}</p>}
                  <p className="text-xs text-muted-foreground mt-3">Added {new Date(item.date).toLocaleDateString()}</p>
                </div>
              </div>
              {item.storagePath ? (
                <button onClick={() => handleOpen(item)} disabled={loadingId === item.id} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-3 py-2 text-sm">
                  {loadingId === item.id ? 'Opening…' : <><Paperclip className="w-4 h-4" /> Open attachment</>}
                </button>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No attachment available for this resource.</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
