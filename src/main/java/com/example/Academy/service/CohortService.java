package com.example.Academy.service;

import com.example.Academy.dto.cohort.CreateCohortRequest;
import com.example.Academy.entity.*;
import com.example.Academy.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.Academy.dto.cohort.CohortResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CohortService {

    @Autowired
    private CohortRepository cohortRepository;

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private BuddyMentorRepository buddyMentorRepository;

    @Autowired
    private CohortTrainerMappingRepository cohortTrainerMappingRepository;

    @Autowired
    private CohortMentorMappingRepository cohortMentorMappingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ActivityRepository activityRepository;

    @Autowired
    private NotificationService notificationService;

    public Cohort createCohort(CreateCohortRequest request) {

        Cohort cohort = new Cohort();

        if (cohortRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Cohort with code " + request.getCode() + " already exists");
        }
        cohort.setCode(request.getCode());
        cohort.setBu(request.getBu());
        cohort.setSkill(request.getSkill());
        cohort.setTrainingLocation(request.getTrainingLocation());
        cohort.setStartDate(
                request.getStartDate() != null && !request.getStartDate().isEmpty()
                        ? LocalDate.parse(request.getStartDate())
                        : null);
        cohort.setEndDate(
                request.getEndDate() != null && !request.getEndDate().isEmpty()
                        ? LocalDate.parse(request.getEndDate())
                        : null);
        cohort.setActiveGencCount(
                request.getActiveGencCount() != null
                        ? request.getActiveGencCount()
                        : 0);

        // SET COACH
        if (request.getCoachId() != null) {
            User coach = userRepository.findById(request.getCoachId())
                    .orElseThrow(() -> new RuntimeException("Coach not found"));
            cohort.setCoach(coach);
        }

        // SET PRIMARY TRAINER
        if (request.getPrimaryTrainerId() != null) {
            User trainer = userRepository.findById(request.getPrimaryTrainerId())
                    .orElseThrow(() -> new RuntimeException("Trainer not found"));
            cohort.setPrimaryTrainer(trainer);
        }

        Cohort savedCohort = cohortRepository.save(cohort);

        // LOG ACTIVITY: Coach Assigned
        if (savedCohort.getCoach() != null) {
            Activity activity = new Activity();
            activity.setTitle("Mission Assignment");
            activity.setDescription(
                    "Coach " + savedCohort.getCoach().getName() + " has been assigned to " + savedCohort.getCode());
            activity.setDate(java.time.LocalDateTime.now());
            activity.setCoach(savedCohort.getCoach());
            activity.setCohort(savedCohort);
            activityRepository.save(activity);

            // Send Realtime Notification
            try {
                Notification notification = new Notification(
                        savedCohort.getCoach().getId(),
                        "COACH",
                        "COHORT_ASSIGNMENT",
                        "New Cohort Assigned",
                        "You have been assigned to cohort " + savedCohort.getCode(),
                        "/cohorts/" + savedCohort.getId() // or code if routing uses code
                );
                notificationService.createNotification(notification);
            } catch (Exception e) {
                System.err.println("Failed to send coach assignment notification: " + e.getMessage());
            }
        }

        return savedCohort;
    }

    public List<Cohort> getAllCohorts() {
        return cohortRepository.findAll();
    }

    public List<Cohort> getCohortsForUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("DEBUG: User found: " + user.getEmail() + ", Role: " + user.getRole());

        if (user.getRole() == User.Role.ADMIN) {
            System.out.println("DEBUG: User is ADMIN. Returning all cohorts.");
            return cohortRepository.findAll();
        } else {
            List<Cohort> assigned = cohortRepository.findByCoach(user);
            System.out
                    .println("DEBUG: User is " + user.getRole() + ". Found " + assigned.size() + " assigned cohorts.");
            return assigned;
        }
    }

    public Optional<Cohort> getCohortById(Long id) {
        return cohortRepository.findById(id);
    }

    public Optional<Cohort> getCohortByCode(String code) {
        return cohortRepository.findByCode(code);
    }

    public Cohort updateCohort(Long id, Cohort cohortDetails) {
        Cohort cohort = cohortRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        cohort.setCode(cohortDetails.getCode());
        cohort.setBu(cohortDetails.getBu());
        cohort.setSkill(cohortDetails.getSkill());
        cohort.setActiveGencCount(cohortDetails.getActiveGencCount());
        cohort.setTrainingLocation(cohortDetails.getTrainingLocation());
        cohort.setStartDate(cohortDetails.getStartDate());
        cohort.setEndDate(cohortDetails.getEndDate());

        return cohortRepository.save(cohort);
    }

    public void deleteCohort(Long id) {
        cohortRepository.deleteById(id);
    }

    public CohortResponse mapToResponse(Cohort c) {
        CohortResponse dto = new CohortResponse();

        dto.setId(c.getId());
        dto.setCode(c.getCode());
        dto.setBu(c.getBu());
        dto.setSkill(c.getSkill());
        dto.setActiveGencCount(c.getActiveGencCount());
        dto.setTotalGencCount(c.getTotalGencCount());
        dto.setTrainingLocation(c.getTrainingLocation());
        dto.setStartDate(c.getStartDate());
        dto.setEndDate(c.getEndDate());

        dto.setProgress(
                calculateProgress(c.getStartDate(), c.getEndDate()));

        if (c.getCoach() != null) {
            dto.setCoach(
                    new CohortResponse.UserSummary(
                            c.getCoach().getId(),
                            c.getCoach().getName()));
        }

        return dto;
    }

    private int calculateProgress(LocalDate start, LocalDate end) {
        if (start == null || end == null)
            return 0;

        LocalDate today = LocalDate.now();

        if (today.isBefore(start))
            return 0;
        if (today.isAfter(end))
            return 100;

        long totalDays = java.time.temporal.ChronoUnit.DAYS.between(start, end);
        long elapsedDays = java.time.temporal.ChronoUnit.DAYS.between(start, today);

        return (int) ((elapsedDays * 100) / totalDays);
    }

    // Trainer management
    public void assignPrimaryTrainer(Long cohortId, Long trainerId) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));
        User trainer = userRepository.findById(trainerId)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        cohort.setPrimaryTrainer(trainer);
        cohortRepository.save(cohort);
    }

    public void addAdditionalTrainer(Long cohortId, Long trainerId, CohortTrainerMapping.Role role) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));
        Trainer trainer = trainerRepository.findById(trainerId)
                .orElseThrow(() -> new RuntimeException("Trainer not found"));

        if (cohortTrainerMappingRepository.existsByCohortIdAndTrainerId(cohortId, trainerId)) {
            throw new RuntimeException("Trainer already assigned to this cohort");
        }

        CohortTrainerMapping mapping = new CohortTrainerMapping(cohort, trainer, role);
        cohortTrainerMappingRepository.save(mapping);
    }

    public void removeAdditionalTrainer(Long cohortId, Long trainerId) {
        cohortTrainerMappingRepository.deleteByCohortIdAndTrainerId(cohortId, trainerId);
    }

    public List<CohortTrainerMapping> getAdditionalTrainers(Long cohortId) {
        return cohortTrainerMappingRepository.findByCohortId(cohortId);
    }

    // Mentor management
    public void assignPrimaryMentor(Long cohortId, Long mentorId) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));
        User mentor = userRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        cohort.setPrimaryMentor(mentor);
        cohortRepository.save(cohort);
    }

    public void assignBuddyMentor(Long cohortId, Long buddyMentorId) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));
        User buddyMentor = userRepository.findById(buddyMentorId)
                .orElseThrow(() -> new RuntimeException("Buddy Mentor not found"));

        cohort.setBuddyMentor(buddyMentor);
        cohortRepository.save(cohort);
    }

    public void addAdditionalMentor(Long cohortId, Long mentorId, CohortMentorMapping.Role role) {
        Cohort cohort = cohortRepository.findById(cohortId)
                .orElseThrow(() -> new RuntimeException("Cohort not found"));
        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new RuntimeException("Mentor not found"));

        if (cohortMentorMappingRepository.existsByCohortIdAndMentorId(cohortId, mentorId)) {
            throw new RuntimeException("Mentor already assigned to this cohort");
        }

        CohortMentorMapping mapping = new CohortMentorMapping(cohort, mentor, role);
        cohortMentorMappingRepository.save(mapping);
    }

    public void removeAdditionalMentor(Long cohortId, Long mentorId) {
        cohortMentorMappingRepository.deleteByCohortIdAndMentorId(cohortId, mentorId);
    }

    public List<CohortMentorMapping> getAdditionalMentors(Long cohortId) {
        return cohortMentorMappingRepository.findByCohortId(cohortId);
    }

    @Autowired
    private CandidateRepository candidateRepository;

    // Fix for data synchronization
    @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
    public void recalculateAcceptedCounts() {
        System.out.println("DEBUG: Recalculating candidate counts...");
        List<Cohort> cohorts = cohortRepository.findAll();
        for (Cohort cohort : cohorts) {
            long activeCount = candidateRepository.countByCohortIdAndStatus(cohort.getId(), Candidate.Status.ACTIVE);
            long totalCount = candidateRepository.countByCohortIdAndStatusIn(cohort.getId(),
                    java.util.Arrays.asList(Candidate.Status.ACTIVE, Candidate.Status.COMPLETED));

            boolean changed = false;
            if (cohort.getActiveGencCount() != activeCount) {
                System.out.println("Correcting active count for " + cohort.getCode() + ": "
                        + cohort.getActiveGencCount() + " -> " + activeCount);
                cohort.setActiveGencCount((int) activeCount);
                changed = true;
            }
            if (cohort.getTotalGencCount() == null || cohort.getTotalGencCount() != totalCount) {
                System.out.println("Correcting total count for " + cohort.getCode() + ": " + cohort.getTotalGencCount()
                        + " -> " + totalCount);
                cohort.setTotalGencCount((int) totalCount);
                changed = true;
            }

            if (changed) {
                cohortRepository.save(cohort);
            }
        }
    }
}
