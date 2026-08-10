import React, { useEffect } from 'react';
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import NotFound from '@/pages/not-found';
import { AppShell } from '@/components/layout/AppShell';

import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import StudentDashboard from '@/pages/student/Dashboard';
import StudentNotes from '@/pages/student/Notes';
import StudentResults from '@/pages/student/Results';
import StudentLeaderboard from '@/pages/student/Leaderboard';
import StudentMyClass from '@/pages/student/MyClass';
import StudentAnnouncements from '@/pages/student/Announcements';
import StudentLibrary from '@/pages/student/Library';
import StudentMessages from '@/pages/student/Messages';
import StudentProfile from '@/pages/student/Profile';
import StudentSettings from '@/pages/student/Settings';
import TeacherDashboard from '@/pages/teacher/Dashboard';
import TeacherStudents from '@/pages/teacher/Students';
import TeacherRegisterStudent from '@/pages/teacher/RegisterStudent';
import TeacherUploadNotes from '@/pages/teacher/UploadNotes';
import TeacherUploadResults from '@/pages/teacher/UploadResults';
import TeacherResults from '@/pages/teacher/Results';
import TeacherAnnouncements from '@/pages/teacher/Announcements';
import TeacherMessages from '@/pages/teacher/Messages';
import TeacherSettings from '@/pages/teacher/Settings';
import TeacherLibrary from '@/pages/teacher/Library';

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, roleRequired }: { component: React.ComponentType; roleRequired?: string }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Redirect to="/" />;
  if (roleRequired && currentUser.role !== roleRequired) return <Redirect to={`/${currentUser.role}/dashboard`} />;
  return <AppShell><Component /></AppShell>;
}

function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (currentUser) return <Redirect to={`/${currentUser.role}/dashboard`} />;
  return <Component />;
}

function KeyboardShortcuts() {
  const { currentUser } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (currentUser?.role !== 'teacher') return;
    const h = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      switch (e.key.toLowerCase()) {
        case 'n': e.preventDefault(); setLocation('/teacher/register-student'); break;
        case 'u': e.preventDefault(); setLocation('/teacher/upload-notes'); break;
        case 'r': e.preventDefault(); setLocation('/teacher/upload-results'); break;
        case 'k': e.preventDefault(); setLocation('/teacher/announcements'); break;
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [currentUser, setLocation]);
  return null;
}

function AppLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 animate-pulse" />
        <p className="text-muted-foreground text-sm">Loading TaskMate…</p>
      </div>
    </div>
  );
}

function AppRouter() {
  const { loading } = useAuth();
  if (loading) return <AppLoading />;
  return (
    <>
      <KeyboardShortcuts />
      <Switch>
        <Route path="/"           component={() => <PublicRoute component={LandingPage} />} />
        <Route path="/login/:role" component={() => <PublicRoute component={LoginPage} />} />
        <Route path="/student/dashboard"     component={() => <ProtectedRoute component={StudentDashboard}    roleRequired="student" />} />
        <Route path="/student/notes"         component={() => <ProtectedRoute component={StudentNotes}        roleRequired="student" />} />
        <Route path="/student/results"       component={() => <ProtectedRoute component={StudentResults}      roleRequired="student" />} />
        <Route path="/student/leaderboard"   component={() => <ProtectedRoute component={StudentLeaderboard}  roleRequired="student" />} />
        <Route path="/student/class"         component={() => <ProtectedRoute component={StudentMyClass}      roleRequired="student" />} />
        <Route path="/student/announcements" component={() => <ProtectedRoute component={StudentAnnouncements} roleRequired="student" />} />
        <Route path="/student/library"        component={() => <ProtectedRoute component={StudentLibrary}       roleRequired="student" />} />
        <Route path="/student/messages"      component={() => <ProtectedRoute component={StudentMessages}     roleRequired="student" />} />
        <Route path="/student/profile"       component={() => <ProtectedRoute component={StudentProfile}      roleRequired="student" />} />
        <Route path="/student/settings"      component={() => <ProtectedRoute component={StudentSettings}     roleRequired="student" />} />
        <Route path="/teacher/dashboard"         component={() => <ProtectedRoute component={TeacherDashboard}       roleRequired="teacher" />} />
        <Route path="/teacher/students"          component={() => <ProtectedRoute component={TeacherStudents}        roleRequired="teacher" />} />
        <Route path="/teacher/register-student"  component={() => <ProtectedRoute component={TeacherRegisterStudent} roleRequired="teacher" />} />
        <Route path="/teacher/upload-notes"      component={() => <ProtectedRoute component={TeacherUploadNotes}     roleRequired="teacher" />} />
        <Route path="/teacher/upload-results"    component={() => <ProtectedRoute component={TeacherUploadResults}   roleRequired="teacher" />} />
        <Route path="/teacher/results"           component={() => <ProtectedRoute component={TeacherResults}         roleRequired="teacher" />} />
        <Route path="/teacher/announcements"     component={() => <ProtectedRoute component={TeacherAnnouncements}   roleRequired="teacher" />} />
        <Route path="/teacher/messages"          component={() => <ProtectedRoute component={TeacherMessages}        roleRequired="teacher" />} />
        <Route path="/teacher/settings"          component={() => <ProtectedRoute component={TeacherSettings}        roleRequired="teacher" />} />
        <Route path="/teacher/library"           component={() => <ProtectedRoute component={TeacherLibrary}         roleRequired="teacher" />} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <WouterRouter>
              <AppRouter />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
