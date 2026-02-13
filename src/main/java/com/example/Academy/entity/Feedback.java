package com.example.Academy.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Getter
@Setter
@NoArgsConstructor
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cohort_id", nullable = false)
    private Cohort cohort;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id")
    private FeedbackRequest feedbackRequest;

    @Column(name = "week_number", nullable = false)
    private Integer weekNumber;

    // --- Technical Trainer Feedback ---
    @Column(name = "is_technical_session_held")
    private Boolean isTechnicalSessionHeld;

    @Column(name = "course_content_rating")
    private Integer courseContentRating;

    @Column(name = "tech_knowledge_rating")
    private Integer technicalKnowledgeRating;

    @Column(name = "trainer_engagement_rating")
    private Integer trainerEngagementRating;

    @Column(name = "concepts_schedule_rating")
    private Integer conceptsScheduleRating;

    @Column(name = "udemy_recap_rating")
    private Integer udemyRecapRating;

    @Column(name = "additional_scenario_rating")
    private Integer additionalScenarioRating;

    @Column(name = "tech_low_score_expl", columnDefinition = "TEXT")
    private String technicalLowScoreExplanation;

    // --- Mentor Feedback ---
    @Column(name = "is_mentor_session_held")
    private Boolean isMentorSessionHeld;

    @Column(name = "mentor_guidance_rating")
    private Integer mentorGuidanceRating;

    @Column(name = "mentor_low_score_expl", columnDefinition = "TEXT")
    private String mentorLowScoreExplanation;

    // --- Coach Feedback ---
    @Column(name = "coach_effectiveness_rating")
    private Integer coachEffectivenessRating;

    @Column(name = "coach_low_score_expl", columnDefinition = "TEXT")
    private String coachLowScoreExplanation;

    // --- Buddy Mentor Feedback ---
    @Column(name = "did_buddy_mentor_connect")
    private Boolean didBuddyMentorConnect;

    @Column(name = "were_doubts_clarified")
    private Boolean wereDoubtsClarified;

    @Column(name = "buddy_mentor_guidance_rating")
    private Integer buddyMentorGuidanceRating;

    @Column(name = "buddy_mentor_suggestions", columnDefinition = "TEXT")
    private String buddyMentorSuggestions;

    // --- Behavioral Trainer Feedback ---
    @Column(name = "is_behavioral_session_held")
    private Boolean isBehavioralSessionHeld;

    @Column(name = "behavioral_delivery_rating")
    private Integer behavioralDeliveryRating;

    @Column(name = "behavioral_low_score_expl", columnDefinition = "TEXT")
    private String behavioralLowScoreExplanation;

    // --- Final Legacy/Summary Fields ---
    @Column(name = "overall_satisfaction")
    private Integer overallSatisfaction;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "candidate_name")
    private String candidateName;

    @Column(name = "employee_id")
    private String employeeId;

    // Helper methods for calculations
    public Double getTechnicalAggregatedScore() {
        if (courseContentRating == null)
            return 0.0;
        return (courseContentRating + technicalKnowledgeRating + trainerEngagementRating +
                conceptsScheduleRating + udemyRecapRating + additionalScenarioRating) / 6.0;
    }
}
