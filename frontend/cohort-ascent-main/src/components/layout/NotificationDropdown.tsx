import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  X,
  Clock,
  Users,
  FileText,
  Info,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Zap,
  MoreVertical,
  CheckCheck
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isThisWeek } from 'date-fns';
import { useNotificationStore } from '@/stores/notificationStore';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationType } from '@/types/notification';
import { useAuthStore } from '@/stores/authStore';

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'COHORT_ASSIGNMENT':
    case 'COHORT_CREATED':
      return Users;
    case 'REPORT_SUBMITTED':
      return FileText;
    case 'ROLE_UPDATE':
      return Zap;
    case 'SYSTEM_ALERT':
    case 'COMPLIANCE_DEADLINE':
      return AlertTriangle;
    case 'COHORT_COMPLETED':
      return CheckCircle2;
    default:
      return Info;
  }
};

const getNotificationColor = (type: NotificationType) => {
  switch (type) {
    case 'SYSTEM_ALERT':
    case 'COMPLIANCE_DEADLINE':
      return 'text-destructive neon-glow-destructive';
    case 'COHORT_COMPLETED':
      return 'text-success neon-glow-success';
    case 'ROLE_UPDATE':
      return 'text-secondary neon-glow-secondary';
    default:
      return 'text-primary neon-glow-primary';
  }
};

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearHistory } = useNotificationStore();

  // Initialize notifications hook
  useNotifications();

  const groupedNotifications = useMemo(() => {
    const today: any[] = [];
    const thisWeek: any[] = [];
    const earlier: any[] = [];

    notifications.filter(n => !n.isRead).forEach((n) => {
      const date = new Date(n.createdAt);
      if (isToday(date)) today.push(n);
      else if (isThisWeek(date)) thisWeek.push(n);
      else earlier.push(n);
    });

    return { today, thisWeek, earlier };
  }, [notifications]);

  const handleNotificationClick = (n: any) => {
    markAsRead(n.id);
    if (n.link) navigate(n.link);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative group rounded-full p-3 text-muted-foreground transition-all duration-500 hover:text-primary focus:outline-none">
          {/* Unique Real-time Alert System */}
          {unreadCount > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Sonar Ping Layers */}
              <div className="absolute inset-0 rounded-full border border-primary/40 animate-sonar-ping" />
              <div className="absolute inset-0 rounded-full border border-primary/20 animate-sonar-ping [animation-delay:0.5s]" />
              <div className="absolute inset-0 rounded-full border border-primary/10 animate-sonar-ping [animation-delay:1s]" />

              {/* Rotating Halo Ring */}
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary/60 border-r-primary/20 animate-halo-rotate" />
            </div>
          )}

          <div className="relative z-10">
            <Bell className={`h-5 w-5 transition-all duration-500 ${unreadCount > 0 ? 'text-primary drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'group-hover:scale-110'}`} />
          </div>

          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -right-1 -top-1 z-20 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-glow-cyan"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[420px] p-0 border-border/50 bg-background/80 backdrop-blur-2xl shadow-elevated rounded-2xl overflow-hidden"
        align="end"
        sideOffset={12}
      >
        {/* Header */}
        <div className="relative px-5 py-4 border-b border-border/30 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold gradient-text">Command Center</h3>
              <span className="px-2 py-0.5 rounded-full bg-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                Live
              </span>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              {user?.role === 'ADMIN' && (
                <button
                  onClick={clearHistory}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                  title="Clear History"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
          {notifications.length > 0 ? (
            <div className="p-2 space-y-4 pb-4">
              {Object.entries(groupedNotifications).map(([key, items]) => (
                items.length > 0 && (
                  <div key={key} className="space-y-2">
                    <h4 className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                      {key === 'today' ? 'Today' : key === 'thisWeek' ? 'This Week' : 'Earlier'}
                    </h4>
                    <div className="space-y-1">
                      <AnimatePresence mode="popLayout">
                        {items.map((n, index) => {
                          const Icon = getNotificationIcon(n.type);
                          const colorClass = getNotificationColor(n.type);

                          return (
                            <motion.div
                              key={n.id}
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              onClick={() => handleNotificationClick(n)}
                              className={`
                                relative group flex gap-4 p-4 rounded-xl cursor-pointer transition-all duration-300
                                ${n.isRead
                                  ? 'bg-transparent opacity-60 hover:opacity-100 hover:bg-muted/30'
                                  : 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary glow-cyan-subtle'
                                }
                              `}
                            >
                              <div className={`
                                flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl 
                                bg-muted/50 border border-border/50 group-hover:border-primary/30 transition-colors
                                ${colorClass}
                              `}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className={`text-sm font-bold truncate ${n.isRead ? 'text-foreground' : 'text-primary'}`}>
                                    {n.title}
                                  </p>
                                  <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap">
                                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {n.message}
                                </p>

                                {/* Status Reveal on Hover */}
                                <div className="flex items-center gap-3 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[10px] font-bold text-primary flex items-center gap-1 uppercase tracking-wider">
                                    <Zap className="h-3 w-3" /> View Details
                                  </span>
                                  {!n.isRead && (
                                    <span
                                      className="text-[10px] font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 uppercase tracking-wider"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(n.id);
                                      }}
                                    >
                                      Mark read
                                    </span>
                                  )}
                                </div>
                              </div>

                              {!n.isRead && (
                                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary shadow-glow-cyan" />
                              )}
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center px-10">
              <div className="h-16 w-16 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="text-sm font-medium text-foreground">All clear for now</p>
              <p className="mt-1 text-xs text-muted-foreground">We'll alert you when something mission-critical happens.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/30 bg-muted/10">
          <button
            className="w-full py-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all duration-200 uppercase tracking-widest"
            onClick={() => {
              navigate('/activity');
              setIsOpen(false);
            }}
          >
            Access Full Audit Log
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};