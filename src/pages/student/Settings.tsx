import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Bell, Lock, Shield, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import TaskMateAvatar from '@/components/ui/TaskMateAvatar';
import { useTheme } from '@/context/ThemeContext';

export default function StudentSettings() {
  const { currentUser, changePassword, updateUserPhoto } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
  const [announceNotif, setAnnounceNotif] = useState(true);
  const [resultsNotif, setResultsNotif] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setPwStatus({ type: 'error', msg: 'New passwords do not match.' });
      return;
    }
    if (newPw.length < 6) {
      setPwStatus({ type: 'error', msg: 'New password must be at least 6 characters.' });
      return;
    }
    if (!currentUser) return;
    const result = await changePassword(oldPw, newPw);
    if (result.success) {
      setPwStatus({ type: 'success', msg: 'Password updated successfully!' });
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } else {
      setPwStatus({ type: 'error', msg: result.error ?? 'Failed to update password.' });
    }
    setTimeout(() => setPwStatus(null), 4000);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    setPhotoStatus('Uploading photo...');
    const result = await updateUserPhoto(currentUser.id, file);
    if (result.success) {
      setPhotoStatus('Photo updated successfully.');
    } else {
      setPhotoStatus(result.error ?? 'Photo upload failed.');
    }
    setTimeout(() => setPhotoStatus(null), 3000);
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900/30 text-slate-600 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage your application preferences</p>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">

          {/* Profile Overview */}
          <div className="p-6 bg-secondary/20">
            <div className="flex items-center gap-5">
              {/* Avatar with change-photo overlay */}
              <div className="relative group shrink-0">
                <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-primary/20 text-primary flex items-center justify-center text-xl font-bold select-none overflow-hidden">
                  <TaskMateAvatar name={currentUser?.name ?? ''} photoUrl={currentUser?.photoUrl} size={18} className="w-full h-full rounded-full" fallbackClassName="text-xl font-bold" />
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change photo"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{currentUser?.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {currentUser?.class ? `${currentUser.class}` : 'Student'}
                  {currentUser?.rollNumber ? ` · Roll ${currentUser.rollNumber}` : ''}
                </p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-1 text-xs text-primary hover:underline"
                >
                  Change profile photo
                </button>
                {photoStatus && (
                  <p className="text-xs text-emerald-600 mt-1">{photoStatus}</p>
                )}
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Toggle dark / light interface</p>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${darkMode ? 'bg-primary' : 'bg-muted'}`}
                role="switch"
                aria-checked={darkMode}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'}`} />
                <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 pointer-events-none">
                  {darkMode && <Moon className="w-3 h-3 text-white" />}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-1.5 pointer-events-none">
                  {!darkMode && <Sun className="w-3 h-3 text-muted-foreground" />}
                </span>
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> Security
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex gap-2 items-center mb-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <p className="font-medium text-foreground">Change Password</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Current Password</label>
                <input type="password" value={oldPw} onChange={e => setOldPw(e.target.value)} required placeholder="••••••••"
                  className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">New Password</label>
                  <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required placeholder="••••••••"
                    className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Confirm Password</label>
                  <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="••••••••"
                    className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                </div>
              </div>

              {pwStatus && (
                <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl ${pwStatus.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'}`}>
                  {pwStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  {pwStatus.msg}
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" className="px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-xl text-sm hover:bg-primary/90 transition-colors">
                  Update Password
                </button>
              </div>
            </form>
          </div>

          {/* Notifications */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" /> Notifications
            </h3>

            <div className="space-y-4">
              {[
                { label: 'New Announcements', desc: 'Get notified when a teacher posts', value: announceNotif, set: setAnnounceNotif },
                { label: 'New Results', desc: 'Get notified when exam marks are added', value: resultsNotif, set: setResultsNotif },
              ].map(({ label, desc, value, set }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex gap-3 items-center">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => set(!value)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-primary' : 'bg-muted'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
