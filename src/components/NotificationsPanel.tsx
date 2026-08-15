import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, CheckCircle2, BookOpen, BarChart2, Megaphone, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

type NotifType = 'notes' | 'result' | 'announcement' | 'message';

const TYPE_CONFIG: Record<NotifType, { icon: React.ElementType; bg: string; text: string }> = {
  notes: { icon: BookOpen, bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600' },
  result: { icon: BarChart2, bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600' },
  announcement: { icon: Megaphone, bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600' },
  message: { icon: MessageCircle, bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600' },
};

export function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { currentUser, getNotificationsForStudent, markNotificationRead, markAllNotificationsRead } = useAuth();

  if (!currentUser) return null;

  const notifications = getNotificationsForStudent(currentUser.id);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute top-16 right-4 md:right-8 w-80 max-h-[420px] bg-background border border-border shadow-xl rounded-2xl flex flex-col z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/30">
        <h3 className="font-bold flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllNotificationsRead(currentUser.id)}
            className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 opacity-20" />
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          notifications.map(notif => {
            const typeKey = (notif.type ?? 'notes') as NotifType;
            const cfg = TYPE_CONFIG[typeKey] ?? TYPE_CONFIG.notes;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                onClick={() => !notif.read && markNotificationRead(notif.id)}
                className={`p-3 rounded-xl text-sm transition-colors cursor-pointer flex gap-3 items-start ${
                  notif.read
                    ? 'bg-transparent hover:bg-secondary/50'
                    : 'bg-primary/5 hover:bg-primary/10'
                }`}
              >
                {/* Type icon circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.bg} ${cfg.text}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className={`text-foreground leading-snug ${notif.read ? '' : 'font-medium'}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.date).toLocaleDateString()}{' '}
                    {new Date(notif.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Unread dot */}
                {!notif.read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
