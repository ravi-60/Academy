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
        // Deactivated: Real data is now being used and this fixer interferes with user
        // assignments.
        // System.out.println("--- AGGRESSIVE DATABASE SYNCHRONIZATION SKIPPED ---");
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
