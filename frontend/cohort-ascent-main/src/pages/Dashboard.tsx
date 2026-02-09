import { motion } from 'framer-motion';
import {
  GraduationCap,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  ArrowUpRight,
  MoreHorizontal,
  Zap,
  Activity,
  Box,
  Layout,
  Target,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { useEffect, useState } from "react";
import { cohortApi, Cohort } from "@/cohortApi";
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { StatsCard } from '@/components/ui/StatsCard';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { notifications } = useNotificationStore();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const calculateProgress = (cohort: Cohort) => {
    const start = new Date(cohort.startDate);
    const end = new Date(cohort.endDate);
    const now = new Date();

    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
  };

  const isAdmin = user?.role === 'ADMIN';
  const totalCandidates = cohorts.reduce((sum, c) => sum + c.activeGencCount, 0);

  const avgCompletion = cohorts.length > 0
    ? Math.round(cohorts.reduce((sum, c) => sum + calculateProgress(c), 0) / cohorts.length)
    : 0;

  const pendingReports = cohorts.filter((c) => {
    const endDate = new Date(c.endDate);
    const now = new Date();
    const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilEnd >= 0 && daysUntilEnd <= 7;
  }).length;

  useEffect(() => {
    if (user?.email) {
      setLoading(true);
      cohortApi.getAllCohorts(user.email)
        .then(response => {
          setCohorts(response.data);
        })
        .catch(error => {
          console.error('Failed to load cohorts:', error);
          toast.error('Telemetry offline: Failed to load operations data');
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 pb-10"
    >
      {/* Premium Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 lg:p-12 shadow-2xl">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary backdrop-blur-md border border-white/10"
            >
              <Activity className="h-3 w-3" />
              System Operational • v2.4.0
            </motion.div>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="max-w-xl text-base text-slate-400 font-medium leading-relaxed">
              {isAdmin
                ? "You're viewing the master operations control panel. All training streams are currently synchronized."
                : "Monitor your assigned cohorts and synchronize mission-critical training metrics in real-time."}
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <GlassCard className="flex flex-col items-center justify-center p-5 min-w-[130px] border-white/5 bg-white/5 backdrop-blur-xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Node Status</span>
              <span className="mt-2 text-xl font-bold text-white italic">ACTIVE</span>
              <div className="mt-2 h-1 w-10 bg-success rounded-full animate-pulse" />
            </GlassCard>
            <GlassCard className="flex flex-col items-center justify-center p-5 min-w-[130px] border-white/5 bg-white/5 backdrop-blur-xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sync Level</span>
              <span className="mt-2 text-xl font-bold text-white italic">98<span className="text-xs">%</span></span>
              <div className="mt-2 h-1 w-10 bg-primary rounded-full" />
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Dynamic Statistics Hub */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Missions"
          value={cohorts.length}
          change="+12% growth"
          changeType="positive"
          icon={Target}
          iconColor="cyan"
          delay={0.1}
        />
        <StatsCard
          title="Talent Pool"
          value={totalCandidates}
          change="Real-time count"
          changeType="neutral"
          icon={Users}
          iconColor="violet"
          delay={0.2}
        />
        <StatsCard
          title="Deployment Velocity"
          value={`${avgCompletion}%`}
          change="+4.2 points"
          changeType="positive"
          icon={Zap}
          iconColor="success"
          delay={0.3}
        />
        <StatsCard
          title="Pending Briefs"
          value={pendingReports.toString()}
          change="Action required"
          changeType="negative"
          icon={Clock}
          iconColor="warning"
          delay={0.4}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Operations Center - Cohort List */}
        <motion.div variants={itemVariants} className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Box className="h-6 w-6 text-primary" />
              Operational Learning Streams
            </h2>
            <GradientButton
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cohorts')}
              className="text-primary hover:bg-primary/5"
            >
              Master View
            </GradientButton>
          </div>

          <div className="grid gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 w-full animate-pulse rounded-3xl bg-muted/20" />
              ))
            ) : cohorts.length > 0 ? (
              cohorts.slice(0, 5).map((cohort, index) => (
                <GlassCard
                  key={cohort.id}
                  variant="hover"
                  glow="cyan"
                  className="group relative overflow-hidden p-0 border-border/40"
                  onClick={() => navigate(`/cohorts/${cohort.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center p-6 gap-6">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-neon-blue/20 text-primary shadow-inner group-hover:scale-110 transition-transform">
                      <GraduationCap className="h-7 w-7" />
                    </div>

                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-foreground truncate">{cohort.code}</h3>
                        <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success border border-success/20 uppercase tracking-tighter">Live</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {cohort.skill}</span>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {cohort.trainingLocation}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-8 text-right">
                      <div className="hidden sm:flex flex-col items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Flux Capacity</span>
                        <span className="text-sm font-bold text-foreground">{cohort.activeGencCount} GenCs</span>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs font-bold text-primary">{calculateProgress(cohort)}% Complete</span>
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted/30">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${calculateProgress(cohort)}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            className="h-full rounded-full bg-gradient-to-r from-primary to-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]"
                          />
                        </div>
                      </div>

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/20 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-muted/5 rounded-[2rem] border-2 border-dashed border-border/10">
                <Layout className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="font-bold text-foreground">Zero Active Streams Traceable</p>
                <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">Initialize a new cohort or synchronize with the master server to populate data.</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Global Intelligence Feed */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="h-6 w-6 text-secondary" />
            <h2 className="text-2xl font-bold">Activity Protocol</h2>
          </div>

          <GlassCard className="p-0 overflow-hidden border-border/40">
            <div className="bg-muted/5 p-4 border-b border-border/10">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Recent Telemetry Synchronized</span>
            </div>
            <div className="divide-y divide-border/10">
              {notifications.length > 0 ? (
                notifications.slice(0, 6).map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                    className="flex items-start gap-4 p-5 hover:bg-muted/10 transition-all group"
                  >
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground leading-tight truncate">
                        {activity.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {activity.message}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase text-secondary/60 tracking-widest">Protocol Override</span>
                        <span className="text-[9px] font-bold text-muted-foreground/40 italic">
                          {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <Clock className="h-12 w-12 text-muted-foreground/10 mb-4" />
                  <p className="text-sm font-bold text-muted-foreground/40 italic">Waiting for incoming signals...</p>
                </div>
              )}
            </div>
            <button className="w-full py-4 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60 hover:text-primary hover:bg-primary/5 transition-all border-t border-border/10">
              Clear Command Buffer
            </button>
          </GlassCard>
        </motion.div>
      </div>

      {/* Control Nodes - Quick Actions */}
      <motion.div variants={itemVariants} className="pt-6">
        <GlassCard className="p-8 border-primary/20 bg-primary/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 group-hover:scale-125 transition-all">
            <Target className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              Global Control Matrix
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Log Efforts', path: '/efforts', icon: Clock },
                { label: 'Personnel', path: '/candidates', icon: Users },
                { label: 'Analytics', path: '/reports', icon: TrendingUp },
                { label: 'Settings', path: '/settings', icon: Layout }
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-background/50 border border-border/40 hover:border-primary/50 hover:bg-background transition-all hover:shadow-xl group/btn"
                >
                  <action.icon className="h-6 w-6 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 group-hover/btn:text-foreground">
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};
