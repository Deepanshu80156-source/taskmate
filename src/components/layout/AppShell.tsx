import React, { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Menu, LogOut, X, Bell } from 'lucide-react';
import { useLocation } from 'wouter';
import { NotificationsPanel } from '../NotificationsPanel';
import { AnimatePresence } from 'framer-motion';

export function AppShell({ children }: { children: ReactNode }) {
  const { currentUser, logout, getNotificationsUnreadCount } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [location] = useLocation();

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location]);

  const unreadNotifs = currentUser && currentUser.role === 'student' ? getNotificationsUnreadCount(currentUser.id) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row relative">
      <Sidebar />
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between h-16 bg-sidebar px-4 text-sidebar-primary-foreground sticky top-0 z-20">
        <div className="flex items-center gap-2 font-semibold">
          <Menu 
            className="w-6 h-6 mr-2 cursor-pointer" 
            onClick={() => setMobileMenuOpen(true)}
          />
          TaskMate
        </div>
        <div className="flex items-center gap-4">
           {currentUser?.role === 'student' && (
             <button onClick={() => setNotificationsOpen(!notificationsOpen)} className="relative p-1">
                <Bell className="w-5 h-5 text-sidebar-foreground/80" />
                {unreadNotifs > 0 && (
                   <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-sidebar"></span>
                )}
             </button>
           )}
           <button onClick={logout} className="p-1">
             <LogOut className="w-5 h-5 text-sidebar-foreground/80" />
           </button>
        </div>
      </div>

      {/* Desktop Header Notification Bell */}
      <div className="hidden md:flex absolute top-6 right-8 z-30">
        {currentUser?.role === 'student' && (
           <button 
             onClick={() => setNotificationsOpen(!notificationsOpen)} 
             className="relative p-2 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
           >
              <Bell className="w-5 h-5" />
              {unreadNotifs > 0 && (
                 <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background"></span>
              )}
           </button>
        )}
      </div>

      <AnimatePresence>
         {notificationsOpen && currentUser?.role === 'student' && (
            <NotificationsPanel onClose={() => setNotificationsOpen(false)} />
         )}
      </AnimatePresence>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-sidebar h-full flex flex-col z-50 shadow-xl slide-in-from-left-2 animate-in duration-200">
            <button 
              className="absolute top-4 right-4 p-2 text-sidebar-foreground/60 hover:text-sidebar-foreground z-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
            <div className="w-full flex-1 overflow-y-auto relative z-40">
              <div className="block md:hidden pointer-events-auto h-full">
                 <Sidebar mobile />
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto overflow-x-hidden p-4 md:p-8 relative z-10" onClick={() => notificationsOpen && setNotificationsOpen(false)}>
        {children}
      </main>
    </div>
  );
}
