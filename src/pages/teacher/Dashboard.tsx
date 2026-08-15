import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import {
  Users, FileText, BarChart2, Megaphone, BookMarked,
  UserPlus, Upload, Clock, UserPlus as UserPlusIcon,
  MessageCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

function relativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString();
}

const ACTIVITY_ICONS: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  student_registered: { icon: UserPlusIcon, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  notes_uploaded: { icon: Upload, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  result_published: { icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  announcement_posted: { icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  message_sent: { icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
};

export default function TeacherDashboard() {
  const { currentUser, getStudentsForTeacher, notes, results, announcements, getLibraryForTeacher, activityLog } = useAuth();

  if (!currentUser) return null;

  const myStudents = getStudentsForTeacher(currentUser.id);
  const myNotes = notes.filter(n => n.teacherId === currentUser.id);
  const myResults = results.filter(r => r.teacherId === currentUser.id);
  const myAnnouncements = announcements.filter(a => a.teacherId === currentUser.id);
  const myLibrary = getLibraryForTeacher(currentUser.id);
  const myActivity = activityLog.filter(a => a.teacherId === currentUser.id).slice(0, 8);

  const stats = [
    { label: 'Students', value: myStudents.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'Notes', value: myNotes.length, icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Results', value: myResults.length, icon: BarChart2, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Announcements', value: myAnnouncements.length, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { label: 'Library', value: myLibrary.length, icon: BookMarked, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  const quickActions = [
    { label: 'Register Student', icon: UserPlus, href: '/teacher/register-student', hint: 'Ctrl+N', color: 'text-indigo-600', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
    { label: 'Upload Notes', icon: Upload, href: '/teacher/upload-notes', hint: 'Ctrl+U', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { label: 'Upload Results', icon: BarChart2, href: '/teacher/upload-results', hint: 'Ctrl+R', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Announcement', icon: Megaphone, href: '/teacher/announcements', hint: 'Ctrl+K', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold text-foreground">Teacher Portal</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {currentUser.name.split(' ')[0]}! Here's your overview.</p>
      </header>

      {/* Section A — Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-center"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-3xl font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Section B — Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, i) => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.07 }}
              >
                <Link href={action.href}>
                  <div className="glass-card rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg border border-border flex flex-col items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.bg} ${action.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 font-mono">{action.hint}</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Section C — Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card rounded-2xl divide-y divide-border"
        >
          {myActivity.length === 0 ? (
            <div className="py-14 text-center flex flex-col items-center gap-3 text-muted-foreground">
              <Clock className="w-10 h-10 opacity-30" />
              <p className="font-medium text-foreground">No recent activity yet.</p>
              <p className="text-sm">Your activity will appear here once you start using the portal.</p>
            </div>
          ) : (
            myActivity.map(item => {
              const cfg = ACTIVITY_ICONS[item.type] ?? ACTIVITY_ICONS.notes_uploaded;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/20 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">{item.description}</p>
                  </div>
                  <p className="text-xs text-muted-foreground shrink-0">{relativeTime(item.date)}</p>
                </div>
              );
            })
          )}
        </motion.div>
      </div>
    </div>
  );
}
