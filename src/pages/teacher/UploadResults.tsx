import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BarChart2, Save, CheckCircle, FileText, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePersistentState } from '@/hooks/usePersistentState';

export default function TeacherUploadResults() {
  const { currentUser, getStudentsForTeacher, addResult, results } = useAuth();
  
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{name: string, score: number} | null>(null);

  const [formData, setFormData] = usePersistentState(
    `taskmate:form:upload-results:${currentUser?.id ?? 'guest'}`,
    {
      studentId: '',
      examName: '',
      subject: '',
      marksObtained: '',
      totalMarks: '100',
      remarks: '',
    },
  );

  const teacherStudents = currentUser ? getStudentsForTeacher(currentUser.id) : [];
  const recentResults = results.filter(r => r.teacherId === currentUser?.id).slice(0, 5);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || submitting) return;
    
    setError(null);
    
    // Validate required fields
    if (!formData.studentId || !formData.examName || !formData.subject || !formData.marksObtained) {
      setError('Please fill in all required fields.');
      return;
    }
    
    const marksObtained = Number(formData.marksObtained);
    const totalMarks = Number(formData.totalMarks);
    
    // Validate total marks
    if (totalMarks <= 0) {
      setError('Total marks must be greater than 0.');
      return;
    }
    
    // Validate marks obtained
    if (marksObtained < 0) {
      setError('Marks obtained cannot be negative.');
      return;
    }
    
    if (marksObtained > totalMarks) {
      setError('Marks obtained cannot be greater than total marks.');
      return;
    }

    setSubmitting(true);
    try {
      await addResult({
        studentId: formData.studentId,
        examName: formData.examName,
        subject: formData.subject,
        marksObtained,
        totalMarks,
        remarks: formData.remarks,
        teacherId: currentUser.id
      });

      const student = teacherStudents.find(s => s.id === formData.studentId);
      setLastResult({
        name: student?.name || 'Student',
        score: Math.round((marksObtained / totalMarks) * 100)
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData(prev => ({ ...prev, studentId: '', marksObtained: '', remarks: '' }));
      }, 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the result. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
          <BarChart2 className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload Results</h1>
          <p className="text-muted-foreground mt-1">Record student exam marks</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="glass-card rounded-3xl p-8 lg:col-span-2"
         >
           {success ? (
             <div className="flex flex-col items-center justify-center py-12 text-center h-full">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                 <CheckCircle className="w-8 h-8" />
               </div>
               <h3 className="text-2xl font-bold text-foreground mb-2">Marks Saved</h3>
               {lastResult && (
                 <p className="text-lg text-foreground font-medium mb-4 bg-secondary/50 px-4 py-2 rounded-xl border border-border">
                   {lastResult.name} scored <span className={lastResult.score >= 60 ? 'text-emerald-500' : 'text-red-500'}>{lastResult.score}%</span>
                 </p>
               )}
               <p className="text-muted-foreground">The result has been published to the student's portal.</p>
               <button onClick={() => setSuccess(false)} className="mt-8 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-xl px-6 py-2 transition-colors">
                 Enter another result
               </button>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-6">
               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-foreground ml-1">Select Student</label>
                 <select required name="studentId" value={formData.studentId} onChange={handleChange} className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                   <option value="">Search or select a student...</option>
                   {teacherStudents.map(s => (
                     <option key={s.id} value={s.id}>{s.name} ({s.class}, Roll: {s.rollNumber})</option>
                   ))}
                 </select>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                   <label className="text-sm font-medium text-foreground ml-1">Exam Name</label>
                   <input required type="text" name="examName" value={formData.examName} onChange={handleChange}
                     className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                     placeholder="e.g. September Monthly Test" />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-sm font-medium text-foreground ml-1">Subject</label>
                   <input required type="text" name="subject" value={formData.subject} onChange={handleChange}
                     className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                     placeholder="e.g. Mathematics" />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1.5">
                   <label className="text-sm font-medium text-foreground ml-1">Marks Obtained</label>
                   <input required type="number" name="marksObtained" value={formData.marksObtained} onChange={handleChange}
                     min="0" className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                     placeholder="0" />
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-sm font-medium text-foreground ml-1">Total Marks</label>
                   <input required type="number" name="totalMarks" value={formData.totalMarks} onChange={handleChange}
                     min="1" className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                     placeholder="100" />
                 </div>
               </div>

               <div className="space-y-1.5">
                 <label className="text-sm font-medium text-foreground ml-1">Teacher's Remarks (Optional)</label>
                 <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3}
                   className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                   placeholder="e.g. Excellent improvement in algebra. Keep it up!" />
               </div>

               {error && (
                 <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl">
                   <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                   <span>{error}</span>
                 </div>
               )}

               <div className="pt-4 flex justify-end">
                 <button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl px-8 py-3 transition-colors flex items-center gap-2">
                   <Save className="w-5 h-5" />
                   {submitting ? 'Saving...' : 'Save Result'}
                 </button>
               </div>
             </form>
           )}
         </motion.div>

         <div className="space-y-4">
           <h3 className="font-semibold text-lg text-foreground px-1">Recent Entries</h3>
           {recentResults.length === 0 ? (
             <div className="glass-card rounded-2xl p-6 text-center text-muted-foreground text-sm border border-dashed">
                No recent results uploaded.
             </div>
           ) : (
             <div className="space-y-3">
               {recentResults.map(result => {
                 const student = teacherStudents.find(s => s.id === result.studentId);
                 const pct = Math.round((result.marksObtained / result.totalMarks) * 100);
                 return (
                   <div key={result.id} className="glass-card rounded-2xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                         <div>
                            <p className="font-medium text-foreground">{student?.name || 'Unknown Student'}</p>
                            <p className="text-xs text-muted-foreground">{result.examName} · {result.subject}</p>
                         </div>
                         <div className={`px-2 py-1 rounded text-xs font-bold ${pct >= 60 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' : 'bg-red-100 text-red-700 dark:bg-red-900/30'}`}>
                            {pct}%
                         </div>
                      </div>
                      <div className="text-sm mt-1">
                         <span className="font-semibold">{result.marksObtained}</span> / {result.totalMarks}
                      </div>
                   </div>
                 );
               })}
             </div>
           )}
         </div>
      </div>
    </div>
  );
}
