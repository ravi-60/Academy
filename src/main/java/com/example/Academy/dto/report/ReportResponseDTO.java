package com.example.Academy.dto.report;

import com.example.Academy.entity.Activity;
import java.util.List;

public class ReportResponseDTO {
    private ReportStatsDTO stats;
    private List<ChartDataDTO> distribution;
    private List<ChartDataDTO> utilization;
    private List<Activity> recentReports;

    public ReportResponseDTO() {
    }

    public ReportResponseDTO(ReportStatsDTO stats, List<ChartDataDTO> distribution, List<ChartDataDTO> utilization,
            List<Activity> recentReports) {
        this.stats = stats;
        this.distribution = distribution;
        this.utilization = utilization;
        this.recentReports = recentReports;
    }

    public ReportStatsDTO getStats() {
        return stats;
    }

    public void setStats(ReportStatsDTO stats) {
        this.stats = stats;
    }

    public List<ChartDataDTO> getDistribution() {
        return distribution;
    }

    public void setDistribution(List<ChartDataDTO> distribution) {
        this.distribution = distribution;
    }

    public List<ChartDataDTO> getUtilization() {
        return utilization;
    }

    public void setUtilization(List<ChartDataDTO> utilization) {
        this.utilization = utilization;
    }

    public List<Activity> getRecentReports() {
        return recentReports;
    }

    public void setRecentReports(List<Activity> recentReports) {
        this.recentReports = recentReports;
    }
}
