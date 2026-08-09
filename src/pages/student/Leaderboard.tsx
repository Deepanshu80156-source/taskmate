import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Trophy, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentLeaderboard() {
  const { currentUser, students, results } = useAuth();

  const leaderboard = useMemo(() => {
    if (!currentUser?.class) return [];

    const classmates = students.filter(student => student.role === 'student' && student.class === currentUser.class);

    return classmates
      .map(student => {
        const studentResults = results.filter(result => result.studentId === student.id);
        const average = studentResults.length
          ? Math.round(studentResults.reduce((sum, result) => sum + (result.marksObtained / result.totalMarks) * 100, 0) / studentResults.length)
          : 0;

        return {
          student,
          average,
          exams: studentResults.length,
          best: studentResults.length
            ? Math.max(...studentResults.map(result => Math.round((result.marksObtained / result.totalMarks) * 100)))
            : 0,
        };
      })
      .sort((a, b) => b.average - a.average || a.student.name.localeCompare(b.student.name));
  }, [currentUser, students, results]);

  const currentRank = leaderboard.findIndex(item => item.student.id === currentUser?.id) + 1;

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
          <Trophy className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Leaderboard</h1>
          <p className="text-muted-foreground mt-1">Compare your progress with classmates in {currentUser?.class ?? 'your class'}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="w-4 h-4" />
            Your standing
          </div>
          <div className="mt-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-4xl font-extrabold text-foreground">#{currentRank || '—'}</p>
              <p className="text-sm text-muted-foreground mt-1">Out of {leaderboard.length} students</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current average</p>
              <p className="text-3xl font-bold text-foreground">{leaderboard.find(item => item.student.id === currentUser?.id)?.average ?? 0}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <TrendingUp className="w-4 h-4" />
            How it works
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>• Averages are based on your class results.</li>
            <li>• Exams with higher percentages rank higher.</li>
            <li>• The leaderboard updates as new results are published.</li>
          </ul>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center text-muted-foreground">
          No class results are available yet.
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = entry.student.id === currentUser?.id;
            return (
              <motion.div
                key={entry.student.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`glass-card rounded-2xl p-4 border ${isCurrentUser ? 'border-primary/40 bg-primary/5' : 'border-border'}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                      {entry.student.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{entry.student.name}</p>
                      <p className="text-sm text-muted-foreground">{entry.student.rollNumber ? `Roll ${entry.student.rollNumber}` : 'Classmate'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Average</p>
                      <p className="text-2xl font-bold text-foreground">{entry.average}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Best</p>
                      <p className="text-xl font-semibold text-primary">{entry.best}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Exams</p>
                      <p className="text-xl font-semibold text-foreground">{entry.exams}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
