import React, { useState, useRef } from 'react';
import { Settings as SettingsIcon, Moon, Sun, Lock, Shield, Palette, CheckCircle2, XCircle, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import TaskMateAvatar from '@/components/ui/TaskMateAvatar';
import { useTheme } from '@/context/ThemeContext';

export default function TeacherSettings() {
  const { currentUser, changePassword, updateUserPhoto } = useAuth();
  const { darkMode, toggleDarkMode, themeColor, setThemeColor } = useTheme();

  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwStatus, setPwStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [photoStatus, setPhotoStatus] = useState<string | null>(null);
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

  const colors: { key: 'green' | 'blue' | 'purple'; label: string; cls: string }[] = [
    { key: 'green',  label: 'Green',  cls: 'bg-emerald-600' },
    { key: 'blue',   label: 'Blue',   cls: 'bg-blue-600' },
    { key: 'purple', label: 'Purple', cls: 'bg-purple-600' },
  ];

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900/30 text-slate-600 flex items-center justify-center">
          <SettingsIcon className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage portal preferences and security</p>
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="glass-card rounded-2xl overflow-hidden divide-y divide-border">

          {/* Profile Overview */}
          <div className="p-6 bg-secondary/20">
            <div className="flex items-center gap-5">
              {/* Avatar with change-photo overlay */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center text-3xl font-bold select-none overflow-hidden">
                  <TaskMateAvatar name={currentUser?.name ?? ''} photoUrl={currentUser?.photoUrl} size={20} className="w-full h-full rounded-full" fallbackClassName="text-3xl font-bold" />
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Change photo"
                >
                  <Camera className="w-5 h-5 text-white" />
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="sr-only" onChange={handlePhotoChange} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{currentUser?.name}</h3>
                <p className="text-muted-foreground text-sm">Administrator · Head Teacher</p>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-2 text-xs text-primary hover:underline"
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
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" /> Appearance
            </h3>

            {/* Dark Mode */}
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

            {/* Theme Color */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-foreground">Theme Color</p>
                <p className="text-sm text-muted-foreground">Choose your portal accent color</p>
              </div>
              <div className="flex gap-3">
                {colors.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setThemeColor(c.key)}
                    title={c.label}
                    className={`w-8 h-8 rounded-full ${c.cls} transition-all ${
                      themeColor === c.key
                        ? 'ring-2 ring-offset-2 ring-offset-background ring-current scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
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

              <div className="grid grid-cols-1 gap-3">
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
                    <label className="text-sm font-medium text-muted-foreground">Confirm New Password</label>
                    <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required placeholder="••••••••"
                      className="w-full mt-1 bg-background/50 border border-input rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                  </div>
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

        </div>
      </motion.div>
    </div>
  );
}
