package com.example.Academy.service;

import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.StakeholderEffort;
import com.example.Academy.entity.User;
import com.example.Academy.entity.WeeklySummary;
import com.example.Academy.entity.CohortTrainerMapping;
import com.example.Academy.entity.CohortMentorMapping;
import com.example.Academy.repository.CohortTrainerMappingRepository;
import com.example.Academy.repository.CohortMentorMappingRepository;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.StakeholderEffortRepository;
import com.example.Academy.repository.UserRepository;
import com.example.Academy.repository.WeeklySummaryRepository;
import com.example.Academy.dto.effort.WeeklyEffortSubmissionDTO;
import com.example.Academy.dto.effort.DayLogDTO;
import com.example.Academy.dto.effort.EffortDetailDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class EffortService {

    @Autowired
    private StakeholderEffortRepository effortRepository;

    @Autowired
    private CohortRepository cohortRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WeeklySummaryRepository weeklySummaryRepository;

    @Autowired
    private CohortTrainerMappingRepository trainerMappingRepository;

    @Autowired
    private CohortMentorMappingRepository mentorMappingRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private NotificationService notificationService;

    public StakeholderEffort submitEffort(StakeholderEffort effort, Long userId) {
        // Validate submission window
        validateSubmissionWindow(effort.getEffortDate());

        // Validate cohort exists
        Cohort cohort = cohortRepository.findById(effort.getCohort().getId())
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        // Validate trainer/mentor exists
        if (!userRepository.existsById(effort.getTrainerMentor().getId())) {
            throw new RuntimeException("Trainer/Mentor not found");
        }

        // Set updated by
        User updatedBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        effort.setUpdatedBy(updatedBy);
        effort.setUpdatedDate(LocalDateTime.now());

        // Set month from date
        effort.setEffortMonth(effort.getEffortDate().getMonth().toString());

        StakeholderEffort savedEffort = effortRepository.save(effort);

        // Update weekly summary
        updateWeeklySummary(cohort, effort.getEffortDate(), updatedBy.getName(), updatedBy.getAvatar());

        // Send email notification (to Admins only)
        emailService.sendDailyEffortNotification(savedEffort);

        // Send In-App notification to Admins
        notificationService.notifyRole(
                "ADMIN",
                "REPORT_SUBMITTED",
                "Intelligence Report: Effort Logged",
                String.format("%s submitted %.1fh of technical training for %s",
                        updatedBy.getName(),
                        savedEffort.getEffortHours(),
                        cohort.getCode()),
                "/cohorts/" + cohort.getId() + "?tab=efforts",
                userId);

        return savedEffort;
    }

    public List<StakeholderEffort> getEffortsByCohort(Long cohortId) {
        return effortRepository.findByCohortId(cohortId);
    }

    public List<StakeholderEffort> getEffortsByCohortAndDateRange(Long cohortId, LocalDate startDate,
            LocalDate endDate) {
        return effortRepository.findByCohortIdAndEffortDateBetween(cohortId, startDate, endDate);
    }

    public List<StakeholderEffort> getEffortsByTrainerMentor(Long trainerMentorId) {
        return effortRepository.findByTrainerMentorId(trainerMentorId);
    }

    public Optional<StakeholderEffort> getEffortById(Long id) {
        return effortRepository.findById(id);
    }

    public void deleteEffort(Long id) {
        StakeholderEffort effort = effortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Effort not found"));

        effortRepository.deleteById(id);

        // Update weekly summary after deletion
        updateWeeklySummary(effort.getCohort(),
                effort.getEffortDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)),
                "System (After Deletion)", null);
    }

    public void updateWeeklySummary(Cohort cohort, LocalDate weekStart, String submittedByName,
            String submittedByAvatar) {
        LocalDate weekEnd = weekStart.plusDays(6);

        // Calculate total hours
        Double totalHoursDouble = effortRepository.sumEffortHoursByCohortAndDateRange(
                cohort.getId(), weekStart, weekEnd);
        BigDecimal totalHours = totalHoursDouble != null ? BigDecimal.valueOf(totalHoursDouble) : BigDecimal.ZERO;

        // Calculate individual role hours
        Double techHours = effortRepository.sumEffortHoursByCohortRoleAndDateRange(cohort.getId(),
                StakeholderEffort.Role.TRAINER, weekStart, weekEnd);
        Double bhHours = effortRepository.sumEffortHoursByCohortRoleAndDateRange(cohort.getId(),
                StakeholderEffort.Role.BH_TRAINER, weekStart, weekEnd);
        Double mentorHours = effortRepository.sumEffortHoursByCohortRoleAndDateRange(cohort.getId(),
                StakeholderEffort.Role.MENTOR, weekStart, weekEnd);
        Double buddyHours = effortRepository.sumEffortHoursByCohortRoleAndDateRange(cohort.getId(),
                StakeholderEffort.Role.BUDDY_MENTOR, weekStart, weekEnd);

        updateWeeklySummaryWithTotals(cohort, weekStart, submittedByName, submittedByAvatar, totalHours,
                BigDecimal.valueOf(techHours != null ? techHours : 0),
                BigDecimal.valueOf(bhHours != null ? bhHours : 0),
                BigDecimal.valueOf(mentorHours != null ? mentorHours : 0),
                BigDecimal.valueOf(buddyHours != null ? buddyHours : 0),
                null); // Default null if called from individual updates
    }

    private void updateWeeklySummaryWithTotals(Cohort cohort, LocalDate weekStart, String submittedByName,
            String submittedByAvatar,
            BigDecimal totalHours, BigDecimal techHours, BigDecimal bhHours, BigDecimal mentorHours,
            BigDecimal buddyHours, List<LocalDate> holidays) {
        LocalDate weekEnd = weekStart.plusDays(6);

        // Find or create weekly summary
        Optional<WeeklySummary> existingSummary = weeklySummaryRepository
                .findByCohortIdAndWeekStartDate(cohort.getId(), weekStart);

        WeeklySummary summary;
        if (existingSummary.isPresent()) {
            summary = existingSummary.get();
            summary.setTotalHours(totalHours);
            summary.setSummaryDate(LocalDateTime.now());
        } else {
            summary = new WeeklySummary(cohort, weekStart, weekEnd, totalHours);
            summary.setCreatedAt(LocalDateTime.now());
            summary.setSummaryDate(LocalDateTime.now());
        }

        // Set individual hours
        summary.setTechnicalTrainerHours(techHours);
        summary.setBehavioralTrainerHours(bhHours);
        summary.setMentorHours(mentorHours);
        summary.setBuddyMentorHours(buddyHours);

        // Set holidays if provided
        if (holidays != null) {
            String holidaysStr = holidays.stream()
                    .map(LocalDate::toString)
                    .collect(Collectors.joining(","));
            summary.setHolidays(holidaysStr);
        }

        // Set submission metadata
        summary.setSubmittedBy(submittedByName);
        summary.setSubmittedByAvatar(submittedByAvatar);
        summary.setSubmittedAt(LocalDateTime.now());

        WeeklySummary savedSummary = weeklySummaryRepository.save(summary);

        // Email Notification on Fridays
        if (LocalDate.now().getDayOfWeek().name().equals("FRIDAY")) {
            emailService.sendWeeklySummaryNotification(savedSummary);
        }
    }

    public List<WeeklySummary> getWeeklySummariesByCohort(Long cohortId) {
        List<WeeklySummary> summaries = weeklySummaryRepository.findByCohortId(cohortId);

        if (summaries.isEmpty()) {
            return summaries;
        }

        // Optimization: Fetch all users once if we need to enrich many summaries
        List<User> allUsers = userRepository.findAll();

        // Enrich with current avatars if missing
        for (WeeklySummary summary : summaries) {
            if (summary.getSubmittedByAvatar() == null && summary.getSubmittedBy() != null) {
                String submittedName = summary.getSubmittedBy().trim();

                allUsers.stream()
                        .filter(u -> u.getName() != null && u.getName().trim().equalsIgnoreCase(submittedName))
                        .findFirst()
                        .ifPresent(u -> summary.setSubmittedByAvatar(u.getAvatar()));
            }
        }
        return summaries;
    }

    public Optional<WeeklySummary> getWeeklySummary(Long cohortId, LocalDate weekStartDate) {
        return weeklySummaryRepository.findByCohortIdAndWeekStartDate(cohortId, weekStartDate);
    }

    public void submitWeeklyEffort(WeeklyEffortSubmissionDTO dto, Long userId) {
        // Validate submission window
        validateSubmissionWindow(dto.getWeekStartDate());

        Cohort cohort = cohortRepository.findById(dto.getCohortId())
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        User submittedBy = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Clear existing efforts for this week to allow clean overwrite
        List<StakeholderEffort> existing = effortRepository.findByCohortIdAndEffortDateBetween(
                cohort.getId(), dto.getWeekStartDate(), dto.getWeekEndDate());
        effortRepository.deleteAll(existing);

        if (dto.getDayLogs() != null) {
            for (DayLogDTO dayLog : dto.getDayLogs()) {
                if (dayLog.isHoliday())
                    continue;

                // Cumulative Validation: Sum of all roles for this day should not exceed 9
                // hours
                BigDecimal dayTotal = BigDecimal.ZERO;
                if (dayLog.getTechnicalTrainer() != null && dayLog.getTechnicalTrainer().getHours() != null)
                    dayTotal = dayTotal.add(dayLog.getTechnicalTrainer().getHours());
                if (dayLog.getMentor() != null && dayLog.getMentor().getHours() != null)
                    dayTotal = dayTotal.add(dayLog.getMentor().getHours());
                if (dayLog.getBuddyMentor() != null && dayLog.getBuddyMentor().getHours() != null)
                    dayTotal = dayTotal.add(dayLog.getBuddyMentor().getHours());
                if (dayLog.getBehavioralTrainer() != null && dayLog.getBehavioralTrainer().getHours() != null)
                    dayTotal = dayTotal.add(dayLog.getBehavioralTrainer().getHours());

                if (dayTotal.compareTo(BigDecimal.valueOf(9)) > 0) {
                    throw new RuntimeException("Total cumulative effort hours for " + dayLog.getDate()
                            + " cannot exceed 9 hours (Found: " + dayTotal + "h)");
                }

                // Trainer Log
                if (dayLog.getTechnicalTrainer() != null && dayLog.getTechnicalTrainer().getHours() != null
                        && dayLog.getTechnicalTrainer().getHours().compareTo(BigDecimal.ZERO) > 0) {
                    saveDayEffort(cohort, resolveUserForRole(cohort, StakeholderEffort.Role.TRAINER),
                            StakeholderEffort.Role.TRAINER,
                            dayLog.getDate(), dayLog.getTechnicalTrainer(), submittedBy);
                }

                // Mentor Log
                if (dayLog.getMentor() != null && dayLog.getMentor().getHours() != null
                        && dayLog.getMentor().getHours().compareTo(BigDecimal.ZERO) > 0) {
                    saveDayEffort(cohort, resolveUserForRole(cohort, StakeholderEffort.Role.MENTOR),
                            StakeholderEffort.Role.MENTOR,
                            dayLog.getDate(), dayLog.getMentor(), submittedBy);
                }

                // Buddy Mentor Log
                if (dayLog.getBuddyMentor() != null && dayLog.getBuddyMentor().getHours() != null
                        && dayLog.getBuddyMentor().getHours().compareTo(BigDecimal.ZERO) > 0) {
                    saveDayEffort(cohort, resolveUserForRole(cohort, StakeholderEffort.Role.BUDDY_MENTOR),
                            StakeholderEffort.Role.BUDDY_MENTOR,
                            dayLog.getDate(), dayLog.getBuddyMentor(), submittedBy);
                }

                // Behavioral Trainer Log
                if (dayLog.getBehavioralTrainer() != null && dayLog.getBehavioralTrainer().getHours() != null
                        && dayLog.getBehavioralTrainer().getHours().compareTo(BigDecimal.ZERO) > 0) {
                    saveDayEffort(cohort, resolveUserForRole(cohort, StakeholderEffort.Role.BH_TRAINER),
                            StakeholderEffort.Role.BH_TRAINER,
                            dayLog.getDate(), dayLog.getBehavioralTrainer(), submittedBy);
                }
            }
        }

        // Calculate totals from DTO for immediate update
        BigDecimal totalH = BigDecimal.ZERO;
        BigDecimal techH = BigDecimal.ZERO;
        BigDecimal bhH = BigDecimal.ZERO;
        BigDecimal mentorH = BigDecimal.ZERO;
        BigDecimal buddyH = BigDecimal.ZERO;

        if (dto.getDayLogs() != null) {
            for (DayLogDTO log : dto.getDayLogs()) {
                if (log.isHoliday())
                    continue;
                if (log.getTechnicalTrainer() != null && log.getTechnicalTrainer().getHours() != null)
                    techH = techH.add(log.getTechnicalTrainer().getHours());
                if (log.getBehavioralTrainer() != null && log.getBehavioralTrainer().getHours() != null)
                    bhH = bhH.add(log.getBehavioralTrainer().getHours());
                if (log.getMentor() != null && log.getMentor().getHours() != null)
                    mentorH = mentorH.add(log.getMentor().getHours());
                if (log.getBuddyMentor() != null && log.getBuddyMentor().getHours() != null)
                    buddyH = buddyH.add(log.getBuddyMentor().getHours());
            }
        }
        totalH = techH.add(bhH).add(mentorH).add(buddyH);

        updateWeeklySummaryWithTotals(cohort, dto.getWeekStartDate(), submittedBy.getName(),
                submittedBy.getAvatar(), totalH, techH, bhH,
                mentorH, buddyH, dto.getHolidays());

        // Send In-App notification to Admins for weekly summary
        notificationService.notifyRole(
                "ADMIN",
                "REPORT_SUBMITTED",
                "Weekly Operations Summary",
                String.format("Weekly brief submitted for %s: %.1fh cumulative engagement.",
                        cohort.getCode(),
                        totalH),
                "/cohorts/" + cohort.getId() + "?tab=efforts",
                userId);
    }

    private void saveDayEffort(Cohort cohort, User stakeholder, StakeholderEffort.Role role,
            LocalDate date, EffortDetailDTO detail, User submittedBy) {
        // Work Policy: Max 9 hours (10 hours total including 1 hour break)
        if (detail.getHours() != null && detail.getHours().compareTo(BigDecimal.valueOf(9)) > 0) {
            throw new RuntimeException("Daily effort hours for " + role + " cannot exceed 9 hours.");
        }

        StakeholderEffort effort = new StakeholderEffort();
        effort.setCohort(cohort);
        // Force the trainer_mentor_id to be the actual trainer/mentor for the selected
        // role
        // even if the frontend sends the Coach's ID.
        User actualStakeholder = stakeholder;

        // If the provided stakeholder is NULL or is identifying as the Coach (empId:
        // coach2001)
        // when it SHOULD be a Trainer/Mentor role, we force resolve from Cohort
        // defaults.
        if (actualStakeholder == null || "coach2001".equals(actualStakeholder.getEmpId())) {
            actualStakeholder = switch (role) {
                case TRAINER -> cohort.getPrimaryTrainer();
                case MENTOR -> cohort.getPrimaryMentor();
                case BUDDY_MENTOR -> cohort.getBuddyMentor();
                case BH_TRAINER -> cohort.getBehavioralTrainer();
            };
        }

        effort.setTrainerMentor(actualStakeholder);
        effort.setRole(role);

        // Handle Mode (Virtual/In-Person)
        if (detail.getMode() != null && detail.getMode().equalsIgnoreCase("VIRTUAL")) {
            effort.setMode(StakeholderEffort.Mode.VIRTUAL);
            effort.setReasonVirtual(detail.getReasonVirtual());
        } else {
            effort.setMode(StakeholderEffort.Mode.IN_PERSON);
            effort.setReasonVirtual(null);
        }

        effort.setAreaOfWork(
                detail.getNotes() != null && !detail.getNotes().isEmpty() ? detail.getNotes() : "Daily effort logging");
        effort.setEffortHours(detail.getHours());
        effort.setEffortDate(date);
        effort.setEffortMonth(date.getMonth().toString());
        effort.setUpdatedBy(submittedBy);
        effort.setUpdatedDate(LocalDateTime.now());
        effort.setCreatedAt(LocalDateTime.now());

        effortRepository.save(effort);
    }

    private User resolveUserForRole(Cohort cohort, StakeholderEffort.Role role) {
        // Try mapping tables first (Synchronous with what the UI shows)
        if (role == StakeholderEffort.Role.TRAINER || role == StakeholderEffort.Role.BH_TRAINER) {
            List<CohortTrainerMapping> mappings = trainerMappingRepository.findByCohortId(cohort.getId());
            CohortTrainerMapping.Role targetRole = (role == StakeholderEffort.Role.TRAINER)
                    ? CohortTrainerMapping.Role.TRAINER
                    : CohortTrainerMapping.Role.BH_TRAINER;

            return mappings.stream()
                    .filter(m -> m.getRole() == targetRole)
                    .findFirst()
                    .map(m -> userRepository.findByEmpId(m.getTrainer().getEmpId()).orElseGet(() -> {
                        // Fallback to cohort defaults if no User record exists for mapping
                        return (role == StakeholderEffort.Role.TRAINER) ? cohort.getPrimaryTrainer()
                                : cohort.getBehavioralTrainer();
                    }))
                    .orElse((role == StakeholderEffort.Role.TRAINER) ? cohort.getPrimaryTrainer()
                            : cohort.getBehavioralTrainer());
        }

        if (role == StakeholderEffort.Role.MENTOR || role == StakeholderEffort.Role.BUDDY_MENTOR) {
            List<CohortMentorMapping> mappings = mentorMappingRepository.findByCohortId(cohort.getId());
            CohortMentorMapping.Role targetRole = (role == StakeholderEffort.Role.MENTOR)
                    ? CohortMentorMapping.Role.MENTOR
                    : CohortMentorMapping.Role.BUDDY_MENTOR;

            return mappings.stream()
                    .filter(m -> m.getRole() == targetRole)
                    .findFirst()
                    .map(m -> userRepository.findByEmpId(m.getMentor().getEmpId()).orElseGet(() -> {
                        return (role == StakeholderEffort.Role.MENTOR) ? cohort.getPrimaryMentor()
                                : cohort.getBuddyMentor();
                    }))
                    .orElse((role == StakeholderEffort.Role.MENTOR) ? cohort.getPrimaryMentor()
                            : cohort.getBuddyMentor());
        }

        return null;
    }

    private void validateSubmissionWindow(LocalDate activityDate) {
        LocalDate today = LocalDate.now();
        LocalDate currentWeekStart = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate previousWeekStart = currentWeekStart.minusWeeks(1);
        LocalDate activityWeekStart = activityDate.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));

        if (!activityWeekStart.equals(currentWeekStart) && !activityWeekStart.equals(previousWeekStart)) {
            throw new RuntimeException(
                    "Submission denied: You can only submit reports for the current or previous week.");
        }
    }
}