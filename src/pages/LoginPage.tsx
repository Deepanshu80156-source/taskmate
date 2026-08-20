import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User as UserIcon, AlertCircle, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/data/mockData';

type PageMode = 'signin' | 'create';

export default function LoginPage() {
  const { role } = useParams<{ role: string }>();
  const [, setLocation] = useLocation();
  const { login, registerTeacher } = useAuth();

  const validRole = (role === 'student' || role === 'teacher') ? role as Role : 'student';
  const [mode, setMode] = useState<PageMode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const resetForm = () => { setUsername(''); setPassword(''); setConfirmPassword(''); setName(''); setError(''); };
  const switchMode = (next: PageMode) => { resetForm(); setMode(next); };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) { setError('Please enter both username and password.'); return; }
    setBusy(true);
    const result = await login(username, password, validRole);
    setBusy(false);
    if (result.success) {
      setLocation(`/${validRole}/dashboard`);
    } else {
      setError(result.error ?? 'Incorrect username or password.');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !username.trim() || !password.trim() || !confirmPassword.trim()) { setError('Please fill in all fields.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setBusy(true);
    const result = await registerTeacher(name, username, password);
    setBusy(false);
    if (result.success) {
      setLocation('/teacher/dashboard');
    } else {
      setError(result.error ?? 'Could not create account.');
    }
  };

  const isTeacher = validRole === 'teacher';
  const inputCls = 'w-full bg-background/50 border border-input rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all';

  return (
    <div className="min-h-screen login-bg flex flex-col items-center justify-center p-6">
      <div className="absolute top-6 left-6 flex items-center gap-2 text-primary font-bold text-xl cursor-pointer" onClick={() => setLocation('/')}>
        <img src="/taskmate-mark.svg" alt="" className="w-7 h-7" /><span>TaskMate</span>
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-card rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${isTeacher ? 'bg-primary/10 text-primary' : 'bg-secondary/50 text-secondary-foreground'}`}>
            {isTeacher && mode === 'create' ? <UserPlus className="w-8 h-8" /> : <UserIcon className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-bold text-foreground capitalize">
            {isTeacher ? (mode === 'create' ? 'Create Account' : 'Teacher Login') : 'Student Login'}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {isTeacher ? (mode === 'create' ? 'Create an account, then wait for administrator approval.' : 'Welcome back. Sign in to manage your class.') : 'Enter your credentials provided by your teacher.'}
          </p>
        </div>

        {isTeacher && (
          <div className="flex rounded-xl overflow-hidden border border-border mb-6 text-sm font-medium">
            <button type="button" onClick={() => switchMode('signin')} className={`flex-1 py-2.5 transition-colors ${mode === 'signin' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}>Sign In</button>
            <button type="button" onClick={() => switchMode('create')} className={`flex-1 py-2.5 transition-colors ${mode === 'create' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:text-foreground'}`}>Create Account</button>
          </div>
        )}

        <AnimatePresence mode="wait">
          {mode === 'signin' && (
            <motion.form key="signin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} onSubmit={handleSignIn} className="space-y-5">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Username</label>
                <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} placeholder="Enter your username" autoComplete="username" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Enter your password" autoComplete="current-password" /></div>
              </div>
              <button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-3 mt-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Signing in…</> : 'Sign In'}
              </button>
            </motion.form>
          )}

          {mode === 'create' && isTeacher && (
            <motion.form key="create" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} onSubmit={handleCreateAccount} className="space-y-5">
              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Full Name</label>
                <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="Your full name" autoComplete="name" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Username</label>
                <div className="relative"><UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} className={inputCls} placeholder="Choose a username" autoComplete="username" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputCls} placeholder="Choose a password (min. 8 chars)" autoComplete="new-password" /></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground ml-1">Confirm Password</label>
                <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputCls} placeholder="Repeat your password" autoComplete="new-password" /></div>
              </div>
              <button type="submit" disabled={busy} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl py-3 mt-2 transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : 'Create Account'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
