import { motion } from 'framer-motion';
import {
  BarChart3,
  Download,
  FileText,
  TrendingUp,
  Users,
  Clock,
  Calendar,
  Filter,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GradientButton } from '@/components/ui/GradientButton';
import { StatsCard } from '@/components/ui/StatsCard';
import { reportApi, ReportResponse } from '@/reportApi';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export const Reports = () => {
  const [reportData, setReportData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reportApi.getReportData();
        setReportData(response.data);
      } catch (error) {
        console.error('Failed to fetch report data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="mt-2 text-muted-foreground">
            View insights and export training reports
          </p>
        </div>
        <div className="flex gap-3">
          <GradientButton variant="outline" icon={<Filter className="h-4 w-4" />}>
            Filters
          </GradientButton>
          <GradientButton variant="primary" icon={<Download className="h-4 w-4" />}>
            Export Report
          </GradientButton>
        </div>
      </motion.div>

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
          title="No. of Active Trainers"
          value={reportData?.stats.totalTrainers.toString() || '0'}
          icon={Users}
          iconColor="violet"
          delay={0.2}
        />
        <StatsCard
          title="Total No. of Mentors"
          value={reportData?.stats.totalMentors.toString() || '0'}
          icon={TrendingUp}
          iconColor="success"
          delay={0.3}
        />
        <StatsCard
          title="Reports Generated"
          value={reportData?.stats.reportsGenerated.toString() || '0'}
          icon={FileText}
          iconColor="blue"
          delay={0.4}
        />
      </div>

      {/* Charts Placeholder */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <GlassCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Effort Distribution</h3>
            <div className="h-64 rounded-lg border border-border/30 bg-muted/20 p-4">
              <div className="space-y-3 overflow-y-auto h-full">
                {reportData?.distribution.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <div className="flex flex-1 mx-4 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="bg-primary/60 h-full"
                        style={{ width: `${Math.min((item.value / (reportData.stats.totalEffortHours || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.value}h</span>
                  </div>
                )) || <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>}
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <GlassCard className="p-6">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Trainer Utilization</h3>
            <div className="h-64 rounded-lg border border-border/30 bg-muted/20 p-4">
              <div className="space-y-3 overflow-y-auto h-full">
                {reportData?.utilization.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground truncate w-24">{item.label}</span>
                    <div className="flex flex-1 mx-4 h-2 bg-muted/30 rounded-full overflow-hidden">
                      <div
                        className="bg-accent/60 h-full"
                        style={{ width: `${Math.min((item.value / (reportData.stats.totalEffortHours || 1)) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{item.value}h</span>
                  </div>
                )) || <div className="flex h-full items-center justify-center text-muted-foreground">No data available</div>}
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Recent Reports */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <GlassCard className="p-6">
          <h3 className="mb-6 text-lg font-semibold text-foreground">Recent Activity Logs</h3>
          <div className="space-y-4">
            {reportData?.recentReports.length ? (
              reportData.recentReports.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-4 transition-all hover:border-primary/30 hover:bg-muted/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{report.title}</p>
                      <p className="text-sm text-muted-foreground">{report.description} • {report.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="badge-status bg-muted text-muted-foreground font-mono">LOG</span>
                    <GradientButton variant="ghost" size="sm" icon={<Download className="h-4 w-4" />}>
                      Download
                    </GradientButton>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent activities found</div>
            )}
          </div>
        </GlassCard>
      </motion.div>

    </div>
  );
};
