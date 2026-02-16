package com.example.Academy.service;

import com.example.Academy.entity.Trainer;
import com.example.Academy.entity.CohortTrainerMapping;
import com.example.Academy.repository.TrainerRepository;
import com.example.Academy.repository.CohortTrainerMappingRepository;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.UserRepository;
import com.example.Academy.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TrainerService {

    @Autowired
    private TrainerRepository trainerRepository;

    @Autowired
    private CohortTrainerMappingRepository mappingRepository;

    @Autowired
    private CohortRepository cohortRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Trainer> getAllTrainers() {
        return trainerRepository.findAll();
    }

    public List<Trainer> getTrainersByCohortId(Long cohortId) {
        List<CohortTrainerMapping> mappings = mappingRepository.findByCohortId(cohortId);
        return mappings.stream()
                .map(CohortTrainerMapping::getTrainer)
                .collect(Collectors.toList());
    }

    public Optional<Trainer> getTrainerById(Long id) {
        return trainerRepository.findById(id);
    }

    @org.springframework.transaction.annotation.Transactional
    public Trainer createTrainer(Trainer trainer, Long cohortId) {
        if (trainerRepository.existsByEmail(trainer.getEmail())) {
            throw new RuntimeException("Trainer with email " + trainer.getEmail() + " already exists");
        }
        if (trainerRepository.existsByEmpId(trainer.getEmpId())) {
            throw new RuntimeException("Trainer with Employee ID " + trainer.getEmpId() + " already exists");
        }
        trainer.setCreatedAt(LocalDateTime.now());
        trainer.setUpdatedAt(LocalDateTime.now());
        Trainer savedTrainer = trainerRepository.save(trainer);

        if (cohortId != null) {
            assignTrainerToCohort(savedTrainer.getId(), cohortId);
        }

        return savedTrainer;
    }

    @org.springframework.transaction.annotation.Transactional
    public void assignTrainerToCohort(Long trainerId, Long cohortId) {
        trainerRepository.findById(trainerId).ifPresent(trainer -> {
            cohortRepository.findById(cohortId).ifPresent(cohort -> {
                // Determine target role
                CohortTrainerMapping.Role role = (trainer.getTrainerType() == Trainer.TrainerType.behavioral)
                        ? CohortTrainerMapping.Role.BH_TRAINER
                        : CohortTrainerMapping.Role.TRAINER;

                // 1. Remove ANY existing mapping for this cohort and role (Enforce single
                // assignment)
                mappingRepository.deleteByCohortIdAndRole(cohortId, role);

                // 2. Add new mapping
                CohortTrainerMapping mapping = new CohortTrainerMapping();
                mapping.setCohort(cohort);
                mapping.setTrainer(trainer);
                mapping.setRole(role);
                mapping.setCreatedAt(LocalDateTime.now());
                mappingRepository.save(mapping);

                // 3. Synchronize with Cohort entity (Update primary fields used as fallbacks)
                // We lookup if there is a User record for this trainer's empId
                Optional<User> userOpt = userRepository.findByEmpId(trainer.getEmpId());
                if (role == CohortTrainerMapping.Role.TRAINER) {
                    cohort.setPrimaryTrainer(userOpt.orElse(null));
                } else if (role == CohortTrainerMapping.Role.BH_TRAINER) {
                    cohort.setBehavioralTrainer(userOpt.orElse(null));
                }
                cohortRepository.save(cohort);
            });
        });
    }

    public Trainer updateTrainer(Long id, Trainer trainer) {
        return trainerRepository.findById(id).map(existing -> {
            existing.setEmpId(trainer.getEmpId());
            existing.setName(trainer.getName());
            existing.setEmail(trainer.getEmail());
            existing.setPhone(trainer.getPhone());
            existing.setTrainerType(trainer.getTrainerType());
            existing.setSkill(trainer.getSkill());
            existing.setInternal(trainer.isInternal());
            existing.setTrainingStartDate(trainer.getTrainingStartDate());
            existing.setTrainingEndDate(trainer.getTrainingEndDate());
            existing.setAvatarUrl(trainer.getAvatarUrl());
            existing.setUpdatedAt(LocalDateTime.now());
            // status is preserved
            return trainerRepository.save(existing);
        }).orElse(null);
    }

    @org.springframework.transaction.annotation.Transactional
    public void unassignTrainerFromCohort(Long trainerId, Long cohortId) {
        mappingRepository.deleteByCohortIdAndTrainerId(cohortId, trainerId);
    }

    public void deleteTrainer(Long id) {
        trainerRepository.findById(id).ifPresent(trainer -> {
            trainer.setStatus("INACTIVE");
            trainer.setUpdatedAt(LocalDateTime.now());
            trainerRepository.save(trainer);
        });
    }

    public void reactivateTrainer(Long id) {
        trainerRepository.findById(id).ifPresent(trainer -> {
            trainer.setStatus("ACTIVE");
            trainer.setUpdatedAt(LocalDateTime.now());
            trainerRepository.save(trainer);
        });
    }
}