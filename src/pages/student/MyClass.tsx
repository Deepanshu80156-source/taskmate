import React, { useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Users, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentMyClass() {
  const { currentUser, teacherProfile, students } = useAuth();

  const classmates = useMemo(() => {
    if (!currentUser?.class || !currentUser.teacherId) return [];
    return students.filter(
      student =>
        student.class === currentUser.class &&
        student.teacherId === currentUser.teacherId
    );
  }, [currentUser, students]);

  return (
    <div className="space-y-8">
      <header className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Class</h1>
          <p className="text-muted-foreground mt-1">View your class information and classmates</p>
        </div>
      </header>

      {!currentUser?.class || !currentUser.teacherId ? (
        <div className="glass-card rounded-2xl py-20 flex flex-col items-center gap-3 text-center">
          <span className="text-5xl">📋</span>
          <p className="text-lg font-semibold text-foreground">No class assigned</p>
          <p className="text-sm text-muted-foreground">You have not been assigned to a class yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Class Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl p-6 border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Class</p>
              <p className="text-2xl font-bold text-foreground">{currentUser.class}</p>
            </div>
            <div className="glass-card rounded-2xl p-6 border border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Class Teacher</p>
              {teacherProfile ? (
                <p className="text-2xl font-bold text-foreground">{teacherProfile.name}</p>
              ) : (
                <p className="text-xl text-muted-foreground">—</p>
              )}
            </div>
          </div>

          {/* Classmates */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Classmates ({classmates.length})
            </h2>
            {classmates.length === 0 ? (
              <div className="glass-card rounded-2xl py-16 flex flex-col items-center gap-3 text-center">
                <span className="text-4xl">👥</span>
                <p className="text-foreground font-medium">No classmates yet</p>
                <p className="text-sm text-muted-foreground">You are the only student in this class.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {classmates.map((classmate, index) => {
                  const isCurrentUser = classmate.id === currentUser.id;
                  return (
                    <motion.div
                      key={classmate.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`glass-card rounded-2xl p-4 border ${
                        isCurrentUser
                          ? 'border-primary/40 bg-primary/5'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-semibold shrink-0 overflow-hidden">
                          {classmate.photoUrl ? (
                            <img
                              src={classmate.photoUrl}
                              alt={classmate.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            classmate.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">
                            {classmate.name}
                            {isCurrentUser && (
                              <span className="text-xs font-medium text-primary ml-2">
                                You
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Roll {classmate.rollNumber ?? '—'}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
