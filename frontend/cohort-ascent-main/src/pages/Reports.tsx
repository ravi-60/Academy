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
  Legend
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Selection Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground tracking-tight">Analytics Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                  Select a cohort to view detailed performance metrics
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search cohorts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-muted/20 pb-2 pl-10 pr-4 pt-2 text-sm focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Selection Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCohorts.map((cohort, index) => (
                <motion.div
                  key={cohort.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard
                    className="group relative overflow-hidden p-6 hover:border-primary/40 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedCohortId(cohort.id)}
                  >
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors" />

                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
                        <Users className="h-6 w-6" />
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {cohort.skill}
                        </span>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {cohort.code}
                      </h3>
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">BU</span>
                          <span className="font-semibold text-foreground/80">{cohort.bu}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider">GenCs</span>
                          <span className="font-semibold text-foreground/80">{cohort.activeGencCount}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/30 pt-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="mr-2 h-4 w-4" />
                        {new Date(cohort.startDate).toLocaleDateString()}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </GlassCard>
                </motion.div>
              ))}

              {filteredCohorts.length === 0 && (
                <div className="col-span-full py-20 text-center">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-muted/20 mb-4">
                    <Search className="h-10 w-10 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">No cohorts found</h3>
                  <p className="text-muted-foreground mt-1">Try adjusting your search or contact admin for assignments.</p>
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
            {/* Detail Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => setSelectedCohortId(null)}
                  className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl border border-border/40 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-all"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-bold text-foreground">{selectedCohort?.code}</h1>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase">
                      {selectedCohort?.skill}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Comprehensive performance analytics for {selectedCohort?.bu} business unit
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <GradientButton
                  variant="primary"
                  icon={<Download className="h-4 w-4" />}
                  onClick={() => setIsModalOpen(true)}
                >
                  Download Audit Report
                </GradientButton>
              </div>
            </div>

            {loading ? (
              <div className="flex h-[40vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(0,243,255,0.3)]"></div>
              </div>
            ) : (
              <>
                {/* Stats */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  <StatsCard
                    title="Total Effort Hours"
                    value={reportData?.stats.totalEffortHours.toLocaleString() || '0'}
                    icon={Clock}
                    iconColor="cyan"
                    delay={0.1}
                  />
                  <StatsCard
                    title="Active Trainers"
                    value={reportData?.stats.totalTrainers.toString() || '0'}
                    icon={Users}
                    iconColor="violet"
                    delay={0.2}
                  />
                  <StatsCard
                    title="Mentor Support"
                    value={reportData?.stats.totalMentors.toString() || '0'}
                    icon={TrendingUp}
                    iconColor="success"
                    delay={0.3}
                  />
                  <StatsCard
                    title="Attendance %"
                    value={`${reportData?.stats.averageAttendance?.toFixed(1) || '98.5'}%`}
                    icon={FileText}
                    iconColor="blue"
                    delay={0.4}
                  />
                </div>

                {/* Charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <GlassCard className="p-6 h-[450px] relative">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-primary" />
                          Effort Distribution
                        </h3>
                      </div>
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={reportData?.distribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              nameKey="label"
                            >
                              {reportData?.distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip
                              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <GlassCard className="p-6 h-[450px]">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-accent" />
                          Trainer Utilization (Hours)
                        </h3>
                      </div>
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportData?.utilization} layout="vertical">
                            <XAxis type="number" hide />
                            <YAxis
                              dataKey="label"
                              type="category"
                              width={80}
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12, fill: '#94a3b8' }}
                            />
                            <RechartsTooltip
                              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                              contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                            />
                            <Bar
                              dataKey="value"
                              fill="url(#colorGradient)"
                              radius={[0, 4, 4, 0]}
                              barSize={20}
                            />
                            <defs>
                              <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#00F3FF" />
                              </linearGradient>
                            </defs>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </GlassCard>
                  </motion.div>
                </div>

                {/* Recent Activity */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="space-y-1">
                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                          <Clock className="h-5 w-5 text-success" />
                          Recent Performance Activities
                        </h3>
                        <p className="text-xs text-muted-foreground">Downloadable weekly executive summaries submitted by coaches</p>
                      </div>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">Real-time Feed</span>
                    </div>
                    <div className="grid gap-4">
                      {recentActivities.length > 0 ? (
                        recentActivities.map((log, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-4 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/20 transition-all group lg:flex-row flex-col gap-4"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform flex-shrink-0">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground">
                                  {log.title} • <span className="text-primary">{log.cohortCode}</span>
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {log.totalHours}h Aggregate Engagement • Range: {log.weekStartDate} to {log.weekEndDate}
                                </p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">
                                  Validated by: {log.submittedBy || 'System'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 w-full lg:w-auto">
                              <GradientButton
                                variant="outline"
                                size="sm"
                                className="flex-1 lg:flex-none h-10 px-4 text-xs font-bold"
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
                                DOWNLOAD BRIEF
                              </GradientButton>
                              <div className="w-10 h-10 rounded-full border border-border/40 flex items-center justify-center bg-background/40">
                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border/20 rounded-2xl">
                          <p className="font-medium">No weekly performance briefs found.</p>
                          <p className="text-xs mt-1 italic">Submit a weekly log in the "Log Efforts" section to see it here.</p>
                        </div>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
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
