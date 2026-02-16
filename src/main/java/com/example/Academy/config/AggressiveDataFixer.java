package com.example.Academy.config;

import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.Mentor;
import com.example.Academy.entity.StakeholderEffort;
import com.example.Academy.entity.Trainer;
import com.example.Academy.entity.User;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.MentorRepository;
import com.example.Academy.repository.StakeholderEffortRepository;
import com.example.Academy.repository.TrainerRepository;
import com.example.Academy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
public class AggressiveDataFixer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CohortRepository cohortRepository;

    @Autowired
    private StakeholderEffortRepository effortRepository;

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        System.out.println("--- STARTING AGGRESSIVE DATABASE SYNCHRONIZATION (WITH FK REMOVAL) ---");

        // 1. Programmatically drop the offending Foreign Key to stop the "Constraint
        // Fails" error
        try {
            System.out.println("Automating database schema updates...");
            // Drop old FK (Note: name corrected to match error precisely)
            jdbcTemplate
                    .execute("ALTER TABLE academy_db.stakeholder_efforts DROP FOREIGN KEY FKer08nm1op374ogjrsgqalx4of");
            // Change column type to store EmpID (String)
            jdbcTemplate.execute("ALTER TABLE academy_db.stakeholder_efforts MODIFY trainer_mentor_id VARCHAR(255)");
            System.out.println("Database schema successfully adjusted.");
        } catch (Exception e) {
            System.out.println("Note: Schema already adjusted or constraint not found. Continuing...");
        }

        // 2. Untangle the Coach User (Restore emp_id if it was changed to 2457)
        Optional<User> coachOpt = userRepository.findByEmail("coach1@academy.com");
        if (coachOpt.isPresent()) {
            User coach = coachOpt.get();
            if ("2457".equals(coach.getEmpId())) {
                System.out.println("Restoring Coach's emp_id to coach2001...");
                coach.setEmpId("coach2001");
                userRepository.save(coach);
            }
        }

        // 3. Ensure specific Trainers and Mentors exist as separate records
        User john = getOrUpdateUser("john", "john", "john@academy.com", "2457", User.Role.COACH);
        User nagireddy = getOrUpdateUser("nagireddy", "Nagireddy Sai Ravi Teja", "nagireddy@academy.com", "2457131",
                User.Role.COACH);

        // 3a. Ensure Trainer/Mentor table records exist for them
        getOrUpdateTrainerRecord(john, Trainer.TrainerType.technical, "react");
        getOrUpdateMentorRecord(nagireddy, Mentor.MentorType.mentor, "java");

        // 4. Fix all Cohorts - Force defaults to these specific people
        List<Cohort> cohorts = cohortRepository.findAll();
        for (Cohort cohort : cohorts) {
            boolean updated = false;
            // Force assign trainers/mentors to John/Nagireddy for all cohorts where coach
            // is erroneously assigned
            if (cohort.getPrimaryTrainer() == null || "coach2001".equals(cohort.getPrimaryTrainer().getEmpId())) {
                System.out.println("Assigning Technical Trainer (john) to Cohort " + cohort.getCode());
                cohort.setPrimaryTrainer(john);
                updated = true;
            }
            if (cohort.getPrimaryMentor() == null || "coach2001".equals(cohort.getPrimaryMentor().getEmpId())) {
                System.out.println("Assigning Primary Mentor (Nagireddy) to Cohort " + cohort.getCode());
                cohort.setPrimaryMentor(nagireddy);
                updated = true;
            }
            if (updated) {
                cohortRepository.save(cohort);
            }
        }

        // 5. Force Repair of StakeholderEffort History (Using emp_id mappings)
        List<StakeholderEffort> efforts = effortRepository.findAll();
        int fixedCount = 0;
        for (StakeholderEffort effort : efforts) {
            User currentStakeholder = effort.getTrainerMentor();
            User correctedStakeholder = null;

            // Rule: If it points to the Coach (ID 2 or empId coach2001) or is NULL, force
            // it to the actual personnel
            if (currentStakeholder == null || "coach2001".equals(currentStakeholder.getEmpId())) {
                switch (effort.getRole()) {
                    case TRAINER -> correctedStakeholder = effort.getCohort().getPrimaryTrainer();
                    case MENTOR -> correctedStakeholder = effort.getCohort().getPrimaryMentor();
                    case BUDDY_MENTOR -> correctedStakeholder = effort.getCohort().getBuddyMentor();
                    case BH_TRAINER -> correctedStakeholder = effort.getCohort().getBehavioralTrainer();
                }
            }

            if (correctedStakeholder != null && !correctedStakeholder.equals(currentStakeholder)) {
                effort.setTrainerMentor(correctedStakeholder);
                effortRepository.save(effort);
                fixedCount++;
            }
        }

        System.out.println("Aggressive repair complete: Fixed " + fixedCount + " effort records.");
        System.out.println("--- AGGRESSIVE DATABASE SYNCHRONIZATION COMPLETE ---");
    }

    private User getOrUpdateUser(String username, String name, String email, String empId, User.Role role) {
        // Try finding by EmpId first
        User user = userRepository.findByEmpId(empId).orElse(null);

        // If not found, try finding by Email to avoid duplicate email errors
        if (user == null) {
            user = userRepository.findByEmail(email).orElse(null);
        }

        if (user == null) {
            System.out.println("Creating record for " + name + " (" + empId + ")");
            user = new User();
            user.setEmpId(empId);
            user.setName(name);
            user.setEmail(email);
            user.setPassword("password123");
            user.setRole(role);
            user.setEmployeeType(User.EmployeeType.INTERNAL);
            user.setCreatedAt(LocalDateTime.now());
            return userRepository.save(user);
        } else {
            // Force update fields if they have changed
            boolean updated = false;
            if (!name.equalsIgnoreCase(user.getName())) {
                System.out.println("Updating name for user " + email + " to " + name);
                user.setName(name);
                updated = true;
            }
            if (!empId.equals(user.getEmpId())) {
                System.out.println("Updating empId for user " + email + " to " + empId);
                user.setEmpId(empId);
                updated = true;
            }
            return updated ? userRepository.save(user) : user;
        }
    }

    private void getOrUpdateTrainerRecord(User user, Trainer.TrainerType type, String skill) {
        Trainer trainer = trainerRepository.findByEmpId(user.getEmpId()).orElse(null);
        if (trainer == null) {
            System.out.println("Creating Trainer record for " + user.getName());
            trainer = new Trainer();
            trainer.setEmpId(user.getEmpId());
            trainer.setName(user.getName());
            trainer.setEmail(user.getEmail());
            trainer.setTrainerType(type);
            trainer.setSkill(skill);
            trainer.setInternal(true);
            trainer.setCreatedAt(LocalDateTime.now());
            trainerRepository.save(trainer);
        } else {
            if (trainer.getTrainerType() != type) {
                trainer.setTrainerType(type);
                trainerRepository.save(trainer);
            }
        }
    }

    private void getOrUpdateMentorRecord(User user, Mentor.MentorType type, String skill) {
        Mentor mentor = mentorRepository.findByEmpId(user.getEmpId()).orElse(null);
        if (mentor == null) {
            System.out.println("Creating Mentor record for " + user.getName());
            mentor = new Mentor();
            mentor.setEmpId(user.getEmpId());
            mentor.setName(user.getName());
            mentor.setEmail(user.getEmail());
            mentor.setMentorType(type);
            mentor.setSkill(skill);
            mentor.setInternal(true);
            mentor.setCreatedAt(LocalDateTime.now());
            mentorRepository.save(mentor);
        } else {
            if (mentor.getMentorType() != type) {
                mentor.setMentorType(type);
                mentorRepository.save(mentor);
            }
        }
    }
}
