import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  BookOpen, 
  BarChart2, 
  Megaphone, 
  MessageCircle, 
  User, 
  Settings, 
  Users, 
  UserPlus, 
  Upload,
  Trophy,
  LogOut,
  LayoutDashboard,
  BookMarked
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function Sidebar({ mobile }: { mobile?: boolean }) {
  const { currentUser, logout } = useAuth();
  const [location] = useLocation();

  if (!currentUser) return null;

  const isTeacher = currentUser.role === 'teacher';

  const studentLinks = [
    { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/notes', label: 'Notes', icon: BookOpen },
    { href: '/student/results', label: 'Results', icon: BarChart2 },
    { href: '/student/leaderboard', label: 'Leaderboard', icon: Trophy },
    { href: '/student/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/student/library', label: 'Library', icon: BookMarked },
    { href: '/student/messages', label: 'Messages', icon: MessageCircle },
    { href: '/student/profile', label: 'Profile', icon: User },
    { href: '/student/settings', label: 'Settings', icon: Settings },
  ];

  const teacherLinks = [
    { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/students', label: 'Students', icon: Users },
    { href: '/teacher/register-student', label: 'Register Student', icon: UserPlus },
    { href: '/teacher/upload-notes', label: 'Upload Notes', icon: Upload },
    { href: '/teacher/library', label: 'Library', icon: BookMarked },
    { href: '/teacher/upload-results', label: 'Upload Results', icon: BarChart2 },
    { href: '/teacher/results', label: 'Results', icon: BarChart2 },
    { href: '/teacher/announcements', label: 'Announcements', icon: Megaphone },
    { href: '/teacher/messages', label: 'Messages', icon: MessageCircle },
    { href: '/teacher/settings', label: 'Settings', icon: Settings },
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <aside className={`w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full shrink-0 sticky top-0 ${mobile ? '' : 'hidden md:flex'}`}>
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2 text-sidebar-primary-foreground font-semibold text-lg">
          <BookOpen className="w-5 h-5 text-sidebar-primary" />
          TaskMate
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          
          return (
            <Link key={link.href} href={link.href}>
              <div 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
                  isActive 
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' 
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                }`}
                data-testid={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          {/* Avatar — shows photo if set, otherwise letter initial */}
          <div className="w-8 h-8 rounded-full bg-sidebar-primary/20 text-sidebar-primary flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden">
            {currentUser.photoUrl
              ? <img src={currentUser.photoUrl} alt="" className="w-full h-full object-cover" />
              : currentUser.name.charAt(0)
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-primary-foreground truncate">
              {currentUser.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60 truncate capitalize">
              {currentUser.role}
            </p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full rounded-md cursor-pointer transition-colors text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive text-sm"
          data-testid="btn-logout"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );
}
