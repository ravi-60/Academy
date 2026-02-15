package com.example.Academy.dto.report;

import com.example.Academy.entity.Activity;
import java.util.List;
import java.util.Map;
import java.math.BigDecimal;

public class ReportResponseDTO {
    private ReportStatsDTO stats;
    private List<ChartDataDTO> distribution;
    private List<ChartDataDTO> utilization;
    private List<Activity> recentReports;
    private Map<String, BigDecimal> latestWeekEffort;
    private Map<String, BigDecimal> overallEffort;

    public ReportResponseDTO() {
    }

    public ReportResponseDTO(ReportStatsDTO stats, List<ChartDataDTO> distribution, List<ChartDataDTO> utilization,
            List<Activity> recentReports, Map<String, BigDecimal> latestWeekEffort,
            Map<String, BigDecimal> overallEffort) {
        this.stats = stats;
        this.distribution = distribution;
        this.utilization = utilization;
        this.recentReports = recentReports;
        this.latestWeekEffort = latestWeekEffort;
        this.overallEffort = overallEffort;
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

    public Map<String, BigDecimal> getLatestWeekEffort() {
        return latestWeekEffort;
    }

    public void setLatestWeekEffort(Map<String, BigDecimal> latestWeekEffort) {
        this.latestWeekEffort = latestWeekEffort;
    }

    public Map<String, BigDecimal> getOverallEffort() {
        return overallEffort;
    }

    public void setOverallEffort(Map<String, BigDecimal> overallEffort) {
        this.overallEffort = overallEffort;
    }
}
