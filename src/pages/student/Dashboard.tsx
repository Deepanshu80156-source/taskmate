import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'wouter';
import {
  BookOpen, BarChart2, Megaphone, MessageCircle,
  User, Settings, FileText, TrendingUp, Bell
} from 'lucide-react';
import { motion } from 'framer-motion';

const SUBJECT_ICONS: Record<string, string> = {
  science: '🧪', math: '➗', mathematics: '➗', english: '📖',
  biology: '🔬', chemistry: '⚗️', physics: '⚡', history: '🏛️',
  geography: '🌍', computer: '💻', urdu: '✍️', islamiat: '☪️',
};
const getSubjectIcon = (subject: string) =>
  SUBJECT_ICONS[subject?.toLowerCase()] ?? '📄';

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function scoreColor(pct: number) {
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 60) return 'text-amber-500';
  return 'text-rose-500';
}

export default function StudentDashboard() {
  const {
    currentUser,
    getNotesForStudent,
    getResultsForStudent,
    getNotificationsUnreadCount,
  } = useAuth();

  if (!currentUser) return null;

  const notes = getNotesForStudent(currentUser);
  const results = getResultsForStudent(currentUser.id);
  const unread = getNotificationsUnreadCount(currentUser.id);
  const recentNotes = notes.slice(0, 3);
  const recentResults = results.slice(0, 2);

  const navCards = [
    { title: 'Notes', icon: BookOpen, href: '/student/notes', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
    { title: 'Results', icon: BarChart2, href: '/student/results', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Announcements', icon: Megaphone, href: '/student/announcements', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
    { title: 'Messages', icon: MessageCircle, href: '/student/messages', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Profile', icon: User, href: '/student/profile', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
    { title: 'Settings', icon: Settings, href: '/student/settings', color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-900/30' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">
          👋 Hello, {currentUser.name.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {currentUser.class ? `Class ${currentUser.class}` : ''}{currentUser.rollNumber ? ` · Roll No. ${currentUser.rollNumber}` : ''}
        </p>

        {/* Stat pills */}
        <div className="flex flex-wrap gap-3 mt-5">
          <span className="flex items-center gap-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium px-3 py-1.5 rounded-full">
            <BookOpen className="w-4 h-4" /> {notes.length} Notes
          </span>
          <span className="flex items-center gap-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium px-3 py-1.5 rounded-full">
            <TrendingUp className="w-4 h-4" /> {results.length} Results
          </span>
          {unread > 0 && (
            <span className="flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-medium px-3 py-1.5 rounded-full">
              <Bell className="w-4 h-4" /> {unread} Unread
            </span>
          )}
        </div>
      </motion.div>

      {/* Recent Notes + Recent Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Notes */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Recent Notes
            </h2>
            <Link href="/student/notes">
              <span className="text-xs text-primary font-medium hover:underline cursor-pointer">View all →</span>
            </Link>
          </div>

          {recentNotes.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <span className="text-4xl">📚</span>
              <p className="font-medium text-foreground text-sm">No Notes Yet</p>
              <p className="text-xs text-muted-foreground">Your teacher hasn't uploaded anything.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotes.map(note => (
                <div key={note.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                  <span className="text-2xl">{getSubjectIcon(note.subject)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{note.filename}</p>
                    <p className="text-xs text-muted-foreground">{note.subject} · {fmtDate(note.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Results */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" /> Recent Results
            </h2>
            <Link href="/student/results">
              <span className="text-xs text-primary font-medium hover:underline cursor-pointer">View all →</span>
            </Link>
          </div>

          {recentResults.length === 0 ? (
            <div className="py-10 flex flex-col items-center gap-2 text-center">
              <span className="text-4xl">📊</span>
              <p className="font-medium text-foreground text-sm">No Results Yet</p>
              <p className="text-xs text-muted-foreground">Your teacher hasn't published any exam results.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentResults.map(result => {
                const pct = result.totalMarks > 0 ? Math.round((result.marksObtained / result.totalMarks) * 100) : 0;
                return (
                  <div key={result.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{result.examName}</p>
                      <p className="text-xs text-muted-foreground">{result.subject} · {fmtDate(result.date)}</p>
                    </div>
                    <span className={`text-lg font-bold ${scoreColor(pct)}`}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Navigation Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {navCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} variants={item}>
              <Link href={card.href}>
                <div className="glass-card rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg h-full flex flex-col items-start gap-3 border border-border">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{card.title}</h2>
                    <p className="text-muted-foreground text-xs mt-0.5">Access your {card.title.toLowerCase()}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
