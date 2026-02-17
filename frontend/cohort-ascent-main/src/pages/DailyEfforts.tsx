import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Send,
  Lock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  History,
  Save,
  Check,
  Info,
  ShieldCheck,
  Target,
  Sparkles,
  MapPin,
  TrendingUp,
  Layout,
  AlertCircle,
  AlertTriangle,
  Circle,
  X,
  Users,
  Search as SearchIcon,
  Filter,
  Download,
  FileText,
  Table as TableIcon,
  Activity,
  ArrowUpDown,
  ShieldAlert
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { useCohorts, useCohort, useAdditionalTrainers, useAdditionalMentors } from '@/hooks/useCohortsBackend';
import { useSubmitWeeklyEffort, useWeeklySummaries, useEffortsByCohortAndRange } from '@/hooks/useEffortsBackend';
import { generateCalendarWeeks } from '@/utils/dateUtils';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  format,
  isAfter,
  isSameDay,
  startOfToday,
  eachDayOfInterval,
  addDays,
  isBefore,
  startOfWeek,
  endOfWeek,
  parseISO,
  subWeeks
} from 'date-fns';
import { DayLog, WeeklyEffortSubmission } from '@/effortApi';
import { useAuthStore } from '@/stores/authStore';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, TooltipPortal } from '@/components/ui/tooltip';
import { reportApi } from '@/reportApi';



export const DailyEfforts = () => {
  const { user } = useAuthStore();
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historySortBy, setHistorySortBy] = useState<string>("weekStartDate");
  const [historySortOrder, setHistorySortOrder] = useState<"asc" | "desc">("desc");
  const [historyPage, setHistoryPage] = useState(1);
  const historyItemsPerPage = 4;

  const [localDayLogs, setLocalDayLogs] = useState<Record<string, DayLog>>({});
  const [savedDays, setSavedDays] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isOverrideEdit, setIsOverrideEdit] = useState(false);
  const [activeCell, setActiveCell] = useState<{ date: string, role: string } | null>(null);

  const { data: allCohorts = [] } = useCohorts();
  const { data: cohortDetail } = useCohort(selectedCohortId || 0);
  const submitWeeklyMutation = useSubmitWeeklyEffort();

  // Filter cohorts based on coach role
  const allowedCohorts = useMemo(() => {
    let cohorts = allCohorts;
    if (user?.role === 'COACH') {
      cohorts = allCohorts.filter(c => c.coach?.id === user.id);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cohorts = cohorts.filter(c =>
        c.code.toLowerCase().includes(query) ||
        c.skill.toLowerCase().includes(query) ||
        c.trainingLocation.toLowerCase().includes(query)
      );
    }
    return cohorts;
  }, [allCohorts, user, searchQuery]);

  const calendarWeeks = useMemo(() => {
    if (!cohortDetail) return [];
    return generateCalendarWeeks(cohortDetail.startDate, cohortDetail.endDate);
  }, [cohortDetail]);

  const selectedWeek = useMemo(() => {
    const today = startOfToday();
    if (calendarWeeks.length === 0) return null;

    if (selectedWeekId) {
      return calendarWeeks.find(w => w.id === selectedWeekId) || calendarWeeks[0];
    }

    // Default to current week
    const currentWeek = calendarWeeks.find(week =>
      (isSameDay(today, week.startDate) || isAfter(today, week.startDate)) &&
      (isSameDay(today, week.endDate) || isBefore(today, week.endDate))
    );
    return currentWeek || calendarWeeks[0];
  }, [calendarWeeks, selectedWeekId]);

  const isEditableWindow = useMemo(() => {
    if (!selectedWeek) return false;
    const today = startOfToday();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const previousWeekStart = subWeeks(currentWeekStart, 1);
    const activityWeekStart = selectedWeek.startDate;

    return isSameDay(activityWeekStart, currentWeekStart) || isSameDay(activityWeekStart, previousWeekStart);
  }, [selectedWeek]);

  const { data: weeklySummaries = [] } = useWeeklySummaries(selectedCohortId || 0);
  const { data: mappingTrainers = [] } = useAdditionalTrainers(selectedCohortId || 0);
  const { data: mappingMentors = [] } = useAdditionalMentors(selectedCohortId || 0);
  const { data: existingEfforts = [] } = useEffortsByCohortAndRange(
    selectedCohortId || 0,
    selectedWeek ? format(selectedWeek.startDate, 'yyyy-MM-dd') : '',
    selectedWeek ? format(selectedWeek.endDate, 'yyyy-MM-dd') : ''
  );

  const visibleSections = useMemo(() => {
    if (!cohortDetail) return [];

    const sections = [];

    // Technical Trainer
    const techMapped = mappingTrainers
      .filter((m: any) => m.role === 'TRAINER')
      .map((m: any) => `${m.trainer.name} (${m.trainer.is_internal ? 'Internal' : 'External'})`);
    const techName = techMapped.join(', ') || cohortDetail.primaryTrainer?.name || (cohortDetail as any).trainerName;
    if (techName) {
      sections.push({
        id: 'technicalTrainer',
        title: 'Technical Trainer',
        name: techName,
      });
    }

    // Behavioral Trainer
    const bhMapped = mappingTrainers
      .filter((m: any) => m.role === 'BH_TRAINER')
      .map((m: any) => `${m.trainer.name} (${m.trainer.is_internal ? 'Internal' : 'External'})`);
    const bhName = bhMapped.join(', ') || cohortDetail.behavioralTrainer?.name;
    if (bhName) {
      sections.push({
        id: 'behavioralTrainer',
        title: 'Behavioral Trainer',
        name: bhName,
      });
    }

    // Primary Mentor
    const mentorMapped = mappingMentors
      .filter((m: any) => m.role === 'MENTOR')
      .map((m: any) => `${m.mentor.name} (${m.mentor.is_internal ? 'Internal' : 'External'})`);
    const mentorName = mentorMapped.join(', ') || cohortDetail.primaryMentor?.name;
    if (mentorName) {
      sections.push({
        id: 'mentor',
        title: 'Primary Mentor',
        name: mentorName,
      });
    }

    // Buddy Mentor
    const buddyMapped = mappingMentors
      .filter((m: any) => m.role === 'BUDDY_MENTOR')
      .map((m: any) => `${m.mentor.name} (${m.mentor.is_internal ? 'Internal' : 'External'})`);
    const buddyName = buddyMapped.join(', ') || cohortDetail.buddyMentor?.name;
    if (buddyName) {
      sections.push({
        id: 'buddyMentor',
        title: 'Buddy Mentor',
        name: buddyName,
      });
    }

    return sections;
  }, [cohortDetail, mappingTrainers, mappingMentors]);



  // Pre-calculate history data
  const processedHistory = useMemo(() => {
    const filtered = weeklySummaries.filter(s => {
      const query = historySearchQuery.toLowerCase();
      const weekNumber = calendarWeeks.find(w => format(w.startDate, 'yyyy-MM-dd') === s.weekStartDate)?.weekNumber;
      const weekNumberString = weekNumber ? `Week ${weekNumber}` : '';
      const weekDates = s.weekStartDate && s.weekEndDate ?
        `${format(parseISO(s.weekStartDate), 'MMM dd')} - ${format(parseISO(s.weekEndDate), 'MMM dd, yyyy')}` : '';

      return (
        s.weekStartDate.toLowerCase().includes(query) ||
        weekNumberString.toLowerCase().includes(query) ||
        weekDates.toLowerCase().includes(query) ||
        s.submittedBy?.toLowerCase().includes(query) ||
        s.totalHours.toString().includes(query)
      );
    });

    const sorted = [...filtered].sort((a: any, b: any) => {
      const aVal = a[historySortBy];
      const bVal = b[historySortBy];
      if (aVal < bVal) return historySortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return historySortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const totalPages = Math.max(1, Math.ceil(sorted.length / historyItemsPerPage));
    const paginated = sorted.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage);

    return {
      filtered,
      sorted,
      paginated,
      totalPages
    };
  }, [weeklySummaries, historySearchQuery, calendarWeeks, historySortBy, historySortOrder, historyPage, historyItemsPerPage]);


  useEffect(() => {
    setHistoryPage(1);
  }, [historySearchQuery, historySortBy, historySortOrder]);

  useEffect(() => {
    setIsOverrideEdit(false);
  }, [selectedWeekId, selectedCohortId]);


  // Initialize local day logs
  useEffect(() => {
    if (selectedWeek && cohortDetail) {
      const days = eachDayOfInterval({
        start: selectedWeek.startDate,
        end: addDays(selectedWeek.startDate, 4), // Monday to Friday
      });

      const currentSummary = weeklySummaries.find(s => s.weekStartDate === format(selectedWeek.startDate, 'yyyy-MM-dd'));
      const summaryHolidays = currentSummary?.holidays?.split(',') || [];

      const initialLogs: Record<string, DayLog> = {};
      const initialSaved: Record<string, boolean> = {};

      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayEfforts = (existingEfforts as any[]).filter(e => e.effortDate === dateStr);

        // Load holiday status from summary or efforts
        const isHoliday = summaryHolidays.includes(dateStr) || dayEfforts.some(e => (e as any).isHoliday);

        initialLogs[dateStr] = {
          date: dateStr,
          isHoliday: isHoliday,
          technicalTrainer: {
            hours: dayEfforts.find(e => e.role === 'TRAINER')?.effortHours || 0,
            notes: dayEfforts.find(e => e.role === 'TRAINER')?.areaOfWork || '',
            mode: dayEfforts.find(e => e.role === 'TRAINER')?.mode as any || 'IN_PERSON',
            reasonVirtual: dayEfforts.find(e => e.role === 'TRAINER')?.reasonVirtual || '',
          },
          behavioralTrainer: {
            hours: dayEfforts.find(e => e.role === 'BH_TRAINER')?.effortHours || 0,
            notes: dayEfforts.find(e => e.role === 'BH_TRAINER')?.areaOfWork || '',
            mode: dayEfforts.find(e => e.role === 'BH_TRAINER')?.mode as any || 'IN_PERSON',
            reasonVirtual: dayEfforts.find(e => e.role === 'BH_TRAINER')?.reasonVirtual || '',
          },
          mentor: {
            hours: dayEfforts.find(e => e.role === 'MENTOR')?.effortHours || 0,
            notes: dayEfforts.find(e => e.role === 'MENTOR')?.areaOfWork || '',
            mode: dayEfforts.find(e => e.role === 'MENTOR')?.mode as any || 'IN_PERSON',
            reasonVirtual: dayEfforts.find(e => e.role === 'MENTOR')?.reasonVirtual || '',
          },
          buddyMentor: {
            hours: dayEfforts.find(e => e.role === 'BUDDY_MENTOR')?.effortHours || 0,
            notes: dayEfforts.find(e => e.role === 'BUDDY_MENTOR')?.areaOfWork || '',
            mode: dayEfforts.find(e => e.role === 'BUDDY_MENTOR')?.mode as any || 'IN_PERSON',
            reasonVirtual: dayEfforts.find(e => e.role === 'BUDDY_MENTOR')?.reasonVirtual || '',
          }
        };
        initialSaved[dateStr] = dayEfforts.length > 0;
      });

      setLocalDayLogs(initialLogs);
      setSavedDays(initialSaved);
    }
  }, [selectedWeek, existingEfforts, cohortDetail, weeklySummaries]);

  const weekStats = useMemo(() => {
    let tech = 0, behavioral = 0, mentor = 0, buddy = 0;
    Object.values(localDayLogs).forEach(log => {
      if (!log.isHoliday) {
        tech += Number(log.technicalTrainer?.hours || 0);
        behavioral += Number(log.behavioralTrainer?.hours || 0);
        mentor += Number(log.mentor?.hours || 0);
        buddy += Number(log.buddyMentor?.hours || 0);
      }
    });
    return {
      total: tech + behavioral + mentor + buddy,
      roles: {
        TechnicalTraining: tech,
        BehavioralSkills: behavioral,
        Mentorship: mentor,
        BuddyAssistance: buddy
      }
    };
  }, [localDayLogs]);

  const handleUpdateLog = (date: string, role: keyof Omit<DayLog, 'date' | 'isHoliday'>, field: 'hours' | 'notes' | 'mode' | 'reasonVirtual', value: any) => {
    if (field === 'hours') {
      const currentLog = localDayLogs[date];
      if (currentLog) {
        // Calculate total hours excluding the current role being updated
        const otherRolesHours = Object.entries(currentLog || {})
          .filter(([key]) => key !== 'date' && key !== 'isHoliday' && key !== role)
          .reduce((sum, [_, detail]) => sum + Number((detail as any)?.hours || 0), 0);

        const totalWithNewValue = otherRolesHours + Number(value || 0);

        if (totalWithNewValue > 9) {
          toast.error(`Daily cumulative effort cannot exceed 9 hours for this cohort (Currently: ${totalWithNewValue}h)`);
          return;
        }
      }
    }

    setLocalDayLogs(prev => ({
      ...prev,
      [date]: {
        ...prev[date],
        [role]: {
          ...prev[date][role],
          [field]: value
        }
      } as DayLog
    }));
    setSavedDays(prev => ({ ...prev, [date]: false }));
  };

  const handleToggleHoliday = (date: string) => {
    setLocalDayLogs(prev => {
      const isCurrentlyHoliday = prev[date]?.isHoliday;
      return {
        ...prev,
        [date]: {
          ...prev[date],
          isHoliday: !isCurrentlyHoliday,
          // Reset hours if marking as holiday
          technicalTrainer: !isCurrentlyHoliday ? { hours: 0, notes: '', mode: 'IN_PERSON', reasonVirtual: '' } : prev[date].technicalTrainer,
          behavioralTrainer: !isCurrentlyHoliday ? { hours: 0, notes: '', mode: 'IN_PERSON', reasonVirtual: '' } : prev[date].behavioralTrainer,
          mentor: !isCurrentlyHoliday ? { hours: 0, notes: '', mode: 'IN_PERSON', reasonVirtual: '' } : prev[date].mentor,
          buddyMentor: !isCurrentlyHoliday ? { hours: 0, notes: '', mode: 'IN_PERSON', reasonVirtual: '' } : prev[date].buddyMentor,
        }
      };
    });
    setSavedDays(prev => ({ ...prev, [date]: false }));
  };

  const handleSaveDay = (date: string) => {
    setSavedDays(prev => ({ ...prev, [date]: true }));
    toast.success(`Progress saved for ${format(parseISO(date), 'EEEE, MMM dd')}`, {
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
    });
  };

  const isWeekCompleted = useMemo(() => {
    if (!selectedWeek) return false;
    const weekStartStr = format(selectedWeek.startDate, 'yyyy-MM-dd');
    return weeklySummaries.some(s => s.weekStartDate === weekStartStr);
  }, [weeklySummaries, selectedWeek]);

  const handleFinalSubmit = () => {
    if (!selectedCohortId || !selectedWeek || !cohortDetail || !user) return;

    // Validation: check if all non-holiday days are "saved" (staged)
    const days = Object.values(localDayLogs);
    const unsavedDays = days.filter(d => !d.isHoliday && !savedDays[d.date]);

    if (unsavedDays.length > 0) {
      toast.error('Please save all daily logs before final submission.');
      return;
    }

    const submission: WeeklyEffortSubmission = {
      cohortId: selectedCohortId,
      coachId: user.id,
      location: cohortDetail.trainingLocation,
      weekStartDate: format(selectedWeek.startDate, 'yyyy-MM-dd'),
      weekEndDate: format(selectedWeek.endDate, 'yyyy-MM-dd'),
      holidays: Object.values(localDayLogs).filter(d => d.isHoliday).map(d => d.date),
      dayLogs: Object.values(localDayLogs),
      submittedBy: user.name,
      status: 'COMPLETED'
    };

    submitWeeklyMutation.mutate(submission, {
      onSuccess: () => {
        toast.success('Weekly efforts submitted and locked.');
      }
    });
  };

  // 1. Role-Based Entry Point (Cohort Selection)
  if (!selectedCohortId) {
    return (
      <div className="space-y-10 pb-10">
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
                Effort Matrix • Real-time Sync
              </motion.div>
              <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-white">
                Log <span className="text-gradient">Efforts</span>
              </h1>
              <p className="max-w-xl text-base text-slate-400 font-medium leading-relaxed">
                Synchronize your operational bandwidth. Select a mission-critical cohort to manage workforce development and resource utilization logs.
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
          <div className="relative group flex-1 max-w-xl">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/20 to-secondary/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
            <div className="relative flex items-center">
              <SearchIcon className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Query mission-critical node (Code, Skill, Location)..."
                className="input-premium w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-xl"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 p-10 max-w-[1400px] mx-auto w-full">
          {allowedCohorts.map((cohort, index) => {
            const today = startOfToday();
            const start = parseISO(cohort.startDate);
            const end = parseISO(cohort.endDate);

            let status = 'Upcoming';
            let statusColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            let progress = 0;

            if (isAfter(today, end)) {
              status = 'Completed';
              statusColor = 'bg-muted text-muted-foreground border-border/50';
              progress = 100;
            } else if (isAfter(today, start) || isSameDay(today, start)) {
              status = 'Active';
              statusColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
              const totalDays = Math.max(1, (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              const currentDay = Math.max(0, (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
              progress = Math.min(100, Math.round((currentDay / totalDays) * 100));
            }

            return (
              <motion.div
                key={cohort.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  variant="hover"
                  glow={status === 'Active' ? "cyan" : "none"}
                  className="cursor-pointer p-8 h-full flex flex-col group relative overflow-hidden border-border/10"
                  onClick={() => setSelectedCohortId(cohort.id)}
                >
                  <div className="absolute top-0 right-0 p-6">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                      statusColor
                    )}>
                      {status}
                    </span>
                  </div>

                  <div className="mb-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80 mb-2">{cohort.skill}</p>
                    <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors tracking-tight">{cohort.code}</h3>
                  </div>

                  <div className="space-y-6 flex-1">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80">
                        <MapPin className="h-4 w-4 text-primary/60" />
                        {cohort.trainingLocation}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-primary/60" />
                          Progression
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className="h-full bg-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-border/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                      <span className="text-[10px] font-black uppercase text-muted-foreground/80 tracking-widest">{cohort.bu} Node</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-[0.15em] transition-all group-hover:translate-x-1">
                      Access Workspace <ChevronRight className="h-4 w-4" />
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
          {allowedCohorts.length === 0 && (
            <div className="col-span-full py-32 text-center bg-card/10 rounded-[2.5rem] border-2 border-dashed border-border/30">
              <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-2xl font-black text-foreground">Mission Nodes Not Found</h3>
              <p className="text-muted-foreground max-w-sm mx-auto font-medium mt-2">You don't have any operational cohorts assigned for effort synchronization at this time.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Effort Logging Workspace
  return (
    <div className="min-h-screen">
      {/* 2. Enterprise Workflow UI */}
      <div className="sticky top-16 z-30 bg-background/80 backdrop-blur-2xl border-b border-border shadow-2xl">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-8 px-8 py-6">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedCohortId(null)}
              className="h-12 w-12 flex items-center justify-center rounded-xl bg-muted/50 border border-border hover:bg-primary/20 hover:text-primary transition-all group shadow-xl"
            >
              <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
            </motion.button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-foreground tracking-tighter leading-none">{cohortDetail?.code}</h1>
                <div className="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[9px] font-black text-primary tracking-widest uppercase">
                    Active
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                <MapPin className="h-3 w-3 text-primary/70" /> {cohortDetail?.trainingLocation} <span className="opacity-20">|</span> {cohortDetail?.skill}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <GradientButton
              variant="ghost"
              className={cn("gap-2 h-10 px-5 text-[10px] font-black transition-all border-border bg-muted/30 hover:bg-muted/50", showHistory && "bg-primary/10 text-primary border-primary/20")}
              onClick={() => setShowHistory(!showHistory)}
              icon={<History className="h-4 w-4" />}
            >
              HISTORY REPOSITORY
            </GradientButton>
            {!showHistory && (
              <div className="flex items-center gap-3">
                {isWeekCompleted && isEditableWindow && !isOverrideEdit && (
                  <GradientButton
                    variant="ghost"
                    className="h-10 px-5 border-amber-500/20 text-amber-500 hover:bg-amber-500/10 hover:border-amber-500 text-[10px] font-black"
                    onClick={() => setIsOverrideEdit(true)}
                    icon={<Activity className="h-4 w-4" />}
                  >
                    EDIT LOGS
                  </GradientButton>
                )}
                <GradientButton
                  variant="primary"
                  className={cn("h-10 px-8 shadow-neon-blue font-black tracking-widest text-[10px]", isOverrideEdit && "bg-amber-500 hover:bg-amber-600 border-amber-400")}
                  onClick={handleFinalSubmit}
                  disabled={(isWeekCompleted && !isOverrideEdit) || submitWeeklyMutation.isPending}
                  icon={isWeekCompleted && !isOverrideEdit ? <CheckCircle2 className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                  iconPosition="right"
                >
                  {isWeekCompleted && !isOverrideEdit ? "LOCKED" : (isOverrideEdit ? "UPDATE" : "COMMIT LOGS")}
                </GradientButton>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full px-8 py-10 space-y-10">
        {/* 3. Horizontal Sequence Navigator - Visible only in Logging Mode */}
        {!showHistory && (
          <div className="flex items-center gap-4 overflow-x-auto pb-4 custom-scrollbar">
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2 bg-muted/50 border border-border rounded-2xl mr-4">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sequence Flow</span>
            </div>
            {calendarWeeks.map((week, idx) => {
              const weekStartStr = format(week.startDate, 'yyyy-MM-dd');
              const isCompleted = weeklySummaries.some(s => s.weekStartDate === weekStartStr);
              const isSelected = selectedWeek?.id === week.id;
              const today = startOfToday();
              const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
              const isLocked = !isSameDay(week.startDate, currentWeekStart) && !isSameDay(week.startDate, subWeeks(currentWeekStart, 1));

              return (
                <button
                  key={week.id}
                  disabled={isLocked && !isCompleted}
                  onClick={() => setSelectedWeekId(week.id)}
                  className={cn(
                    "flex-shrink-0 px-8 py-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-1.5 group relative overflow-hidden",
                    isSelected ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] -translate-y-1" :
                      isCompleted ? "bg-emerald-500/5 border-emerald-500/20" :
                        isLocked ? "bg-muted/40 border-border opacity-20 grayscale cursor-not-allowed" :
                          "bg-muted/20 border-border hover:border-primary/20 hover:bg-muted/30"
                  )}
                >
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                  )}
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em]",
                    isSelected ? "text-primary" : "text-muted-foreground/80 group-hover:text-muted-foreground"
                  )}>Week {week.weekNumber}</span>
                  <p className={cn(
                    "text-xs font-black tracking-tight whitespace-nowrap",
                    isSelected ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"
                  )}>
                    {format(week.startDate, 'MMM dd')} - {format(endOfWeek(week.startDate, { weekStartsOn: 1 }), 'MMM dd, yyyy')}
                  </p>
                  {isCompleted && (
                    <Check className="h-3 w-3 text-emerald-400 mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className={cn("space-y-8 w-full mr-auto", showHistory && "overflow-hidden")}>
          <AnimatePresence mode="wait">
            {showHistory ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-border/50 pb-8 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-neon-blue/5">
                      <History className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">Effort History</h3>
                      <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider opacity-70">Verified audit log of compliance records</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <select
                        value={`${historySortBy}-${historySortOrder}`}
                        onChange={(e) => {
                          const [key, order] = e.target.value.split('-');
                          setHistorySortBy(key);
                          setHistorySortOrder(order as 'asc' | 'desc');
                          setHistoryPage(1);
                        }}
                        className="pl-4 pr-10 py-2.5 bg-background/40 border border-border/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 appearance-none transition-all"
                      >
                        <option value="weekStartDate-desc">Newest First</option>
                        <option value="weekStartDate-asc">Oldest First</option>
                        <option value="totalHours-desc">Most Hours</option>
                        <option value="totalHours-asc">Least Hours</option>
                      </select>
                      <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>

                    <div className="relative group">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        placeholder="Filter history..."
                        value={historySearchQuery}
                        onChange={(e) => {
                          setHistorySearchQuery(e.target.value);
                          setHistoryPage(1);
                        }}
                        className="pl-10 pr-4 py-2.5 bg-background/40 border border-border/40 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 w-64 transition-all"
                      />
                    </div>
                    <div className="hidden xl:flex px-5 py-2.5 bg-primary/10 rounded-xl border border-primary/20 items-center gap-3">
                      <div>
                        <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest leading-none">Total Hours</p>
                        <p className="text-lg font-black text-primary">{weeklySummaries.reduce((acc, s) => acc + Number(s.totalHours), 0)}</p>
                      </div>
                      <div className="w-px h-8 bg-primary/20" />
                      <div>
                        <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest leading-none">Verified</p>
                        <p className="text-lg font-black text-primary">{weeklySummaries.length} Weeks</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* History Grid with Sorting/Pagination */}
                <div className="grid gap-6 md:grid-cols-2">
                  {processedHistory.paginated.length === 0 ? (
                    <div className="col-span-full py-24 text-center bg-card/10 rounded-3xl border border-dashed border-border/50">
                      <History className="h-16 w-16 text-muted-foreground/10 mx-auto mb-4" />
                      <p className="text-muted-foreground font-bold uppercase tracking-widest">No submission history found</p>
                    </div>
                  ) : (
                    processedHistory.paginated.map(summary => (
                      <GlassCard key={summary.id} className="p-8 border border-border/40 flex flex-col hover:border-primary/40 hover:shadow-neon-blue/10 transition-all duration-500 group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 transition-all group-hover:bg-primary/10" />

                        <div className="flex justify-between items-start mb-8 relative z-10">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <span className="px-2 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest">Entry Locked</span>
                              <h4 className="text-xl font-bold text-foreground tracking-tight">Week {calendarWeeks.find(w => format(w.startDate, 'yyyy-MM-dd') === summary.weekStartDate)?.weekNumber || '?'}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground font-bold flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-primary/60" />
                              {summary.weekStartDate && summary.weekEndDate ?
                                `${format(parseISO(summary.weekStartDate), 'MMM dd')} - ${format(parseISO(summary.weekEndDate), 'MMM dd, yyyy')}`
                                : 'Dates Unavailable'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <div className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                              Verified Record
                            </div>
                            <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-tighter opacity-60">
                              {summary.summaryDate ? format(parseISO(summary.summaryDate), 'MMM dd, HH:mm') : 'Verification Pending'}
                            </p>
                          </div>
                        </div>

                        {/* Breakdown Grid */}
                        <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-8 p-5 rounded-2xl bg-muted/20 border border-border/30 relative z-10">
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">Technical Tr.</p>
                            <p className="text-lg font-black text-foreground flex items-baseline gap-1">
                              {summary.technicalTrainerHours} <span className="text-[10px] text-muted-foreground/60 uppercase">hrs</span>
                            </p>
                          </div>
                          <div className="space-y-1.5 text-right">
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">Behavioral Tr.</p>
                            <p className="text-lg font-black text-foreground flex items-baseline gap-1 justify-end">
                              {summary.behavioralTrainerHours} <span className="text-[10px] text-muted-foreground/60 uppercase">hrs</span>
                            </p>
                          </div>
                          <div className="space-y-1.5">
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">Mentorship</p>
                            <p className="text-lg font-black text-foreground flex items-baseline gap-1">
                              {summary.mentorHours} <span className="text-[10px] text-muted-foreground/60 uppercase">hrs</span>
                            </p>
                          </div>
                          <div className="space-y-1.5 text-right">
                            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.15em]">Buddy Mentor</p>
                            <p className="text-lg font-black text-foreground flex items-baseline gap-1 justify-end">
                              {summary.buddyMentorHours} <span className="text-[10px] text-muted-foreground/60 uppercase">hrs</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-6 border-t border-border/30 relative z-10">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-neon-blue/10 flex items-center justify-center text-sm font-black text-primary border border-primary/20 shadow-inner overflow-hidden">
                              {summary.submittedByAvatar ? (
                                <img src={summary.submittedByAvatar} alt={summary.submittedBy} className="h-full w-full object-cover" />
                              ) : (
                                summary.submittedBy?.charAt(0) || 'S'
                              )}
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-muted-foreground/60 uppercase tracking-[0.1em] leading-none mb-1">Approved By</p>
                              <p className="text-sm font-black text-foreground">{summary.submittedBy || 'System Lead'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={async () => {
                                        if (!selectedCohortId) return;
                                        const toastId = toast.loading('Generating Executive PDF...');
                                        try {
                                          const res = await reportApi.exportReport({
                                            cohortId: selectedCohortId,
                                            startDate: summary.weekStartDate,
                                            endDate: summary.weekEndDate,
                                            format: 'PDF'
                                          });
                                          const url = window.URL.createObjectURL(new Blob([res.data]));
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.setAttribute('download', `Audit_Report_${cohortDetail?.code}_${summary.weekStartDate}.pdf`);
                                          document.body.appendChild(link);
                                          link.click();
                                          link.remove();
                                          toast.success('PDF downloaded!', { id: toastId });
                                        } catch (e) {
                                          toast.error('PDF generation failed.', { id: toastId });
                                        }
                                      }}
                                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg shadow-red-500/5 group/btn"
                                    >
                                      <FileText className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs font-black">Download Executive PDF</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={async () => {
                                        if (!selectedCohortId) return;
                                        const toastId = toast.loading('Generating Data Excel...');
                                        try {
                                          const res = await reportApi.exportReport({
                                            cohortId: selectedCohortId,
                                            startDate: summary.weekStartDate,
                                            endDate: summary.weekEndDate,
                                            format: 'EXCEL'
                                          });
                                          const url = window.URL.createObjectURL(new Blob([res.data]));
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.setAttribute('download', `Data_Telemetry_${cohortDetail?.code}_${summary.weekStartDate}.xlsx`);
                                          document.body.appendChild(link);
                                          link.click();
                                          link.remove();
                                          toast.success('Excel downloaded!', { id: toastId });
                                        } catch (e) {
                                          toast.error('Excel generation failed.', { id: toastId });
                                        }
                                      }}
                                      className="h-11 w-11 flex items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all duration-300 shadow-lg shadow-emerald-500/5 group/btn"
                                    >
                                      <TableIcon className="h-5 w-5 group-hover/btn:scale-110 transition-transform" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs font-black">Download Analysis Excel</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>

                            <div className="text-right">
                              <p className="text-[9px] font-black text-primary/60 uppercase tracking-[0.2em] mb-1">Total Verified</p>
                              <div className="flex items-baseline gap-1.5 justify-end">
                                <p className="text-3xl font-black text-primary tracking-tighter">{summary.totalHours}</p>
                                <span className="text-xs font-black text-primary/60 uppercase">h</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    ))
                  )}
                </div>

                {/* History Pagination Footer */}
                {processedHistory.totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-10 border-t border-border/10">
                    <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-[0.2em]">
                      Showing <span className="text-foreground">{processedHistory.paginated.length}</span> of <span className="text-foreground">{processedHistory.filtered.length}</span> verified records
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={historyPage === 1}
                        onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <div className="flex gap-2">
                        {Array.from({ length: processedHistory.totalPages }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setHistoryPage(i + 1)}
                            className={cn(
                              "h-10 w-10 rounded-xl border font-bold text-xs transition-all",
                              historyPage === i + 1
                                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                                : "bg-card border-border/40 text-muted-foreground hover:bg-primary/10 hover:text-primary"
                            )}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button
                        disabled={historyPage === processedHistory.totalPages}
                        onClick={() => setHistoryPage(prev => Math.min(processedHistory.totalPages, prev + 1))}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-card border border-border/40 hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-all"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key={selectedWeek?.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* 5. Simplified Weekly Summary Strip */}
                <div className="p-6 bg-card border-border rounded-2xl shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-12 px-8 py-4">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Weekly Performance Totals</p>
                        <h4 className="text-4xl font-black text-foreground leading-none">
                          {weekStats.total}
                          <span className="text-xs ml-2 text-muted-foreground/30 uppercase tracking-widest font-bold">Total Hours</span>
                        </h4>
                      </div>
                      <div className="h-16 w-px bg-border/50" />
                      <div className="flex-1 grid grid-cols-4 gap-8">
                        {Object.entries(weekStats?.roles || {}).map(([role, hours]) => (
                          <div key={role} className="space-y-2">
                            <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em]">
                              {role.replace(/([A-Z])/g, ' $1').trim().replace('Hours', '').replace('Trainer', 'Training')}
                            </p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-xl font-black text-foreground">{hours}</span>
                              <span className="text-[9px] font-black text-muted-foreground/30 uppercase tracking-widest">Hrs</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 6. Tactical Precision Grid */}
                <div className="space-y-3">
                  {/* Master Grid Header - Restoration of Holiday Logic */}
                  <div className="grid grid-cols-[1fr,repeat(5,110px),100px] gap-3 px-6 pb-2 border-b border-border shadow-sm items-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/80">Mission Assets</p>
                    {selectedWeek && eachDayOfInterval({
                      start: selectedWeek.startDate,
                      end: addDays(selectedWeek.startDate, 4),
                    }).map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const isHoliday = localDayLogs[dateStr]?.isHoliday;
                      return (
                        <div key={dateStr} className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => handleToggleHoliday(dateStr)}
                            className={cn(
                              "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border transition-all mb-1",
                              isHoliday ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                            )}
                          >
                            {isHoliday ? "CLOSED" : "ACTIVE"}
                          </button>
                          <div className="text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-foreground/80 leading-none">{format(day, 'EEE')}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-primary/70 mt-1 whitespace-nowrap">{format(day, 'MMM dd, yyyy')}</p>
                          </div>
                        </div>
                      );
                    })}
                    <p className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground/80">TOTAL</p>
                  </div>

                  <div className="space-y-3">
                    {visibleSections.map((section) => {
                      const rowTotal = Object.values(localDayLogs).reduce((acc, log) =>
                        acc + (log.isHoliday ? 0 : Number((log[section.id as keyof DayLog] as any)?.hours || 0)), 0
                      );

                      return (
                        <GlassCard key={section.id} className="p-3 bg-muted/20 border-border hover:border-primary/20 transition-all group/row">
                          <div className="grid grid-cols-[1fr,repeat(5,110px),100px] gap-3 items-center">
                            {/* Role Identity */}
                            <div className="flex items-center gap-4 px-2">
                              <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary/60 transition-all">
                                <Activity className="h-4 w-4" />
                              </div>
                              <div className="space-y-0.5">
                                <h5 className="text-[13px] font-black text-foreground group-hover/row:text-primary transition-colors">{section.name}</h5>
                                <p className="text-[8px] font-black text-primary/80 uppercase tracking-[0.2em]">{section.title}</p>
                              </div>
                            </div>

                            {/* Daily Inputs */}
                            {selectedWeek && eachDayOfInterval({
                              start: selectedWeek.startDate,
                              end: addDays(selectedWeek.startDate, 4),
                            }).map((day) => {
                              const dateStr = format(day, 'yyyy-MM-dd');
                              const cellData = (localDayLogs[dateStr] as any)?.[section.id];
                              const isHoliday = localDayLogs[dateStr]?.isHoliday;
                              const isSelected = activeCell?.date === dateStr && activeCell?.role === section.id;

                              return (
                                <div
                                  key={dateStr}
                                  onClick={() => !isHoliday && setActiveCell({ date: dateStr, role: section.id })}
                                  className={cn(
                                    "h-11 rounded-xl border flex items-center justify-center relative cursor-pointer transition-all",
                                    isHoliday ? "bg-amber-500/5 border-amber-500/10 opacity-30 cursor-default" :
                                      isSelected ? "bg-primary/20 border-primary/50 shadow-neon-blue/10" :
                                        "bg-muted/20 border-border hover:bg-muted/30"
                                  )}
                                >
                                  <input
                                    type="number"
                                    value={cellData?.hours || ""}
                                    onChange={(e) => handleUpdateLog(dateStr, section.id as any, 'hours', parseFloat(e.target.value) || 0)}
                                    disabled={isHoliday}
                                    placeholder="0"
                                    className={cn(
                                      "w-full bg-transparent text-center text-base font-black focus:outline-none placeholder:text-muted-foreground/40",
                                      cellData?.hours > 0 ? "text-primary shadow-primary/20" : "text-muted-foreground/60"
                                    )}
                                  />
                                  {cellData?.notes && (
                                    <div className="absolute top-1 right-1 h-1 w-1 rounded-full bg-primary/60" />
                                  )}
                                </div>
                              );
                            })}

                            {/* Total Column */}
                            <div className="flex items-center justify-center h-14 rounded-xl bg-primary/10 border border-primary/20 group/total">
                              <span className="text-sm font-black text-primary group-hover/total:scale-110 transition-transform">{rowTotal.toFixed(1)}</span>
                            </div>
                          </div>
                        </GlassCard>
                      );
                    })}
                  </div>
                </div>

                {/* 7. Tactical Contribution Terminal */}
                <AnimatePresence mode="wait">
                  {activeCell ? (
                    <motion.div
                      key="terminal"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <GlassCard className="border-primary/20 bg-muted/30 shadow-2xl relative overflow-hidden backdrop-blur-3xl">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                          <Activity className="h-40 w-40 text-primary" />
                        </div>

                        <div className="p-8 space-y-8">
                          <div className="flex items-center gap-5">
                            <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-inner">
                              <Users className="h-7 w-7" />
                            </div>
                            <div>
                              <h4 className="text-xl font-black text-foreground leading-tight mb-1">{visibleSections.find(s => s.id === activeCell?.role)?.name}</h4>
                              <div className="flex items-center gap-2">
                                <p className="text-[9px] font-black uppercase text-primary tracking-widest">{visibleSections.find(s => s.id === activeCell?.role)?.title}</p>
                                <span className="h-1 w-1 rounded-full bg-border" />
                                <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-muted border border-border">
                                  <Clock className="h-3 w-3 text-muted-foreground/40" />
                                  <p className="text-[9px] font-black uppercase text-muted-foreground/80 tracking-widest">
                                    {activeCell ? format(parseISO(activeCell.date), 'MMM dd, yyyy') : ''}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Operation Mode</p>
                            <div className="flex gap-2">
                              {['IN_PERSON', 'VIRTUAL'].map((m) => (
                                <button
                                  key={m}
                                  onClick={() => activeCell && handleUpdateLog(activeCell.date, activeCell.role as any, 'mode', m)}
                                  className={cn(
                                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                                    activeCell && (localDayLogs[activeCell.date][activeCell.role as keyof DayLog] as any)?.mode === m
                                      ? "bg-primary text-primary-foreground border-primary shadow-neon-blue/40"
                                      : "bg-muted text-muted-foreground border-border hover:border-primary/20 hover:bg-muted/50"
                                  )}
                                >
                                  {m === 'VIRTUAL' ? 'Virtual' : 'In-Person'}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 space-y-6">
                          <div className="space-y-4">
                            <label className="text-[11px] font-black text-muted-foreground/40 uppercase tracking-widest flex items-center gap-3">
                              <Target className="h-4 w-4 text-primary" /> Mission Documentation
                            </label>
                            <textarea
                              value={activeCell ? (localDayLogs[activeCell.date][activeCell.role as keyof DayLog] as any)?.notes || "" : ""}
                              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => activeCell && handleUpdateLog(activeCell.date, activeCell.role as any, 'notes', e.target.value)}
                              placeholder="Execution details..."
                              className="w-full h-32 bg-muted border border-border rounded-2xl p-6 text-sm focus:outline-none focus:border-primary/40 transition-all resize-none shadow-inner text-foreground placeholder:text-muted-foreground/20"
                            />
                          </div>

                          {activeCell && (localDayLogs[activeCell.date][activeCell.role as keyof DayLog] as any)?.mode === 'VIRTUAL' && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="space-y-3"
                            >
                              <label className="text-[11px] font-black text-amber-500/60 uppercase tracking-widest flex items-center gap-3">
                                <Info className="h-4 w-4" /> Reason for Virtual Connect
                              </label>
                              <input
                                type="text"
                                value={(localDayLogs[activeCell.date][activeCell.role as keyof DayLog] as any)?.reasonVirtual || ""}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => activeCell && handleUpdateLog(activeCell.date, activeCell.role as any, 'reasonVirtual', e.target.value)}
                                placeholder="Explain why a virtual session was required..."
                                className="w-full h-12 bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 text-sm focus:outline-none focus:border-amber-500/40 transition-all text-amber-200 placeholder:text-amber-500/20"
                              />
                            </motion.div>
                          )}

                          <div className="flex items-center justify-end gap-6 pt-6 border-t border-border/50">
                            <button
                              onClick={() => setActiveCell(null)}
                              className="text-[10px] font-black text-muted-foreground/40 hover:text-muted-foreground uppercase tracking-widest transition-all"
                            >
                              CLOSE TERMINAL
                            </button>
                            <button
                              onClick={() => activeCell && handleSaveDay(activeCell.date)}
                              className="flex items-center gap-3 px-8 py-3 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                            >
                              <Check className="h-4 w-4" /> COMMIT LOCAL SYNC
                            </button>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-center">
                      <div className={cn(
                        "px-8 py-4 rounded-2xl border flex items-center gap-4 transition-all duration-500",
                        isWeekCompleted
                          ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)]"
                          : "bg-muted border-border group hover:bg-muted/50"
                      )}>
                        <div className={cn(
                          "h-10 w-10 rounded-xl flex items-center justify-center transition-all",
                          isWeekCompleted ? "bg-emerald-500/10 text-emerald-400" : "bg-muted-foreground/80 group-hover:text-primary group-hover:bg-primary/10"
                        )}>
                          {isWeekCompleted ? <CheckCircle2 className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5 animate-pulse" />}
                        </div>
                        <div className="text-left">
                          <p className={cn(
                            "text-[10px] font-black uppercase tracking-[0.2em]",
                            isWeekCompleted ? "text-emerald-400" : "text-muted-foreground/70 group-hover:text-muted-foreground/90"
                          )}>
                            {isWeekCompleted ? "Sequence Deployment Verified" : "Data Integrity System Ready"}
                          </p>
                          <p className="text-[11px] font-bold text-muted-foreground/80">
                            {isWeekCompleted
                              ? "This week is archived and legally locked."
                              : "Select any data point to inspect or edit telemetry."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </AnimatePresence>

                {/* 8. Final Submission Workflow */}
                {!isWeekCompleted && (
                  <GlassCard className="p-8 border-primary/30 bg-primary/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                          <Send className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-foreground tracking-tight">Finalize Sequence</h3>
                          <p className="text-xs text-muted-foreground font-medium">Prepare Week {selectedWeek?.weekNumber} for immutable record submission.</p>
                        </div>
                      </div>
                      <GradientButton
                        variant="primary"
                        onClick={handleFinalSubmit}
                        disabled={submitWeeklyMutation.isPending}
                        className="px-8 py-3 font-black text-xs"
                      >
                        EXECUTE FINAL SYNC
                      </GradientButton>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div >
    </div >
  );
};
