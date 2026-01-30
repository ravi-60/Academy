package com.example.Academy.dto.report;

import java.math.BigDecimal;

public class ReportStatsDTO {
    private BigDecimal totalEffortHours;
    private Long totalTrainers;
    private Long totalMentors;
    private Long reportsGenerated;
    private Double averageAttendance;

    public ReportStatsDTO() {
    }

    public ReportStatsDTO(BigDecimal totalEffortHours, Long totalTrainers, Long totalMentors,
            Long reportsGenerated, Double averageAttendance) {
        this.totalEffortHours = totalEffortHours;
        this.totalTrainers = totalTrainers;
        this.totalMentors = totalMentors;
        this.reportsGenerated = reportsGenerated;
        this.averageAttendance = averageAttendance;
    }

    public BigDecimal getTotalEffortHours() {
        return totalEffortHours;
    }

    public void setTotalEffortHours(BigDecimal totalEffortHours) {
        this.totalEffortHours = totalEffortHours;
    }

    public Long getTotalTrainers() {
        return totalTrainers;
    }

    public void setTotalTrainers(Long totalTrainers) {
        this.totalTrainers = totalTrainers;
    }

    public Long getTotalMentors() {
        return totalMentors;
    }

    public void setTotalMentors(Long totalMentors) {
        this.totalMentors = totalMentors;
    }

    public Long getReportsGenerated() {
        return reportsGenerated;
    }

    public void setReportsGenerated(Long reportsGenerated) {
        this.reportsGenerated = reportsGenerated;
    }

    public Double getAverageAttendance() {
        return averageAttendance;
    }

    public void setAverageAttendance(Double averageAttendance) {
        this.averageAttendance = averageAttendance;
    }
}
