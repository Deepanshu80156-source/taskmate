import React, { useMemo, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BarChart2, Search, Filter } from 'lucide-react';

export default function TeacherResults() {
  const { currentUser, results, students } = useAuth();
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [examFilter, setExamFilter] = useState('All');

  const teacherResults = useMemo(() => {
    if (!currentUser) return [];
    return results.filter(result => result.teacherId === currentUser.id);
  }, [currentUser, results]);

  const teacherStudents = useMemo(() => students.filter(student => student.teacherId === currentUser?.id), [currentUser, students]);

  const visibleResults = useMemo(() => {
    return teacherResults.filter(result => {
      const student = teacherStudents.find(item => item.id === result.studentId);
      const matchesSearch = !search || student?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesClass = classFilter === 'All' || student?.class === classFilter;
      const matchesSubject = subjectFilter === 'All' || result.subject === subjectFilter;
      const matchesExam = examFilter === 'All' || result.examName === examFilter;
      return matchesSearch && matchesClass && matchesSubject && matchesExam;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [teacherResults, teacherStudents, search, classFilter, subjectFilter, examFilter]);

  const classes = ['All', ...Array.from(new Set(teacherStudents.map(student => student.class).filter(Boolean)))];
  const subjects = ['All', ...Array.from(new Set(teacherResults.map(result => result.subject).filter(Boolean)))];
  const exams = ['All', ...Array.from(new Set(teacherResults.map(result => result.examName).filter(Boolean)))];

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
          <BarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Results Overview</h1>
          <p className="text-muted-foreground mt-1">Search, filter, and review published results</p>
        </div>
      </header>

      <div className="glass-card rounded-2xl p-4 border border-border space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by student name" className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-sm" />
          </label>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
            {classes.map(item => <option key={item} value={item}>{item === 'All' ? 'All classes' : item}</option>)}
          </select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
            {subjects.map(item => <option key={item} value={item}>{item === 'All' ? 'All subjects' : item}</option>)}
          </select>
          <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} className="rounded-xl border border-input bg-background px-3 py-2 text-sm">
            {exams.map(item => <option key={item} value={item}>{item === 'All' ? 'All exams' : item}</option>)}
          </select>
        </div>
      </div>

      {visibleResults.length === 0 ? (
        <div className="glass-card rounded-2xl py-16 text-center text-muted-foreground">No results match the current filters.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleResults.map(result => {
            const student = teacherStudents.find(item => item.id === result.studentId);
            const percentage = Math.round((result.marksObtained / result.totalMarks) * 100);
            return (
              <div key={result.id} className="glass-card rounded-2xl p-5 border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-foreground">{student?.name ?? 'Unknown student'}</p>
                    <p className="text-sm text-muted-foreground">{student?.class ?? 'Class n/a'} · Roll {student?.rollNumber ?? '—'}</p>
                  </div>
                  <div className="text-sm font-semibold text-primary">{percentage}%</div>
                </div>
                <div className="mt-4 text-sm text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Exam:</span> {result.examName}</p>
                  <p><span className="font-medium text-foreground">Subject:</span> {result.subject}</p>
                  <p><span className="font-medium text-foreground">Marks:</span> {result.marksObtained}/{result.totalMarks}</p>
                  {result.remarks && <p><span className="font-medium text-foreground">Remarks:</span> {result.remarks}</p>}
                  <p><span className="font-medium text-foreground">Published:</span> {new Date(result.date).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
