import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserPlus, Save, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { CLASS_LIST } from '@/data/constants';

export default function TeacherRegisterStudent() {
  const { currentUser, addStudent, students } = useAuth();
  
  const [success, setSuccess] = useState(false);
  const [newCreds, setNewCreds] = useState({ username: '', password: '' });
  
  // Do not persist credentials in browser storage.
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    rollNumber: '',
    username: '',
    password: '',
    guardianName: '',
    guardianPhone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [busy, setBusy] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setBusy(true);
    const result = await addStudent({
      name: formData.name,
      class: formData.class,
      rollNumber: formData.rollNumber,
      username: formData.username,
      password: formData.password,
      guardianName: formData.guardianName,
      guardianPhone: formData.guardianPhone,
      teacherId: currentUser.id
    });
    setBusy(false);
    if (!result.success) { alert(result.error ?? 'Failed to register student.'); return; }
    setNewCreds({ username: formData.username, password: formData.password });
    setSuccess(true);
    setFormData({
      name: '',
      class: '',
      rollNumber: '',
      username: '',
      password: '',
      guardianName: '',
      guardianPhone: ''
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
          <UserPlus className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Register Student</h1>
          <p className="text-muted-foreground mt-1">Create a new student account</p>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-8"
      >
        {success ? (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Registration Successful</h3>
              <p className="text-muted-foreground">The student account has been created.</p>
            </div>
            
            <div className="bg-secondary/30 p-6 rounded-xl border border-border w-full max-w-sm">
              <p className="text-sm text-muted-foreground mb-4">Share these credentials with the student:</p>
              <div className="space-y-3 text-left">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Username</p>
                  <p className="text-lg font-mono font-medium text-foreground bg-background px-3 py-2 rounded-lg mt-1 border border-border">{newCreds.username}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</p>
                  <p className="text-lg font-mono font-medium text-foreground bg-background px-3 py-2 rounded-lg mt-1 border border-border">{newCreds.password}</p>
                </div>
              </div>
            </div>

            <button onClick={() => setSuccess(false)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl px-6 py-2.5 transition-colors">
              Register Another Student
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Student Full Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange}
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Radhika" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Class / Grade</label>
                <select required name="class" value={formData.class} onChange={handleChange}
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Select class</option>
                  {CLASS_LIST.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Roll Number</label>
                <input required type="text" name="rollNumber" value={formData.rollNumber} onChange={handleChange}
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 104" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Username (for login)</label>
                <input required type="text" name="username" value={formData.username} onChange={handleChange}
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. radhika_104" />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium text-foreground ml-1">Temporary Password</label>
                <input required type="text" name="password" value={formData.password} onChange={handleChange}
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. pass123" />
              </div>
            </div>

            <hr className="border-border my-6" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Guardian Name</label>
                <input required type="text" name="guardianName" value={formData.guardianName} onChange={handleChange}
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Rahul" />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Guardian Phone Number</label>
                <input required type="tel" name="guardianPhone" value={formData.guardianPhone} onChange={handleChange}
                  className="w-full bg-background/50 border border-input rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 0300-1234567" />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl px-8 py-3 transition-colors flex items-center gap-2">
                <Save className="w-5 h-5" />
                Create Account
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
