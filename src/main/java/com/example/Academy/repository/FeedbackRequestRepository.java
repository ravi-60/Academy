package com.example.Academy.repository;

import com.example.Academy.entity.FeedbackRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface FeedbackRequestRepository extends JpaRepository<FeedbackRequest, Long> {
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "cohort", "cohort.primaryTrainer",
            "cohort.primaryMentor", "cohort.coach" })
    Optional<FeedbackRequest> findByToken(String token);

    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = { "cohort" })
    List<FeedbackRequest> findByCohortId(Long cohortId);
}
