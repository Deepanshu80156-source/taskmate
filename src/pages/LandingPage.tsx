import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import {
  BookOpen, Users, Upload, BarChart2, Megaphone,
  MessageCircle, Bell, ShieldCheck, ArrowRight, CheckCircle2
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  {
    icon: Upload,
    color: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    title: 'Upload Notes & Materials',
    desc: 'Teachers upload PDFs and study files. Students access them instantly, organized by subject.',
  },
  {
    icon: BarChart2,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    title: 'Publish Exam Results',
    desc: 'Share marks with individual students privately. Visual charts show performance over time.',
  },
  {
    icon: Megaphone,
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    title: 'Class Announcements',
    desc: 'Broadcast to the whole class or a specific group. Students are notified instantly.',
  },
  {
    icon: MessageCircle,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    title: 'Direct Messaging',
    desc: 'Private one-on-one chat between teacher and each student. Real-time delivery.',
  },
  {
    icon: Bell,
    color: 'text-rose-600',
    bg: 'bg-rose-100 dark:bg-rose-900/30',
    title: 'Smart Notifications',
    desc: 'Students are alerted the moment notes, results, or messages arrive — no refresh needed.',
  },
  {
    icon: ShieldCheck,
    color: 'text-indigo-600',
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    title: 'Secure & Private',
    desc: 'Row-level security ensures every student sees only their own data. Nothing leaks across.',
  },
];

const steps = [
  { num: '01', title: 'Teacher registers', desc: 'Create your account in seconds and set up your institute.' },
  { num: '02', title: 'Add students', desc: 'Register each student with their class, roll number, and login.' },
  { num: '03', title: 'Share everything', desc: 'Upload notes, publish results, send messages — all in one place.' },
  { num: '04', title: 'Students stay updated', desc: 'Notifications keep students informed the moment anything changes.' },
];

const highlights = [
  'No monthly fees during beta',
  'Works on any device',
  'Dark mode included',
  'PWA — install like an app',
];

export default function LandingPage() {
  return (
    <div className="min-h-screen login-bg flex flex-col">

      {/* ── Nav ── */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2 text-primary font-extrabold text-2xl tracking-tight">
          <BookOpen className="w-7 h-7" />
          TaskMate
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login/student">
            <span className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer hidden sm:inline">
              Student login
            </span>
          </Link>
          <Link href="/login/teacher">
            <span className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer">
              Teacher login
            </span>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center max-w-5xl mx-auto w-full">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6"
        >
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          Organized. Calm. Professional.
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="text-5xl md:text-7xl font-extrabold text-foreground tracking-tight leading-[1.08] mb-6"
        >
          Run your institute,{' '}
          <span className="text-primary">not your inbox.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-10"
        >
          TaskMate gives teachers a quiet, professional space to manage students, 
          share notes, publish results, and stay connected — all without the noise.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/login/teacher">
            <div className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer text-base">
              <Users className="w-5 h-5" />
              Teacher Portal
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
          <Link href="/login/student">
            <div className="flex items-center justify-center gap-2 glass-card border border-border text-foreground font-semibold px-8 py-4 rounded-2xl hover:border-primary/40 transition-all hover:-translate-y-0.5 cursor-pointer text-base">
              <BookOpen className="w-5 h-5" />
              Student Portal
            </div>
          </Link>
        </motion.div>

        {/* Highlight pills */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="flex flex-wrap justify-center gap-3 mt-10"
        >
          {highlights.map(h => (
            <span key={h} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
              {h}
            </span>
          ))}
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section className="px-6 py-20 max-w-6xl mx-auto w-full">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Everything in one place
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            No more juggling WhatsApp groups, shared drives, and paper reports.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i * 0.8}
                className="glass-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${f.bg} ${f.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="px-6 py-20 bg-primary/5 border-y border-primary/10">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
              Up and running in minutes
            </h2>
            <p className="text-muted-foreground text-lg">No training. No IT department. No nonsense.</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i * 0.9}
                className="flex flex-col"
              >
                <span className="text-5xl font-extrabold text-primary/20 leading-none mb-4 font-mono">
                  {step.num}
                </span>
                <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── For Both Roles ── */}
      <section className="px-6 py-20 max-w-5xl mx-auto w-full">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3">
            Built for both sides of the classroom
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Teacher card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={0}
            className="glass-card rounded-3xl p-8 border border-border"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">For Teachers</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                'Register and manage your full student directory',
                'Upload PDFs, notes, and study material per class',
                'Publish individual exam results privately',
                'Broadcast announcements to specific classes',
                'Chat directly with any student',
                'Track all activity in a live dashboard',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login/teacher">
              <div className="mt-7 flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl hover:bg-primary/90 transition-colors cursor-pointer w-fit text-sm">
                Teacher Login <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </motion.div>

          {/* Student card */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            custom={1}
            className="glass-card rounded-3xl p-8 border border-border"
          >
            <div className="w-14 h-14 rounded-2xl bg-secondary/80 text-secondary-foreground flex items-center justify-center mb-5">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-3">For Students</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                'Access class notes and study materials anytime',
                'View your personal exam results with score charts',
                'Read class announcements from your teacher',
                'Message your teacher directly and privately',
                'Get notified instantly when something new arrives',
                'Works on phone, tablet, or desktop',
              ].map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/login/student">
              <div className="mt-7 flex items-center gap-2 glass-card border border-border text-foreground font-semibold px-5 py-3 rounded-xl hover:border-primary/40 transition-colors cursor-pointer w-fit text-sm">
                Student Login <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Footer CTA ── */}
      <section className="px-6 py-16 text-center max-w-3xl mx-auto w-full">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Your institute, organized.
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join TaskMate and spend less time managing — and more time teaching.
          </p>
          <Link href="/login/teacher">
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-all hover:-translate-y-0.5 hover:shadow-lg cursor-pointer text-base">
              Get started as a Teacher <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="px-6 py-8 border-t border-border text-center text-xs text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2 text-primary font-bold text-base">
          <BookOpen className="w-4 h-4" />
          TaskMate
        </div>
        A quiet, professional school management platform.
      </footer>
    </div>
  );
}
