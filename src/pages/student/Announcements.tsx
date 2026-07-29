import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Megaphone, Calendar, BellOff } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentAnnouncements() {
  const { currentUser, announcements } = useAuth();
  
  const studentAnnouncements = useMemo(() => {
    if (!currentUser) return [];
    return announcements.filter(a => 
      a.teacherId === currentUser.teacherId && 
      (a.classScope === 'All Classes' || a.classScope === currentUser.class)
    );
  }, [announcements, currentUser]);

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
          <Megaphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Announcements</h1>
          <p className="text-muted-foreground mt-1">Updates and notices from your teachers</p>
        </div>
      </header>

      {studentAnnouncements.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">📢</span>
          <p className="text-lg font-semibold text-foreground">No Announcements</p>
          <p className="text-sm text-muted-foreground">Nothing has been posted yet. Check back soon!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {studentAnnouncements.map((announcement, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={announcement.id} 
              className="glass-card rounded-xl p-6 border-l-4 border-l-primary hover:shadow-md transition-shadow"
            >
              <div className="mb-3">
                 <h3 className="font-bold text-lg text-foreground mb-1">{announcement.title}</h3>
                 <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground inline-block">
                   {announcement.classScope}
                 </span>
              </div>
              <p className="text-foreground leading-relaxed mb-4">
                {announcement.content}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(announcement.date).toLocaleDateString()}
                </span>
                <span className="text-primary/70 font-medium">• {announcement.timeAgo}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
