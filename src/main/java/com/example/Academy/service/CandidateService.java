package com.example.Academy.service;

import com.example.Academy.entity.Candidate;
import com.example.Academy.repository.CandidateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CandidateService {

    @Autowired
    private CandidateRepository candidateRepository;

    @Autowired
    private com.example.Academy.repository.CohortRepository cohortRepository;

    @Autowired
    private com.example.Academy.repository.UserRepository userRepository;

    public List<Candidate> getAllCandidates() {
        return candidateRepository.findAll();
    }

    public List<Candidate> getCandidatesForUser(String email) {
        if (email == null || email.isEmpty()) {
            return List.of();
        }

        com.example.Academy.entity.User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == com.example.Academy.entity.User.Role.ADMIN) {
            return candidateRepository.findAllActive();
        } else {
            return candidateRepository.findActiveByCoachEmail(email);
        }
    }

    public List<Candidate> getCandidatesByCohortId(Long cohortId) {
        return candidateRepository.findByCohortIdAndStatus(cohortId, Candidate.Status.ACTIVE);
    }

    public Optional<Candidate> getCandidateById(Long id) {
        return candidateRepository.findById(id);
    }

    public Candidate createCandidate(Candidate candidate) {
        if (candidateRepository.existsByCandidateId(candidate.getCandidateId())) {
            throw new RuntimeException("Candidate ID already exists");
        }
        if (candidate.getEmail() != null && candidateRepository.existsByEmail(candidate.getEmail())) {
            throw new RuntimeException("Email already exists");
        }
        candidate.setCreatedAt(LocalDateTime.now());
        candidate.setUpdatedAt(LocalDateTime.now());

        Candidate savedCandidate = candidateRepository.save(candidate);

        if (savedCandidate.getCohort() != null) {
            com.example.Academy.entity.Cohort cohort = savedCandidate.getCohort();
            boolean changed = false;

            if (savedCandidate.getStatus() == Candidate.Status.ACTIVE) {
                cohort.setActiveGencCount(cohort.getActiveGencCount() + 1);
                changed = true;
            }
            if (savedCandidate.getStatus() == Candidate.Status.ACTIVE
                    || savedCandidate.getStatus() == Candidate.Status.COMPLETED) {
                cohort.setTotalGencCount(cohort.getTotalGencCount() + 1);
                changed = true;
            }

            if (changed) {
                cohortRepository.save(cohort);
            }
        }

        return savedCandidate;
    }

    public List<Candidate> createCandidates(List<Candidate> candidates) {
        List<Candidate> newCandidates = new java.util.ArrayList<>();

        for (Candidate candidate : candidates) {
            boolean exists = false;

            if (candidateRepository.existsByCandidateId(candidate.getCandidateId())) {
                System.out.println("Skipping duplicate candidate ID: " + candidate.getCandidateId());
                exists = true;
            }
            if (!exists && candidate.getEmail() != null && candidateRepository.existsByEmail(candidate.getEmail())) {
                System.out.println("Skipping duplicate candidate Email: " + candidate.getEmail());
                exists = true;
            }

            if (!exists) {
                candidate.setCreatedAt(LocalDateTime.now());
                candidate.setUpdatedAt(LocalDateTime.now());
                newCandidates.add(candidate);
            }
        }

        if (newCandidates.isEmpty()) {
            return newCandidates;
        }

        List<Candidate> savedCandidates = candidateRepository.saveAll(newCandidates);

        // Group by cohort and update counts
        for (Candidate c : savedCandidates) {
            if (c.getCohort() != null) {
                com.example.Academy.entity.Cohort cohort = cohortRepository.findById(c.getCohort().getId())
                        .orElse(null);
                if (cohort != null) {
                    boolean changed = false;
                    if (c.getStatus() == Candidate.Status.ACTIVE) {
                        cohort.setActiveGencCount(cohort.getActiveGencCount() + 1);
                        changed = true;
                    }
                    if (c.getStatus() == Candidate.Status.ACTIVE || c.getStatus() == Candidate.Status.COMPLETED) {
                        cohort.setTotalGencCount(cohort.getTotalGencCount() + 1);
                        changed = true;
                    }
                    if (changed) {
                        cohortRepository.save(cohort);
                    }
                }
            }
        }

        return savedCandidates;
    }

    public Candidate updateCandidate(Long id, Candidate candidateDetails) {
        Optional<Candidate> optionalCandidate = candidateRepository.findById(id);
        if (optionalCandidate.isPresent()) {
            Candidate candidate = optionalCandidate.get();
            Candidate.Status oldStatus = candidate.getStatus();

            candidate.setName(candidateDetails.getName());
            candidate.setEmail(candidateDetails.getEmail());

            // Only update cohort if provided, otherwise keep existing
            if (candidateDetails.getCohort() != null) {
                // Handle cohort change logic if needed (decrement old, increment new) - Out of
                // scope for simple edit
                // For now, assuming direct edit doesn't change cohort often, but if it does:
                if (!candidate.getCohort().getId().equals(candidateDetails.getCohort().getId())) {
                    // Decrement old
                    if (oldStatus == Candidate.Status.ACTIVE) {
                        com.example.Academy.entity.Cohort oldCohort = candidate.getCohort();
                        oldCohort.setActiveGencCount(Math.max(0, oldCohort.getActiveGencCount() - 1));
                        cohortRepository.save(oldCohort);
                    }
                    // Increment new (handled below by check)
                    candidate.setCohort(candidateDetails.getCohort());
                }
            }

            candidate.setStatus(candidateDetails.getStatus());
            candidate.setJoinDate(candidateDetails.getJoinDate());
            candidate.setEndDate(candidateDetails.getEndDate());
            candidate.setUpdatedAt(LocalDateTime.now());

            Candidate savedCandidate = candidateRepository.save(candidate);

            // Update cohort counts if status changed
            if (oldStatus != candidateDetails.getStatus()) {
                com.example.Academy.entity.Cohort cohort = savedCandidate.getCohort();
                if (cohort != null) {
                    boolean changed = false;
                    // Active Count
                    if (candidateDetails.getStatus() == Candidate.Status.ACTIVE) {
                        cohort.setActiveGencCount(cohort.getActiveGencCount() + 1);
                        changed = true;
                    } else if (oldStatus == Candidate.Status.ACTIVE) {
                        cohort.setActiveGencCount(Math.max(0, cohort.getActiveGencCount() - 1));
                        changed = true;
                    }

                    // Total Count (Active/Completed)
                    boolean oldWasTotal = (oldStatus == Candidate.Status.ACTIVE
                            || oldStatus == Candidate.Status.COMPLETED);
                    boolean newIsTotal = (candidateDetails.getStatus() == Candidate.Status.ACTIVE
                            || candidateDetails.getStatus() == Candidate.Status.COMPLETED);

                    if (oldWasTotal != newIsTotal) {
                        if (newIsTotal) {
                            cohort.setTotalGencCount(cohort.getTotalGencCount() + 1);
                            changed = true;
                        } else {
                            cohort.setTotalGencCount(Math.max(0, cohort.getTotalGencCount() - 1));
                            changed = true;
                        }
                    }

                    if (changed) {
                        cohortRepository.save(cohort);
                    }
                }
            }

            return savedCandidate;
        }
        return null;
    }

    public void deleteCandidate(Long id) {
        Optional<Candidate> candidate = candidateRepository.findById(id);
        if (candidate.isPresent()) {
            Candidate c = candidate.get();
            if (c.getCohort() != null) {
                com.example.Academy.entity.Cohort cohort = c.getCohort();
                boolean changed = false;
                if (c.getStatus() == Candidate.Status.ACTIVE) {
                    cohort.setActiveGencCount(Math.max(0, cohort.getActiveGencCount() - 1));
                    changed = true;
                }
                if (c.getStatus() == Candidate.Status.ACTIVE || c.getStatus() == Candidate.Status.COMPLETED) {
                    cohort.setTotalGencCount(Math.max(0, cohort.getTotalGencCount() - 1));
                    changed = true;
                }
                if (changed)
                    cohortRepository.save(cohort);
            }
            // Soft delete: set status to INACTIVE instead of deleting
            c.setStatus(Candidate.Status.INACTIVE);
            c.setUpdatedAt(LocalDateTime.now());
            candidateRepository.save(c);
        }
    }
}