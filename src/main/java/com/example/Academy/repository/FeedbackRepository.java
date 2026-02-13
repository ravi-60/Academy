package com.example.Academy.repository;

import com.example.Academy.entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByCohortId(Long cohortId);

    List<Feedback> findByCohortIdAndWeekNumber(Long cohortId, Integer weekNumber);

    boolean existsByFeedbackRequestIdAndEmployeeId(Long requestId, String employeeId);
}
