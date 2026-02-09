package com.example.Academy.dto.report;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ExecutiveReportData {
    private String cohortCode;
    private String businessUnit;
    private String skillTrack;
    private String coachName;
    private LocalDate startDate;
    private LocalDate endDate;
    private String status;
    private LocalDateTime generatedAt;
    private String referenceId;

    // Summary
    private BigDecimal totalHours;
    private Double attendancePercentage;
    private BigDecimal techHours;
    private BigDecimal behavioralHours;
    private BigDecimal mentorHours;
    private BigDecimal buddyMentorHours;

    // Breakdown
    private List<DailyReportLog> dailyLogs;

    @Data
    @Builder
    public static class DailyReportLog {
        private LocalDate date;
        private BigDecimal techHours;
        private BigDecimal behavioralHours;
        private BigDecimal mentorHours;
        private BigDecimal buddyMentorHours;
        private boolean isHoliday;
        private String notes;
    }
}
