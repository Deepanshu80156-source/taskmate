import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { BookOpen, User, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen login-bg flex flex-col">
      <header className="px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-primary font-bold text-2xl">
          <BookOpen className="w-8 h-8" />
          <span>TaskMate</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary font-medium text-sm">
            Organized. Calm. Professional.
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-foreground tracking-tight mb-6">
            Knowledge grows <br className="hidden md:block" />
            <span className="text-primary">one task at a time.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            A quiet, professional space for teachers to run their institute and students to access everything they need.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <Link href="/login/student">
              <div className="glass-card hover-elevate cursor-pointer p-8 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4 text-secondary-foreground">
                  <User className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Student Portal</h2>
                <p className="text-muted-foreground text-sm">Access your notes, results, and messages.</p>
              </div>
            </Link>

            <Link href="/login/teacher">
              <div className="glass-card hover-elevate cursor-pointer p-8 rounded-2xl flex flex-col items-center text-center transition-transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                  <Users className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Teacher Portal</h2>
                <p className="text-muted-foreground text-sm">Manage students, upload notes, and send results.</p>
              </div>
            </Link>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
