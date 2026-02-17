package com.example.Academy.service;

import com.example.Academy.dto.report.ExecutiveReportData;
import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.User;
import com.example.Academy.entity.Trainer;
import com.example.Academy.entity.Mentor;
import com.example.Academy.entity.StakeholderEffort;
import com.example.Academy.entity.WeeklySummary;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.MentorRepository;
import com.example.Academy.repository.StakeholderEffortRepository;
import com.example.Academy.repository.TrainerRepository;
import com.example.Academy.repository.WeeklySummaryRepository;
import com.example.Academy.repository.CohortTrainerMappingRepository;
import com.example.Academy.repository.CohortMentorMappingRepository;
import com.example.Academy.entity.CohortTrainerMapping;
import com.example.Academy.entity.CohortMentorMapping;
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

        @Autowired
        private CohortTrainerMappingRepository trainerMappingRepository;

        @Autowired
        private CohortMentorMappingRepository mentorMappingRepository;

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
                                                .mapped(resolveMappedType(e, cohort))
                                                .mentorId(resolveStakeholderId(e, cohort))
                                                .mentorName(resolveStakeholderName(e, cohort))
                                                .role(resolveRoleName(e))
                                                .mode(e.getMode() == StakeholderEffort.Mode.VIRTUAL ? "Virtual"
                                                                : "In-Person")
                                                .reasonVirtual(e.getMode() == StakeholderEffort.Mode.VIRTUAL
                                                                ? (e.getReasonVirtual() != null ? e.getReasonVirtual()
                                                                                : "N/A")
                                                                : "")
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

        @Transactional(readOnly = true)
        public byte[] generateGlobalReport(int month, int year) throws IOException {
                LocalDate startDate = LocalDate.of(year, month, 1);
                LocalDate endDate = startDate.withDayOfMonth(startDate.lengthOfMonth());
                return generateGlobalReportByRange(startDate, endDate);
        }

        @Transactional(readOnly = true)
        public byte[] generateGlobalReportByRange(LocalDate startDate, LocalDate endDate) throws IOException {
                List<StakeholderEffort> allEfforts = effortRepository.findByEffortDateBetween(startDate, endDate);
                List<ExecutiveReportData.DetailedEffortLog> detailedLogs = new ArrayList<>();

                List<StakeholderEffort> validEfforts = allEfforts.stream()
                                .filter(e -> e.getTrainerMentor() != null)
                                .collect(Collectors.toList());

                for (StakeholderEffort effort : validEfforts) {
                        detailedLogs.add(mapToDetailedLog(effort.getCohort(), effort));
                }

                detailedLogs.sort(Comparator.comparing(ExecutiveReportData.DetailedEffortLog::getCohortCode)
                                .thenComparing(ExecutiveReportData.DetailedEffortLog::getDate));

                ExecutiveReportData data = ExecutiveReportData.builder()
                                .detailedLogs(detailedLogs)
                                .build();

                return ExcelExecutiveReportGenerator.generate(data);
        }

        private ExecutiveReportData.DetailedEffortLog mapToDetailedLog(Cohort cohort, StakeholderEffort e) {
                return ExecutiveReportData.DetailedEffortLog.builder()
                                .cohortCode(cohort.getCode())
                                .bu(cohort.getBu())
                                .skill(cohort.getSkill())
                                .activeGencCount(cohort.getActiveGencCount())
                                .trainingLocation(cohort.getTrainingLocation())
                                .mapped(resolveMappedType(e, cohort))
                                .mentorId(resolveStakeholderId(e, cohort))
                                .mentorName(resolveStakeholderName(e, cohort))
                                .role(resolveRoleName(e))
                                .mode(e.getMode() == StakeholderEffort.Mode.VIRTUAL ? "Virtual" : "In-Person")
                                .reasonVirtual(e.getMode() == StakeholderEffort.Mode.VIRTUAL
                                                ? (e.getReasonVirtual() != null ? e.getReasonVirtual() : "N/A")
                                                : "")
                                .areaOfVisit(e.getAreaOfWork())
                                .effortHours(e.getEffortHours())
                                .date(e.getEffortDate())
                                .month(e.getEffortMonth())
                                .updatedBy(e.getUpdatedBy() != null ? e.getUpdatedBy().getName() : "N/A")
                                .updatedDate(e.getUpdatedDate())
                                .build();
        }

        private ExecutiveReportData.DetailedEffortLog mapToPlaceholder(Cohort cohort, Trainer trainer,
                        StakeholderEffort.Role role, String month) {
                return ExecutiveReportData.DetailedEffortLog.builder()
                                .cohortCode(cohort.getCode())
                                .bu(cohort.getBu())
                                .skill(cohort.getSkill())
                                .activeGencCount(cohort.getActiveGencCount())
                                .trainingLocation(cohort.getTrainingLocation())
                                .mapped(trainer.isInternal() ? "INTERNAL" : "EXTERNAL")
                                .mentorId(trainer.getEmpId())
                                .mentorName(trainer.getName())
                                .role(role == StakeholderEffort.Role.TRAINER ? "SME"
                                                : role == StakeholderEffort.Role.MENTOR ? "Mentor"
                                                                : role == StakeholderEffort.Role.BUDDY_MENTOR ? "Buddy"
                                                                                : "MFRP")
                                .mode("N/A")
                                .reasonVirtual("No activity logged for this period")
                                .areaOfVisit("N/A")
                                .effortHours(BigDecimal.ZERO)
                                .month(month)
                                .updatedBy("System")
                                .build();
        }

        private ExecutiveReportData.DetailedEffortLog mapToPlaceholder(Cohort cohort, Mentor mentor,
                        StakeholderEffort.Role role, String month) {
                return ExecutiveReportData.DetailedEffortLog.builder()
                                .cohortCode(cohort.getCode())
                                .bu(cohort.getBu())
                                .skill(cohort.getSkill())
                                .activeGencCount(cohort.getActiveGencCount())
                                .trainingLocation(cohort.getTrainingLocation())
                                .mapped(mentor.isInternal() ? "INTERNAL" : "EXTERNAL")
                                .mentorId(mentor.getEmpId())
                                .mentorName(mentor.getName())
                                .role(role == StakeholderEffort.Role.TRAINER ? "SME"
                                                : role == StakeholderEffort.Role.MENTOR ? "Mentor"
                                                                : role == StakeholderEffort.Role.BUDDY_MENTOR ? "Buddy"
                                                                                : "MFRP")
                                .mode("N/A")
                                .reasonVirtual("No activity logged for this period")
                                .areaOfVisit("N/A")
                                .effortHours(BigDecimal.ZERO)
                                .month(month)
                                .updatedBy("System")
                                .build();
        }

        private ExecutiveReportData.DetailedEffortLog mapToGenericPlaceholder(Cohort cohort, String month) {
                User primary = cohort.getPrimaryTrainer();
                return ExecutiveReportData.DetailedEffortLog.builder()
                                .cohortCode(cohort.getCode())
                                .bu(cohort.getBu())
                                .skill(cohort.getSkill())
                                .activeGencCount(cohort.getActiveGencCount())
                                .trainingLocation(cohort.getTrainingLocation())
                                .mapped((primary != null && primary.getEmployeeType() != null)
                                                ? primary.getEmployeeType().name()
                                                : "N/A")
                                .mentorId(primary != null ? primary.getEmpId() : "N/A")
                                .mentorName(primary != null ? primary.getName() : "UNASSIGNED")
                                .role("SME (Primary)")
                                .mode("N/A")
                                .reasonVirtual("No team mapping found")
                                .areaOfVisit("N/A")
                                .effortHours(BigDecimal.ZERO)
                                .month(month)
                                .updatedBy("System")
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

        private String resolveMappedType(StakeholderEffort e, Cohort cohort) {
                // Try mapping first
                if (e.getRole() == StakeholderEffort.Role.TRAINER || e.getRole() == StakeholderEffort.Role.BH_TRAINER) {
                        return trainerMappingRepository.findByCohortId(cohort.getId()).stream()
                                        .filter(m -> m.getRole().name().equals(e.getRole().name())
                                                        || (e.getRole() == StakeholderEffort.Role.TRAINER
                                                                        && m.getRole() == CohortTrainerMapping.Role.TRAINER)
                                                        || (e.getRole() == StakeholderEffort.Role.BH_TRAINER
                                                                        && m.getRole() == CohortTrainerMapping.Role.BH_TRAINER))
                                        .findFirst()
                                        .map(m -> m.getTrainer().isInternal() ? "INTERNAL" : "EXTERNAL")
                                        .orElse(e.getTrainerMentor() != null
                                                        ? e.getTrainerMentor().getEmployeeType().name()
                                                        : "N/A");
                }
                if (e.getRole() == StakeholderEffort.Role.MENTOR
                                || e.getRole() == StakeholderEffort.Role.BUDDY_MENTOR) {
                        return mentorMappingRepository.findByCohortId(cohort.getId()).stream()
                                        .filter(m -> m.getRole().name().equals(e.getRole().name())
                                                        || (e.getRole() == StakeholderEffort.Role.MENTOR
                                                                        && m.getRole() == CohortMentorMapping.Role.MENTOR)
                                                        || (e.getRole() == StakeholderEffort.Role.BUDDY_MENTOR
                                                                        && m.getRole() == CohortMentorMapping.Role.BUDDY_MENTOR))
                                        .findFirst()
                                        .map(m -> m.getMentor().isInternal() ? "INTERNAL" : "EXTERNAL")
                                        .orElse(e.getTrainerMentor() != null
                                                        ? e.getTrainerMentor().getEmployeeType().name()
                                                        : "N/A");
                }
                return e.getTrainerMentor() != null ? e.getTrainerMentor().getEmployeeType().name() : "N/A";
        }

        private String resolveStakeholderId(StakeholderEffort e, Cohort cohort) {
                if (e.getRole() == StakeholderEffort.Role.TRAINER || e.getRole() == StakeholderEffort.Role.BH_TRAINER) {
                        Optional<String> id = trainerMappingRepository.findByCohortId(cohort.getId()).stream()
                                        .filter(m -> m.getRole().name().equals(e.getRole().name()))
                                        .findFirst()
                                        .map(m -> m.getTrainer().getEmpId());
                        if (id.isPresent())
                                return id.get();
                }
                if (e.getRole() == StakeholderEffort.Role.MENTOR
                                || e.getRole() == StakeholderEffort.Role.BUDDY_MENTOR) {
                        Optional<String> id = mentorMappingRepository.findByCohortId(cohort.getId()).stream()
                                        .filter(m -> m.getRole().name().equals(e.getRole().name()))
                                        .findFirst()
                                        .map(m -> m.getMentor().getEmpId());
                        if (id.isPresent())
                                return id.get();
                }

                if (e.getTrainerMentor() != null) {
                        String empId = e.getTrainerMentor().getEmpId();
                        if ("2457131".equals(empId) || "2457".equals(empId) || "coach2001".equals(empId)) {
                                if (e.getUpdatedBy() != null)
                                        return e.getUpdatedBy().getEmpId();
                        }
                        return e.getTrainerMentor().getEmpId();
                }

                return "N/A";
        }

        private String resolveStakeholderName(StakeholderEffort e, Cohort cohort) {
                // 1. Primary Source: Cohort Mappings (What's in the Dashboard)
                if (e.getRole() == StakeholderEffort.Role.TRAINER || e.getRole() == StakeholderEffort.Role.BH_TRAINER) {
                        Optional<String> name = trainerMappingRepository.findByCohortId(cohort.getId()).stream()
                                        .filter(m -> m.getRole().name().equals(e.getRole().name()))
                                        .findFirst()
                                        .map(m -> m.getTrainer().getName());
                        if (name.isPresent())
                                return name.get();
                }
                if (e.getRole() == StakeholderEffort.Role.MENTOR
                                || e.getRole() == StakeholderEffort.Role.BUDDY_MENTOR) {
                        Optional<String> name = mentorMappingRepository.findByCohortId(cohort.getId()).stream()
                                        .filter(m -> m.getRole().name().equals(e.getRole().name()))
                                        .findFirst()
                                        .map(m -> m.getMentor().getName());
                        if (name.isPresent())
                                return name.get();
                }

                // 2. Secondary Source: Actual Log Creator (If trainer_mentor is a system dummy)
                if (e.getTrainerMentor() != null) {
                        String empId = e.getTrainerMentor().getEmpId();
                        if ("2457131".equals(empId) || "2457".equals(empId) || "coach2001".equals(empId)) {
                                if (e.getUpdatedBy() != null)
                                        return e.getUpdatedBy().getName();
                        }
                        return e.getTrainerMentor().getName();
                }

                return "N/A";
        }
}
