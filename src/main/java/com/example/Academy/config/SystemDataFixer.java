package com.example.Academy.config;

import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.StakeholderEffort;
import com.example.Academy.entity.User;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.StakeholderEffortRepository;
import com.example.Academy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
public class SystemDataFixer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CohortRepository cohortRepository;

    @Autowired
    private StakeholderEffortRepository effortRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("--- STARTING SYSTEM DATA SYNCHRONIZATION ---");

        // 1. Ensure Trainer '2457' exists (The user's target trainer)
        String trainerEmpId = "2457";
        Optional<User> trainerOpt = userRepository.findByEmpId(trainerEmpId);
        User targetTrainer;

        if (trainerOpt.isEmpty()) {
            System.out.println("Creating missing user for Trainer 2457...");
            targetTrainer = new User();
            targetTrainer.setEmpId(trainerEmpId);
            targetTrainer.setName("Trainer 2457");
            targetTrainer.setEmail("trainer2457@academy.com");
            targetTrainer.setPassword("default123");
            targetTrainer.setRole(User.Role.COACH); // Coaches/Trainers use the COACH role in system
            targetTrainer.setEmployeeType(User.EmployeeType.INTERNAL);
            targetTrainer = userRepository.save(targetTrainer);
        } else {
            targetTrainer = trainerOpt.get();
        }

        // 2. Fix Cohort assignments (Assign target trainer as primary where missing)
        List<Cohort> allCohorts = cohortRepository.findAll();
        for (Cohort cohort : allCohorts) {
            if (cohort.getPrimaryTrainer() == null) {
                System.out.println("Assigning Trainer 2457 as Primary Trainer for Cohort: " + cohort.getCode());
                cohort.setPrimaryTrainer(targetTrainer);
                cohortRepository.save(cohort);
            }
        }

        // 3. Fix existing Effort records (Replace Coach IDs with actual Trainer IDs)
        List<StakeholderEffort> efforts = effortRepository.findAll();
        int totalUpdated = 0;

        for (StakeholderEffort effort : efforts) {
            User currentStakeholder = effort.getTrainerMentor();
            User resolvedStakeholder = null;

            // If the record currently points to a COACH (likely the submitter)
            // or is NULL, we force it to the actual trainer/mentor from the cohort.
            if (currentStakeholder == null || currentStakeholder.getRole() == User.Role.COACH) {
                switch (effort.getRole()) {
                    case TRAINER -> resolvedStakeholder = effort.getCohort().getPrimaryTrainer();
                    case MENTOR -> resolvedStakeholder = effort.getCohort().getPrimaryMentor();
                    case BUDDY_MENTOR -> resolvedStakeholder = effort.getCohort().getBuddyMentor();
                    case BH_TRAINER -> resolvedStakeholder = effort.getCohort().getBehavioralTrainer();
                }
            }

            // If we found a better trainer/mentor than what's stored, update it.
            if (resolvedStakeholder != null &&
                    (currentStakeholder == null || !currentStakeholder.getId().equals(resolvedStakeholder.getId()))) {
                effort.setTrainerMentor(resolvedStakeholder);
                effortRepository.save(effort);
                totalUpdated++;
            }
        }

        System.out.println("Synchronized " + totalUpdated + " effort records across all cohorts.");
        System.out.println("--- SYSTEM DATA SYNCHRONIZATION COMPLETE ---");
    }
}
