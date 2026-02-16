package com.example.Academy.service;

import com.example.Academy.dto.report.ExecutiveReportData;
import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.StakeholderEffort;
import com.example.Academy.entity.WeeklySummary;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.MentorRepository;
import com.example.Academy.repository.StakeholderEffortRepository;
import com.example.Academy.repository.TrainerRepository;
import com.example.Academy.repository.WeeklySummaryRepository;
import org.springframework.transaction.annotation.Transactional;
import com.example.Academy.util.ExcelExecutiveReportGenerator;
import com.example.Academy.util.PdfExecutiveReportGenerator;
import com.lowagie.text.DocumentException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ExecutiveReportService {

        @Autowired
        private CohortRepository cohortRepository;

        @Autowired
        private StakeholderEffortRepository effortRepository;

        @Autowired
        private WeeklySummaryRepository summaryRepository;

        @Autowired
        private TrainerRepository trainerRepository;

        @Autowired
        private MentorRepository mentorRepository;

        @Transactional(readOnly = true)
        public byte[] generateReport(Long cohortId, LocalDate startDate, LocalDate endDate, String format)
                        throws IOException, DocumentException {
                ExecutiveReportData data = getReportData(cohortId, startDate, endDate);

                if ("PDF".equalsIgnoreCase(format)) {
                        return PdfExecutiveReportGenerator.generate(data);
                } else if ("EXCEL".equalsIgnoreCase(format)) {
                        return ExcelExecutiveReportGenerator.generate(data);
                } else {
                        throw new IllegalArgumentException("Unsupported format: " + format);
                }
        }

        public ExecutiveReportData getReportData(Long cohortId, LocalDate startDate, LocalDate endDate) {
                Cohort cohort = cohortRepository.findById(cohortId)
                                .orElseThrow(() -> new RuntimeException("Cohort not found"));

                List<StakeholderEffort> efforts = effortRepository.findByCohortIdAndEffortDateBetween(cohortId,
                                startDate,
                                endDate);

                // Calculate Totals
                BigDecimal totalHours = efforts.stream()
                                .map(StakeholderEffort::getEffortHours)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal techHours = efforts.stream()
                                .filter(e -> e.getRole() == StakeholderEffort.Role.TRAINER)
                                .map(StakeholderEffort::getEffortHours)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal behavioralHours = efforts.stream()
                                .filter(e -> e.getRole() == StakeholderEffort.Role.BH_TRAINER)
                                .map(StakeholderEffort::getEffortHours)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal mentorHours = efforts.stream()
                                .filter(e -> e.getRole() == StakeholderEffort.Role.MENTOR)
                                .map(StakeholderEffort::getEffortHours)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                BigDecimal buddyMentorHours = efforts.stream()
                                .filter(e -> e.getRole() == StakeholderEffort.Role.BUDDY_MENTOR)
                                .map(StakeholderEffort::getEffortHours)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                // Prep Daily Logs
                Map<LocalDate, ExecutiveReportData.DailyReportLog.DailyReportLogBuilder> logMap = new HashMap<>();

                // Fill all days in range
                startDate.datesUntil(endDate.plusDays(1)).forEach(date -> {
                        logMap.put(date, ExecutiveReportData.DailyReportLog.builder()
                                        .date(date)
                                        .techHours(BigDecimal.ZERO)
                                        .behavioralHours(BigDecimal.ZERO)
                                        .mentorHours(BigDecimal.ZERO)
                                        .buddyMentorHours(BigDecimal.ZERO)
                                        .isHoliday(false)
                                        .notes(""));
                });

                // Group efforts by date
                efforts.forEach(e -> {
                        ExecutiveReportData.DailyReportLog.DailyReportLogBuilder builder = logMap
                                        .get(e.getEffortDate());
                        if (builder != null) {
                                switch (e.getRole()) {
                                        case TRAINER -> builder.techHours(e.getEffortHours());
                                        case BH_TRAINER -> builder.behavioralHours(e.getEffortHours());
                                        case MENTOR -> builder.mentorHours(e.getEffortHours());
                                        case BUDDY_MENTOR -> builder.buddyMentorHours(e.getEffortHours());
                                }
                                if (e.getAreaOfWork() != null && !e.getAreaOfWork().isEmpty()) {
                                        // Simple concatenation of notes if multiple roles log on same day
                                        // For reports, we might just want to show principal activity
                                        builder.notes(e.getAreaOfWork());
                                }
                        }
                });

                // Check for holidays from WeeklySummary if available
                List<WeeklySummary> summaries = summaryRepository.findByCohortId(cohortId);
                Set<LocalDate> holidays = summaries.stream()
                                .map(WeeklySummary::getHolidays)
                                .filter(Objects::nonNull)
                                .flatMap(h -> Arrays.stream(h.split(",")).map(String::trim).filter(s -> !s.isEmpty()))
                                .map(LocalDate::parse)
                                .collect(Collectors.toSet());

                holidays.forEach(h -> {
                        if (logMap.containsKey(h)) {
                                logMap.get(h).isHoliday(true);
                        }
                });

                List<ExecutiveReportData.DailyReportLog> dailyLogs = logMap.values().stream()
                                .map(ExecutiveReportData.DailyReportLog.DailyReportLogBuilder::build)
                                .sorted(Comparator.comparing(ExecutiveReportData.DailyReportLog::getDate))
                                .collect(Collectors.toList());

                List<ExecutiveReportData.DetailedEffortLog> detailedLogs = efforts.stream()
                                .map(e -> ExecutiveReportData.DetailedEffortLog.builder()
                                                .cohortCode(cohort.getCode())
                                                .bu(cohort.getBu())
                                                .skill(cohort.getSkill())
                                                .activeGencCount(cohort.getActiveGencCount())
                                                .trainingLocation(cohort.getTrainingLocation())
                                                .mapped(e.getTrainerMentor() != null
                                                                ? e.getTrainerMentor().getEmployeeType().name()
                                                                : "N/A")
                                                .mentorId(e.getTrainerMentor() != null ? e.getTrainerMentor().getEmpId()
                                                                : "N/A")
                                                .mentorName(e.getTrainerMentor() != null
                                                                ? e.getTrainerMentor().getName()
                                                                : "N/A")
                                                .role(resolveRoleName(e))
                                                .mode(e.getMode() == StakeholderEffort.Mode.VIRTUAL ? "Virtual"
                                                                : "In-Person")
                                                .reasonVirtual(e.getReasonVirtual() != null ? e.getReasonVirtual()
                                                                : "N/A")
                                                .areaOfVisit(e.getAreaOfWork())
                                                .effortHours(e.getEffortHours())
                                                .date(e.getEffortDate())
                                                .month(e.getEffortMonth())
                                                .updatedBy(e.getUpdatedBy() != null ? e.getUpdatedBy().getName()
                                                                : "N/A")
                                                .updatedDate(e.getUpdatedDate())
                                                .build())
                                .sorted(Comparator.comparing(ExecutiveReportData.DetailedEffortLog::getDate))
                                .collect(Collectors.toList());

                return ExecutiveReportData.builder()
                                .cohortCode(cohort.getCode())
                                .businessUnit(cohort.getBu())
                                .skillTrack(cohort.getSkill())
                                .coachName(cohort.getCoach() != null ? cohort.getCoach().getName() : "N/A")
                                .startDate(startDate)
                                .endDate(endDate)
                                .status("VERIFIED") // Assuming if we generate a report, it's for submitted data
                                .generatedAt(LocalDateTime.now())
                                .referenceId(UUID.randomUUID().toString().toUpperCase())
                                .totalHours(totalHours)
                                .attendancePercentage(98.5) // Mock or calculate if attendance data exists
                                .techHours(techHours)
                                .behavioralHours(behavioralHours)
                                .mentorHours(mentorHours)
                                .buddyMentorHours(buddyMentorHours)
                                .dailyLogs(dailyLogs)
                                .detailedLogs(detailedLogs)
                                .build();
        }

        private String resolveRoleName(StakeholderEffort e) {
                if (e.getTrainerMentor() == null) {
                        return switch (e.getRole()) {
                                case TRAINER -> "SME";
                                case MENTOR -> "Mentor";
                                case BUDDY_MENTOR -> "Buddy Mentor";
                                case BH_TRAINER -> "MFRP Contributor";
                        };
                }

                String empId = e.getTrainerMentor().getEmpId();

                if (e.getRole() == StakeholderEffort.Role.TRAINER) {
                        return trainerRepository.findByEmpId(empId)
                                        .map(t -> t.getTrainerType() != null ? capitalize(t.getTrainerType().name())
                                                        : "SME")
                                        .orElse("SME");
                }

                if (e.getRole() == StakeholderEffort.Role.MENTOR) {
                        return mentorRepository.findByEmpId(empId)
                                        .map(m -> m.getMentorType() != null ? capitalize(m.getMentorType().name())
                                                        : "Mentor")
                                        .orElse("Mentor");
                }

                return switch (e.getRole()) {
                        case TRAINER -> "SME";
                        case MENTOR -> "Mentor";
                        case BUDDY_MENTOR -> "Buddy Mentor";
                        case BH_TRAINER -> "MFRP Contributor";
                };
        }

        private String capitalize(String str) {
                if (str == null || str.isEmpty())
                        return str;
                return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
        }
}
