package com.example.Academy.dto.feedback;

import lombok.Data;

@Data
public class FeedbackSubmissionDTO {
    private String token;
    private String candidateName;
    private String employeeId;

    // Technical Trainer
    private Boolean isTechnicalSessionHeld;
    private Integer courseContentRating;
    private Integer technicalKnowledgeRating;
    private Integer trainerEngagementRating;
    private Integer conceptsScheduleRating;
    private Integer udemyRecapRating;
    private Integer additionalScenarioRating;
    private String technicalLowScoreExplanation;

    // Mentor
    private Boolean isMentorSessionHeld;
    private Integer mentorGuidanceRating;
    private String mentorLowScoreExplanation;

    // Coach
    private Integer coachEffectivenessRating;
    private String coachLowScoreExplanation;

    // Buddy Mentor
    private Boolean didBuddyMentorConnect;
    private Boolean wereDoubtsClarified;
    private Integer buddyMentorGuidanceRating;
    private String buddyMentorSuggestions;

    // Behavioral Trainer
    private Boolean isBehavioralSessionHeld;
    private Integer behavioralDeliveryRating;
    private String behavioralLowScoreExplanation;

    // Summary
    private Integer overallSatisfaction;
}
