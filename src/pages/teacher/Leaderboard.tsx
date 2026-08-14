import React, { useMemo, useState } from 'react';
import { BarChart3, Filter, Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import TaskMateAvatar from '@/components/ui/TaskMateAvatar';

export default function TeacherLeaderboard() {
  const { currentUser, students, results } = useAuth();
  const [classFilter, setClassFilter] = useState('All classes');
  const [subjectFilter, setSubjectFilter] = useState('All subjects');

  const teacherStudents = useMemo(
    () => students.filter((student) => student.teacherId === currentUser?.id),
    [currentUser?.id, students],
  );

  const classes = useMemo(
    () => ['All classes', ...Array.from(new Set(teacherStudents.map((student) => student.class).filter(Boolean)))],
    [teacherStudents],
  );

  const subjects = useMemo(
    () => [
      'All subjects',
      ...Array.from(
        new Set(
          results
            .filter((result) => result.teacherId === currentUser?.id)
            .map((result) => result.subject)
            .filter(Boolean),
        ),
      ),
    ],
    [currentUser?.id, results],
  );

  const leaderboard = useMemo(() => {
    const allowedStudents = teacherStudents.filter(
      (student) => classFilter === 'All classes' || student.class === classFilter,
    );

    return allowedStudents
      .map((student) => {
        const studentResults = results.filter(
          (result) =>
            result.teacherId === currentUser?.id &&
            result.studentId === student.id &&
            (subjectFilter === 'All subjects' || result.subject === subjectFilter) &&
            result.totalMarks > 0,
        );
        const average = studentResults.length
          ? Math.round(
              (studentResults.reduce(
                (sum, result) => sum + (result.marksObtained / result.totalMarks) * 100,
                0,
              ) /
                studentResults.length) *
                10,
            ) / 10
          : 0;
        const best = studentResults.length
          ? Math.max(
              ...studentResults.map((result) =>
                Math.round((result.marksObtained / result.totalMarks) * 1000) / 10,
              ),
            )
          : 0;

        return { student, average, best, exams: studentResults.length };
      })
      .sort((a, b) => b.average - a.average || a.student.name.localeCompare(b.student.name));
  }, [classFilter, currentUser?.id, results, subjectFilter, teacherStudents]);

  return (
    <div className="space-y-7">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Class Leaderboard</h1>
            <p className="mt-1 text-muted-foreground">Compare student performance across your classes.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {teacherStudents.length} students
        </div>
      </header>

      <div className="glass-card flex flex-col gap-3 rounded-2xl border border-border p-4 md:flex-row md:items-end">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Filter className="h-4 w-4 text-primary" /> Filters
        </div>
        <label className="flex-1 text-sm text-muted-foreground">
          Class
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            {classes.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
        <label className="flex-1 text-sm text-muted-foreground">
          Subject
          <select
            value={subjectFilter}
            onChange={(event) => setSubjectFilter(event.target.value)}
            className="mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            {subjects.map((value) => <option key={value}>{value}</option>)}
          </select>
        </label>
      </div>

      {leaderboard.length === 0 ? (
        <div className="glass-card rounded-2xl border border-border py-16 text-center text-muted-foreground">
          <BarChart3 className="mx-auto mb-3 h-10 w-10 opacity-30" />
          No results match the selected filters yet.
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.student.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.035 }}
              className="glass-card flex flex-col gap-4 rounded-2xl border border-border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 text-center text-lg font-bold text-muted-foreground">#{index + 1}</span>
                <TaskMateAvatar
                  name={entry.student.name}
                  photoUrl={entry.student.photoUrl}
                  size={10}
                  className="bg-primary/10 text-primary"
                />
                <div>
                  <p className="font-semibold text-foreground">{entry.student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.student.class ?? 'Unassigned'}
                    {entry.student.rollNumber ? ` · Roll ${entry.student.rollNumber}` : ''}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-5 text-right">
                <div>
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="text-xl font-bold text-foreground">{entry.average}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Best</p>
                  <p className="text-xl font-semibold text-primary">{entry.best}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Exams</p>
                  <p className="text-xl font-semibold text-foreground">{entry.exams}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}