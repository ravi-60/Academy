import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Users, TrendingUp, Search, Activity, Box, Zap, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatsCard } from '@/components/ui/StatsCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useToast } from '@/hooks/use-toast';
import { effortApi, WeeklySummary as BackendWeeklySummary } from '@/integrations/backend/effortApi';
import { cohortApi, Cohort } from '@/integrations/backend/cohortApi';
import { generateCalendarWeeks, WeekOption } from '@/utils/weekGenerator';
import { cn } from '@/lib/utils';
import api from '../api';
import { format } from 'date-fns';

interface WeeklySummary {
  id: number;
  cohort: { id: number; code: string };
  weekStartDate: string;
  weekEndDate: string;
  totalHours: number;
  summaryDate: string;
  activeTrainers: number;
  trainingDays: number;
  avgDaily: number;
  utilization: number;
}

export const WeeklySummaryPage = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [selectedCohort, setSelectedCohort] = useState<Cohort | null>(null);
  const [weekOptions, setWeekOptions] = useState<WeekOption[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);
  const [weeklySummaries, setWeeklySummaries] = useState<WeeklySummary[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load cohorts
    cohortApi.getAllCohorts()
      .then(response => setCohorts(response.data))
      .catch(error => {
        toast({
          title: 'Error',
          description: 'Failed to load cohorts',
          variant: 'destructive',
        });
      });
  }, []);

  useEffect(() => {
    // Update selected cohort and generate weeks when cohort changes
    if (selectedCohort) {
      const weeks = generateCalendarWeeks(new Date(selectedCohort.startDate), new Date(selectedCohort.endDate));
      setWeekOptions(weeks);
      setSelectedWeek(null);
      setWeeklySummaries([]);
    }
  }, [selectedCohort]);

  const handleCohortChange = (cohortId: number) => {
    const cohort = cohorts.find(c => c.id === cohortId);
    setSelectedCohort(cohort || null);
  };

  const handleWeekChange = (weekValue: string) => {
    const week = weekOptions.find(w => w.value === weekValue);
    setSelectedWeek(week || null);
    if (week && selectedCohort) {
      loadWeeklySummaries(selectedCohort.id, week.startDate, week.endDate);
    }
  };

  const loadWeeklySummaries = async (cohortId: number, startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const response = await effortApi.getEffortsByCohortAndDateRange(
        cohortId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );

      // Group efforts by week and calculate summaries
      const efforts = response.data;
      const summaries: WeeklySummary[] = [];

      if (efforts.length > 0 && selectedCohort) {
        // Calculate total hours
        const totalHours = efforts.reduce((sum: number, effort: any) => sum + effort.effortHours, 0);

        // Calculate unique trainers
        const uniqueTrainers = new Set(efforts.map((effort: any) => effort.trainerMentorName));
        const activeTrainers = uniqueTrainers.size;

        // Calculate training days (assuming 5 days/week)
        const trainingDays = 5;

        // Calculate avg daily hours
        const avgDaily = totalHours / trainingDays;

        // Calculate utilization (assuming 8 hours/day per trainer)
        const utilization = (totalHours / (activeTrainers * trainingDays * 8)) * 100;

        summaries.push({
          id: Date.now(), // Temporary ID for frontend
          cohort: { id: selectedCohort.id, code: selectedCohort.code },
          weekStartDate: startDate.toISOString().split('T')[0],
          weekEndDate: endDate.toISOString().split('T')[0],
          totalHours,
          summaryDate: new Date().toISOString().split('T')[0],
          activeTrainers,
          trainingDays,
          avgDaily,
          utilization,
        });
      }

      setWeeklySummaries(summaries);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load weekly summaries',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canView = user?.role === 'COACH' || user?.role === 'LOCATION_LEAD' || user?.role === 'ADMIN';

  if (!canView) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to view weekly summaries.
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
              Intelligence Feed • Consolidated
            </motion.div>
            <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
              Weekly <span className="text-gradient">Summaries</span>
            </h1>
            <p className="max-w-xl text-lg text-slate-400 font-medium leading-relaxed">
              Consolidated operational telemetry across all mission-critical nodes. Analyze resource utilization and effort distributions with surgical precision.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-xl">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Authenticated Lead</p>
                <p className="text-sm font-black text-white">{user?.name}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-neon-blue flex items-center justify-center font-bold text-white shadow-lg">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence Filters */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center flex-1">
          <div className="relative group w-full lg:w-96">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center">
              <Box className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
              <select
                value={selectedCohort?.id || ''}
                onChange={(e) => handleCohortChange(Number(e.target.value))}
                className="input-premium w-full pl-12 pr-10 py-4 bg-background/50 backdrop-blur-xl appearance-none"
              >
                <option value="">Query Mission Node...</option>
                {cohorts.map(cohort => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.code} - {cohort.skill}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="relative group w-full lg:w-72">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center">
              <Calendar className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
              <select
                value={selectedWeek?.value || ''}
                onChange={(e) => handleWeekChange(e.target.value)}
                disabled={!selectedCohort}
                className="input-premium w-full pl-12 pr-10 py-4 bg-background/50 backdrop-blur-xl appearance-none disabled:opacity-50"
              >
                <option value="">Synchronize Week...</option>
                {weekOptions.map(week => (
                  <option key={week.value} value={week.value}>
                    {week.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Matrix */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[40vh] items-center justify-center"
          >
            <div className="relative h-16 w-16">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="h-full w-full animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          </motion.div>
        ) : selectedWeek && weeklySummaries.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Stats Overview */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Engagement"
                value={`${weeklySummaries[0].totalHours.toFixed(1)}h`}
                icon={Clock}
                iconColor="cyan"
              />
              <StatsCard
                title="Active Personnel"
                value={weeklySummaries[0].activeTrainers.toString()}
                icon={Users}
                iconColor="violet"
              />
              <StatsCard
                title="Daily Velocity"
                value={`${weeklySummaries[0].avgDaily.toFixed(1)}h`}
                icon={TrendingUp}
                iconColor="success"
              />
              <StatsCard
                title="Node Utilization"
                value={`${weeklySummaries[0].utilization.toFixed(0)}%`}
                icon={Zap}
                iconColor="blue"
              />
            </div>

            {/* Detailed Briefs */}
            <div className="grid gap-6">
              {weeklySummaries.map((summary) => (
                <GlassCard key={summary.id} variant="hover" className="p-8 border-border/10">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                        <Activity className="h-7 w-7" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-foreground">{summary.cohort.code}</h3>
                          <span className="px-2 py-0.5 rounded bg-primary/20 text-[10px] font-black text-primary border border-primary/20 uppercase tracking-tighter">
                            Validated Report
                          </span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary/60" />
                          {format(new Date(summary.weekStartDate), 'MMM dd')} — {format(new Date(summary.weekEndDate), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 pl-4 lg:pl-0 border-l border-border/20">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Operational Days</p>
                        <p className="text-lg font-bold text-foreground">{summary.trainingDays}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Trainer Sync</p>
                        <p className="text-lg font-bold text-foreground">{summary.activeTrainers}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Avg Volumetric</p>
                        <p className="text-lg font-bold text-foreground">{summary.avgDaily.toFixed(1)}h</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Utilization</p>
                        <p className="text-lg font-bold text-primary">{summary.utilization.toFixed(0)}%</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center bg-card/10 rounded-[2.5rem] border-2 border-dashed border-border/10"
          >
            <div className="h-20 w-20 rounded-full bg-muted/10 flex items-center justify-center mb-6">
              <Box className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Data Synchronization Required</h3>
            <p className="text-muted-foreground mt-2 max-w-sm mx-auto font-medium">
              {!selectedCohort
                ? "Select a mission-critical node to initialize telemetry synchronization."
                : "Awaiting weekly data broadcast for the selected temporal window."}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};