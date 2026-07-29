import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, Search, Trash2, Edit, Download, CreditCard, KeyRound, UserPlus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'wouter';
import { User } from '@/data/mockData';

export default function TeacherStudents() {
  const { currentUser, getStudentsForTeacher, removeStudent, updateStudent, resetStudentPassword } = useAuth();

  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('All');
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  const [idCardStudent, setIdCardStudent] = useState<User | null>(null);
  const [resetTarget, setResetTarget] = useState<User | null>(null);
  const [resetPw, setResetPw] = useState('');
  const [resetDone, setResetDone] = useState(false);

  const teacherStudents = currentUser ? getStudentsForTeacher(currentUser.id) : [];
  const classes = ['All', ...Array.from(new Set(teacherStudents.map(s => s.class).filter(Boolean)))];

  const filteredStudents = teacherStudents.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.rollNumber && s.rollNumber.includes(search));
    const matchesClass = filterClass === 'All' || s.class === filterClass;
    return matchesSearch && matchesClass;
  });

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name}? This action cannot be undone.`)) {
      await removeStudent(id);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStudent) {
      await updateStudent(editingStudent.id, {
        name: editingStudent.name,
        class: editingStudent.class,
        rollNumber: editingStudent.rollNumber,
        guardianName: editingStudent.guardianName,
        guardianPhone: editingStudent.guardianPhone,
      });
      setEditingStudent(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget || !resetPw) return;
    const res = await resetStudentPassword(resetTarget.id, resetPw);
    if (res.success) {
      setResetDone(true);
      setResetPw('');
      setTimeout(() => { setResetDone(false); setResetTarget(null); }, 2000);
    } else {
      alert(res.error ?? 'Failed to reset password.');
    }
  };

  const exportCSV = () => {
    const rows = [
      ['Name', 'Class', 'Roll No', 'Guardian Name', 'Guardian Phone', 'Username'],
      ...filteredStudents.map(s => [
        s.name, s.class ?? '', s.rollNumber ?? '',
        s.guardianName ?? '', s.guardianPhone ?? '', s.username ?? '',
      ]),
    ];
    const csv = rows.map(r => r.map(v => JSON.stringify(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'students.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 relative">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Students Directory</h1>
            <p className="text-muted-foreground mt-1">{teacherStudents.length} enrolled student{teacherStudents.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          disabled={filteredStudents.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground border border-border rounded-xl text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-40"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-muted-foreground">
        <span className="text-lg leading-none">💡</span>
        <p>Students who forget their password should contact you. Use the <strong className="text-foreground">🔑 reset</strong> button in the table to set a new password for them.</p>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-md bg-background shadow-xl"
            >
              <h2 className="text-xl font-bold mb-4">Edit Student</h2>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input required type="text" value={editingStudent.name} onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })} className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Class</label>
                    <input required type="text" value={editingStudent.class} onChange={e => setEditingStudent({ ...editingStudent, class: e.target.value })} className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Roll No</label>
                    <input required type="text" value={editingStudent.rollNumber} onChange={e => setEditingStudent({ ...editingStudent, rollNumber: e.target.value })} className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Guardian Name</label>
                  <input required type="text" value={editingStudent.guardianName} onChange={e => setEditingStudent({ ...editingStudent, guardianName: e.target.value })} className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-sm font-medium">Guardian Phone</label>
                  <input required type="text" value={editingStudent.guardianPhone} onChange={e => setEditingStudent({ ...editingStudent, guardianPhone: e.target.value })} className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setEditingStudent(null)} className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-secondary text-sm">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ID Card Modal */}
      <AnimatePresence>
        {idCardStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm bg-background shadow-xl print-id-card"
            >
              <div className="flex items-center justify-between mb-5">
                <span className="font-bold text-primary text-lg">📘 TaskMate</span>
                <button onClick={() => setIdCardStudent(null)} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary print:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold">
                  {idCardStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{idCardStudent.name}</p>
                  <p className="text-sm text-muted-foreground">{idCardStudent.class ? `Class ${idCardStudent.class}` : 'Student'}</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roll No.</span>
                  <span className="font-medium">{idCardStudent.rollNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Guardian</span>
                  <span className="font-medium">{idCardStudent.guardianName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="font-medium">{idCardStudent.guardianPhone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-medium font-mono text-xs">{idCardStudent.username || '—'}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 print:hidden">
                <button onClick={() => setIdCardStudent(null)} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-secondary">Close</button>
                <button onClick={() => window.print()} className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">🖨️ Print</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-sm bg-background shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Reset Password</h2>
                <button onClick={() => { setResetTarget(null); setResetDone(false); setResetPw(''); }} className="p-1 rounded-lg text-muted-foreground hover:bg-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Set a new password for <strong className="text-foreground">{resetTarget.name}</strong>.
              </p>
              {resetDone ? (
                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm">
                  ✅ Password has been reset successfully!
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <input
                    type="password"
                    value={resetPw}
                    onChange={e => setResetPw(e.target.value)}
                    required
                    minLength={4}
                    placeholder="New password (min 4 characters)"
                    className="w-full bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setResetTarget(null); setResetPw(''); }} className="flex-1 px-4 py-2 rounded-xl border border-border text-sm hover:bg-secondary">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Reset</button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Table card */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or roll number…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
            />
          </div>
          <select
            value={filterClass}
            onChange={e => setFilterClass(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-input bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary text-sm min-w-[150px]"
          >
            {classes.map(c => (
              <option key={c as string} value={c as string}>{c as string}</option>
            ))}
          </select>
        </div>

        {teacherStudents.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <span className="text-5xl">👥</span>
            <p className="text-lg font-semibold text-foreground">No Students Yet</p>
            <p className="text-sm text-muted-foreground">Register your first student to get started.</p>
            <Link href="/teacher/register-student">
              <button className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90">
                <UserPlus className="w-4 h-4" /> Register Student
              </button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-sm">
                  <th className="py-3 px-4 font-semibold">Name</th>
                  <th className="py-3 px-4 font-semibold">Class</th>
                  <th className="py-3 px-4 font-semibold">Roll No.</th>
                  <th className="py-3 px-4 font-semibold">Guardian Contact</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-muted-foreground text-sm">
                      No students match your search.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student, i) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setIdCardStudent(student)}
                          className="flex items-center gap-3 hover:text-primary transition-colors text-left"
                          title="View ID card"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {student.name.charAt(0)}
                          </div>
                          <span className="font-medium text-foreground hover:underline">{student.name}</span>
                        </button>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{student.class}</td>
                      <td className="py-3 px-4 text-muted-foreground text-sm">{student.rollNumber}</td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <p className="text-foreground">{student.guardianName}</p>
                          <p className="text-muted-foreground text-xs">{student.guardianPhone}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => setIdCardStudent(student)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="ID Card">
                            <CreditCard className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setResetTarget(student); setResetDone(false); setResetPw(''); }} className="p-2 rounded-lg text-muted-foreground hover:bg-amber-100 hover:text-amber-600 dark:hover:bg-amber-900/30 transition-colors" title="Reset Password">
                            <KeyRound className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingStudent(student)} className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(student.id, student.name)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          .print-id-card { display: block !important; position: fixed; top: 20px; left: 20px; }
        }
      `}</style>
    </div>
  );
}
