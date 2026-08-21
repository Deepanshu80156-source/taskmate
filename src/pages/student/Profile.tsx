import React from 'react';
import { useAuth } from '@/context/AuthContext';
import TaskMateAvatar from '@/components/ui/TaskMateAvatar';
import { User, Book, Hash, Phone, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentProfile() {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="space-y-8 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Student Profile</h1>
          <p className="text-muted-foreground mt-1">Your academic details</p>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl overflow-hidden"
      >
        <div className="h-32 bg-primary/20 relative">
          <div className="absolute -bottom-12 left-8 w-24 h-24 rounded-full bg-background p-1.5 shadow-sm">
            <TaskMateAvatar name={currentUser.name} photoUrl={currentUser.photoUrl} size={24} className="w-full h-full rounded-full" fallbackClassName="text-3xl font-bold" />
          </div>
        </div>
        
        <div className="pt-16 pb-8 px-8">
          <h2 className="text-2xl font-bold text-foreground">{currentUser.name}</h2>
          <p className="text-muted-foreground mb-8">Student</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Academic Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Book className="w-5 h-5 text-secondary-foreground/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Class</p>
                      <p className="font-medium text-foreground">{currentUser.class}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Hash className="w-5 h-5 text-secondary-foreground/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Roll Number</p>
                      <p className="font-medium text-foreground">{currentUser.rollNumber}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Guardian Info</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Shield className="w-5 h-5 text-secondary-foreground/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Guardian Name</p>
                      <p className="font-medium text-foreground">{currentUser.guardianName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30">
                    <Phone className="w-5 h-5 text-secondary-foreground/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone Number</p>
                      <p className="font-medium text-foreground">{currentUser.guardianPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-border flex justify-end">
             <p className="text-xs text-muted-foreground">Contact administration to update your profile details.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
