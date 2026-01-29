import api from './api';

export interface ReportStats {
  totalEffortHours: number;
  totalTrainers: number;
  totalMentors: number;
  reportsGenerated: number;
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
  getReportData: () => api.get<ReportResponse>('/reports'),
};
