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
    private List<DetailedEffortLog> detailedLogs;

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

    @Data
    @Builder
    public static class DetailedEffortLog {
        private String cohortCode;
        private String bu;
        private String skill;
        private Integer activeGencCount;
        private String trainingLocation;
        private String mapped; // External/Internal
        private String mentorId;
        private String mentorName;
        private String role; // SME/Mentor/Buddy Mentor/MFRP Contributor
        private String mode; // Mode in which trainer connected
        private String reasonVirtual;
        private String areaOfVisit;
        private BigDecimal effortHours;
        private LocalDate date;
        private String month;
        private String updatedBy;
        private LocalDateTime updatedDate;
    }
}
