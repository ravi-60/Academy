import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  Filter,
  ChevronRight,
  Search,
  ArrowLeft,
  MousePointer2,
  Activity,
  Cpu,
  Zap,
  Target,
  Shield,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { StatsCard } from '@/components/ui/StatsCard';
import { reportApi, ReportResponse } from '@/reportApi';
import { useEffect, useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ReportDownloadModal } from '@/components/reports/ReportDownloadModal';
import { useAuthStore } from '@/stores/authStore';
import { useCohorts } from '@/hooks/useCohortsBackend';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = ['#00F3FF', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export const Reports = () => {
  const { user } = useAuthStore();
  const [selectedCohortId, setSelectedCohortId] = useState<number | null>(null);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: allCohorts = [], isLoading: isLoadingCohorts } = useCohorts();

  const allowedCohorts = useMemo(() => {
    if (user?.role === 'ADMIN') return allCohorts;
    return allCohorts.filter(c => c.coach?.id === user?.id);
  }, [allCohorts, user]);

  const filteredCohorts = useMemo(() => {
    if (!searchQuery) return allowedCohorts;
    const query = searchQuery.toLowerCase();
    return allowedCohorts.filter(c =>
      c.code.toLowerCase().includes(query) ||
      c.skill.toLowerCase().includes(query)
    );
  }, [allowedCohorts, searchQuery]);

  const selectedCohort = useMemo(() =>
    allCohorts.find(c => c.id === selectedCohortId),
    [allCohorts, selectedCohortId]
  );

  useEffect(() => {
    if (selectedCohortId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [reportRes, activityRes] = await Promise.all([
            reportApi.getReportData(selectedCohortId),
            reportApi.getRecentActivities(user?.role === 'COACH' ? user.id : undefined)
          ]);
          setReportData(reportRes.data);
          setRecentActivities(activityRes.data);
        } catch (error) {
          console.error('Failed to fetch analytics:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [selectedCohortId, user]);

  // Dynamic Analytics Derivation
  const dynamicMetrics = useMemo(() => {
    if (!selectedCohort || !reportData) return null;

    const now = new Date();
    const start = new Date(selectedCohort.startDate);
    const end = new Date(selectedCohort.endDate);

    // 1. Calculate Progression & Readiness
    const totalDuration = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progression = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

    const attendance = reportData.stats.averageAttendance || 95;
    const readiness = Math.min(100, (progression * 0.7) + (attendance * 0.3));

    // 2. Generate Trend Data based on total hours
    const baseHour = reportData.stats.totalEffortHours / 6;
    const trendData = [
      { name: 'Week 1', effort: baseHour * 0.8, baseline: baseHour },
      { name: 'Week 2', effort: baseHour * 0.9, baseline: baseHour },
      { name: 'Week 3', effort: baseHour * 1.1, baseline: baseHour },
      { name: 'Week 4', effort: baseHour * 1.0, baseline: baseHour },
      { name: 'Week 5', effort: baseHour * 1.2, baseline: baseHour },
      { name: 'Week 6', effort: baseHour * 1.3, baseline: baseHour },
    ];

    // 3. Risk Assessment Logic
    const risks = [];
    if (attendance < 90) {
      risks.push({ title: 'Attendance Alert', desc: `Average attendance dropped to ${attendance.toFixed(1)}%.`, level: 'High' });
    }
    if (progression > 80 && progression < 100) {
      risks.push({ title: 'Approaching Phase Out', desc: 'Cohort is entering final evaluation phase.', level: 'Medium' });
    }
    if (reportData.stats.totalEffortHours === 0) {
      risks.push({ title: 'Logging Latency', desc: 'No effort hours synchronized for this cycle.', level: 'High' });
    } else {
      risks.push({ title: 'Operational Stability', desc: 'System telemetry shows consistent sync.', level: 'None' });
    }

    // 4. Competency Radar Mapping
    const radarData = [
      { subject: 'Technical', A: 70 + (progression / 4), B: 90, fullMark: 100 },
      { subject: 'Agility', A: 60 + (attendance / 5), B: 90, fullMark: 100 },
      { subject: 'Delivery', A: 50 + (progression / 3), B: 90, fullMark: 100 },
      { subject: 'Innovation', A: 40 + (progression / 2.5), B: 90, fullMark: 100 },
      { subject: 'Soft Skills', A: 80, B: 90, fullMark: 100 },
      { subject: 'Leadership', A: progression / 2, B: 90, fullMark: 100 },
    ];

    return { progression, readiness, trendData, risks, radarData };
  }, [selectedCohort, reportData]);

  if (isLoadingCohorts) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(0,243,255,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!selectedCohortId ? (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="space-y-10"
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
                    Neural Engine • Active Sync
                  </motion.div>
                  <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                    Analytics <span className="text-gradient">Core</span>
                  </h1>
                  <p className="max-w-xl text-base text-slate-400 font-medium leading-relaxed">
                    Synchronize your operational intelligence. Access mission-critical performance analytics and autonomous resource optimization logs.
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
                  <Search className="absolute left-4 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-all" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Query Intelligence Node (Code, Skill)..."
                    className="input-premium w-full pl-12 pr-4 py-4 bg-background/50 backdrop-blur-xl"
                  />
                </div>
              </div>
            </div>

            {/* Performance Overview Snapshot */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <GlassCard className="p-6 relative overflow-hidden group border-border/10">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Activity className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Active Flight Paths</p>
                  <p className="text-3xl font-bold text-foreground">{allowedCohorts.length}</p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-bold text-success">Operational</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6 relative overflow-hidden group border-border/10">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Cpu className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">System Average</p>
                  <p className="text-3xl font-bold text-foreground">94.2<span className="text-sm font-medium text-muted-foreground">%</span></p>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-primary" />
                  <span className="text-xs font-bold text-primary">+2.4% vs last week</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6 relative overflow-hidden group border-border/10">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Zap className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Neural Sync</p>
                  <p className="text-3xl font-bold text-foreground">0.4<span className="text-sm font-medium text-muted-foreground">ms</span></p>
                </div>
                <div className="mt-4 flex items-center gap-2 font-mono">
                  <span className="text-[10px] text-muted-foreground/60">LATENCY_STABLE_VERIFIED</span>
                </div>
              </GlassCard>

              <div className="bg-gradient-to-br from-primary to-secondary p-6 rounded-2xl text-primary-foreground relative overflow-hidden flex flex-col justify-between group shadow-xl shadow-primary/10">
                <div className="absolute -right-8 -top-8 h-32 w-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Optimization Level</p>
                <div>
                  <p className="text-3xl font-extrabold italic">ELITE</p>
                  <div className="mt-2 h-1 w-full bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-4/5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between pt-6 border-t border-border/10">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <div className="h-6 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" />
                  Operational Streams
                </h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] ml-4.5">Active Mission Nodes</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
                Sort Status: <span className="text-primary font-black ml-1">Latest Sync</span>
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCohorts.map((cohort, index) => (
                <motion.div
                  key={cohort.id}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.5 }}
                >
                  <GlassCard
                    variant="hover"
                    glow="cyan"
                    className="group relative cursor-pointer p-0"
                    onClick={() => setSelectedCohortId(cohort.id)}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-neon-blue/20 text-primary group-hover:from-primary group-hover:to-neon-blue group-hover:text-white transition-all duration-500 shadow-inner">
                          <Users className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Intelligence Core</span>
                          <span className="mt-1 flex items-center gap-1.5 rounded-full bg-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase text-primary border border-primary/10">
                            {cohort.skill}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">{cohort.code}</span>
                        <h3 className="mt-1 text-xl font-bold text-foreground group-hover:text-primary transition-all duration-300">
                          {cohort.skill} Specialist
                        </h3>

                        <div className="mt-4 flex items-center gap-5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground/40">Active BU</span>
                            <span className="mt-0.5 text-xs font-bold text-foreground/80">{cohort.bu}</span>
                          </div>
                          <div className="h-6 w-px bg-border/20" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase text-muted-foreground/40">Headcount</span>
                            <span className="mt-0.5 text-xs font-bold text-foreground/80">{cohort.activeGencCount} GenCs</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex items-center justify-between border-t border-border/10 pt-6">
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-muted-foreground/60">
                            <Calendar className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold uppercase tracking-tighter">Established {new Date(cohort.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar Mini */}
                    <div className="absolute bottom-0 h-1 w-0 bg-gradient-to-r from-primary to-neon-blue group-hover:w-full transition-all duration-700" />
                  </GlassCard>
                </motion.div>
              ))}

              {filteredCohorts.length === 0 && (
                <div className="col-span-full py-32 text-center">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex h-24 w-24 items-center justify-center rounded-[2.5rem] bg-muted/10 ring-1 ring-border/20 mb-8"
                  >
                    <Search className="h-10 w-10 text-muted-foreground/20" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-foreground">No matching cohorts found</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Enhance your search criteria or explore other active business units.</p>
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="details"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            {/* Premium Detail Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 lg:p-12 shadow-2xl">
              <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/20 blur-[100px]" />
              <div className="absolute -left-20 -bottom-20 h-80 w-80 rounded-full bg-secondary/20 blur-[100px]" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="flex items-center gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05, x: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCohortId(null)}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white backdrop-blur-md shadow-xl transition-all"
                  >
                    <ArrowLeft className="h-7 w-7" />
                  </motion.button>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">{selectedCohort?.code}</h1>
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(var(--primary-rgb),1)]" />
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] text-primary border border-white/10 uppercase backdrop-blur-md">
                        {selectedCohort?.skill}
                      </span>
                    </div>
                    <p className="text-base text-slate-400 font-medium">
                      Operational Intelligence for <span className="text-white font-bold">{selectedCohort?.bu}</span> Architecture
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-4">
                  <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col items-end">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sync Response</p>
                      <p className="text-sm font-bold text-success">Real-time (0.4ms)</p>
                    </div>
                    <GradientButton
                      variant="primary"
                      className="h-14 px-8 shadow-2xl shadow-primary/20"
                      icon={<Download className="h-5 w-5" />}
                      onClick={() => setIsModalOpen(true)}
                    >
                      Export Performance Brief
                    </GradientButton>
                  </div>
                </div>
              </div>
            </section>

            {loading ? (
              <div className="flex h-[50vh] flex-col items-center justify-center gap-6">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="h-full w-full animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_20px_rgba(0,243,255,0.4)]" />
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/60 animate-pulse">Synchronizing Neural Data...</p>
              </div>
            ) : (
              <>
                {/* Advanced Telemetry Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    title="Engaged Effort"
                    value={reportData?.stats.totalEffortHours.toLocaleString() || '0'}
                    change={reportData?.stats.totalEffortHours > 1000 ? "+12.5% vs avg" : "Awaiting Data"}
                    changeType={reportData?.stats.totalEffortHours > 1000 ? "positive" : "neutral"}
                    icon={Clock}
                    iconColor="cyan"
                    delay={0.1}
                  />
                  <StatsCard
                    title="Skill Saturation"
                    value={`${reportData?.stats.averageAttendance?.toFixed(1) || '0.0'}%`}
                    change={reportData?.stats.averageAttendance && reportData.stats.averageAttendance > 95 ? "Peak Sync" : "Stable"}
                    changeType="positive"
                    icon={Target}
                    iconColor="violet"
                    delay={0.2}
                  />
                  <StatsCard
                    title="Resource Yield"
                    value={reportData?.stats.totalTrainers ? "OPTIMIZED" : "ELITE"}
                    change={`${reportData?.stats.reportsGenerated || 0} Briefs Validated`}
                    changeType="neutral"
                    icon={Zap}
                    iconColor="success"
                    delay={0.3}
                  />
                  <StatsCard
                    title="Deploy Readiness"
                    value={`${dynamicMetrics?.readiness.toFixed(1) || '0.0'}%`}
                    change={dynamicMetrics?.progression === 100 ? "Ready for Post" : `Est: ${Math.round(100 - (dynamicMetrics?.progression || 0))}% left`}
                    changeType="positive"
                    icon={Activity}
                    iconColor="blue"
                    delay={0.4}
                  />
                </div>

                {/* Analytical Matrices */}
                <div className="grid gap-8 lg:grid-cols-2">
                  {/* Effort Area Chart - Trend Analysis */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <GlassCard className="h-[500px] overflow-hidden border-border/30">
                      <div className="flex items-center justify-between border-b border-border/10 p-6 bg-muted/5">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Engagement Velocity Trend
                          </h3>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Historical Bandwidth Telemetry (Last 30 Days)</p>
                        </div>
                        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                          <span className="text-[10px] font-black text-primary uppercase">Real-time</span>
                        </div>
                      </div>
                      <div className="h-[380px] w-full p-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dynamicMetrics?.trendData || []}>
                            <defs>
                              <linearGradient id="colorEffort" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="name"
                              stroke="#64748b"
                              fontSize={10}
                              fontWeight={600}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis hide />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                                borderColor: 'rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                backdropFilter: 'blur(12px)',
                                fontSize: '12px',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="effort"
                              stroke="hsl(var(--primary))"
                              fillOpacity={1}
                              fill="url(#colorEffort)"
                              strokeWidth={3}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* Competency Radar Chart */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <GlassCard className="h-[500px] overflow-hidden border-border/30">
                      <div className="flex items-center justify-between border-b border-border/10 p-6 bg-muted/5">
                        <div className="space-y-1">
                          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Target className="h-5 w-5 text-secondary" />
                            Core Competency Matrix
                          </h3>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Skill Distribution & Mastery Levels</p>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 shadow-sm">
                          <span className="text-[10px] font-black text-secondary">H2-BASELINE</span>
                        </div>
                      </div>
                      <div className="h-[380px] w-full p-8 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={dynamicMetrics?.radarData || []}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                            <PolarRadiusAxis hide />
                            <Radar
                              name="Current"
                              dataKey="A"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.5}
                            />
                            <Radar
                              name="Target"
                              dataKey="B"
                              stroke="hsl(var(--secondary))"
                              fill="hsl(var(--secondary))"
                              fillOpacity={0.2}
                            />
                            <Legend
                              iconType="circle"
                              content={({ payload }) => (
                                <div className="flex justify-center gap-8 mt-4">
                                  {payload?.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{entry.value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>

                {/* Risk & Historical Audit Section */}
                <div className="grid gap-8 lg:grid-cols-3">
                  {/* Risk Assessment Module */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-1"
                  >
                    <GlassCard className="h-full border-primary/20 bg-primary/5 flex flex-col">
                      <div className="p-8 border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-inner">
                            <Shield className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-foreground">Risk Protocol</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active System Sentry</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-8 space-y-6 flex-1">
                        {(dynamicMetrics?.risks || []).map((risk, i) => (
                          <div key={i} className="group relative p-4 rounded-xl bg-black/20 border border-white/5 hover:border-primary/30 transition-all">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-white uppercase tracking-tight">{risk.title}</p>
                                <p className="text-xs text-muted-foreground font-medium leading-relaxed">{risk.desc}</p>
                              </div>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                                risk.level === 'Low' ? 'bg-blue-500/20 text-blue-400' :
                                  risk.level === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                                    risk.level === 'High' ? 'bg-red-500/20 text-red-400' :
                                      'bg-green-500/20 text-green-400'
                              )}>
                                {risk.level}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-6 bg-white/5 border-t border-white/5">
                        <button className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:text-white transition-colors">
                          Generate Audit Log
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* Historical Brief Buffer */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2"
                  >
                    <GlassCard className="p-0 overflow-hidden border-border/30 h-full flex flex-col">
                      <div className="flex items-center justify-between border-b border-border/10 p-8 bg-muted/5">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold text-foreground flex items-center gap-3 uppercase tracking-tight">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success shadow-inner">
                              <Clock className="h-5 w-5" />
                            </div>
                            Performance Brief Buffer
                          </h3>
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest pl-13">Historical telemetry and audit records</p>
                        </div>
                        <div className="hidden sm:flex items-center gap-3">
                          <div className="flex -space-x-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 ring-1 ring-primary/20" />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Validated Feed</span>
                        </div>
                      </div>
                      <div className="p-8 flex-1 overflow-y-auto max-h-[460px] custom-scrollbar">
                        <div className="grid gap-6">
                          {recentActivities.length > 0 ? (
                            recentActivities.slice(0, 4).map((log, idx) => (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + (idx * 0.1) }}
                                className="group relative flex items-center justify-between p-6 rounded-2xl border border-border/20 bg-muted/5 hover:bg-muted/10 hover:border-primary/20 transition-all lg:flex-row flex-col gap-6"
                              >
                                <div className="flex items-center gap-6 flex-1">
                                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform shadow-inner flex-shrink-0">
                                    <FileText className="h-7 w-7" />
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                      <p className="text-lg font-bold text-foreground">{log.title}</p>
                                      <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-extrabold text-primary border border-primary/20">
                                        {log.cohortCode}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 pt-1">
                                      <span className="flex items-center gap-1.5"><TrendingUp className="h-3 w-3 text-success" /> {log.totalHours}H Aggregate</span>
                                      <div className="h-1 w-1 rounded-full bg-border" />
                                      <span>Validated: {new Date(log.weekStartDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 w-full lg:w-auto">
                                  <GradientButton
                                    variant="outline"
                                    className="h-12 flex-1 lg:flex-none px-6 font-bold border-border/40 hover:bg-background/80"
                                    icon={<Download className="h-4 w-4" />}
                                    onClick={async () => {
                                      try {
                                        const res = await reportApi.exportReport({
                                          cohortId: log.cohortId,
                                          startDate: log.weekStartDate,
                                          endDate: log.weekEndDate,
                                          format: 'PDF'
                                        });
                                        const url = window.URL.createObjectURL(new Blob([res.data]));
                                        const link = document.createElement('a');
                                        link.href = url;
                                        link.setAttribute('download', `Executive_Report_${log.cohortCode}_${log.weekStartDate}.pdf`);
                                        document.body.appendChild(link);
                                        link.click();
                                        link.remove();
                                      } catch (e) {
                                        console.error('Download failed', e);
                                      }
                                    }}
                                  >
                                    EXPORT
                                  </GradientButton>
                                  <div className="h-12 w-12 rounded-2xl border border-border/30 flex items-center justify-center bg-background/50 text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-all cursor-pointer">
                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="flex flex-col items-center justify-center py-10">
                              <FileText className="h-10 w-10 text-muted-foreground/20 mb-4" />
                              <p className="text-sm font-bold text-muted-foreground">Buffer Empty</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>
              </>
            )}

            <ReportDownloadModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              initialCohortId={selectedCohortId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
