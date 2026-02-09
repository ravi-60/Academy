import api from './api';

export interface ReportStats {
  totalEffortHours: number;
  totalTrainers: number;
  totalMentors: number;
  reportsGenerated: number;
  averageAttendance?: number;
}

export interface ChartData {
  label: string;
  value: number;
}

export interface Activity {
  id: number;
  title: string;
  description: string;
  date: string;
}

export interface ReportResponse {
  stats: ReportStats;
  distribution: ChartData[];
  utilization: ChartData[];
  recentReports: Activity[];
}

export const reportApi = {
  getReportData: (cohortId?: number) => api.get<ReportResponse>('/reports', { params: { cohortId } }),
  getRecentActivities: (coachId?: number) => api.get<any[]>('/reports/recent-activities', { params: { coachId } }),
  exportReport: (params: { cohortId: number; startDate: string; endDate: string; format: string }) =>
    api.get('/reports/export', { params, responseType: 'blob' }),
};
