package com.example.Academy.repository;

import com.example.Academy.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, Long> {
    List<Candidate> findByCohortId(Long cohortId);

    List<Candidate> findByCohortIdAndStatus(Long cohortId, Candidate.Status status);

    boolean existsByCandidateId(String candidateId);

    boolean existsByEmail(String email);

    long countByCohortIdAndStatus(Long cohortId, Candidate.Status status);

    long countByCohortIdAndStatusIn(Long cohortId, List<Candidate.Status> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE' AND c.cohort.coach.email = :email")
    List<Candidate> findActiveByCoachEmail(String email);

    @org.springframework.data.jpa.repository.Query("SELECT c FROM Candidate c WHERE c.status = 'ACTIVE'")
    List<Candidate> findAllActive();
}