package com.example.Academy.dto.feedback;

import com.example.Academy.entity.Feedback;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class FeedbackAnalyticsResponseDTO {
    private Long id;
    private Integer weekNumber;
    private String token; // The key addition
    private LocalDateTime createdAt;
    private String candidateName;
    private String employeeId;
    private Integer overallSatisfaction;

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

    public FeedbackAnalyticsResponseDTO(Feedback feedback) {
        this.id = feedback.getId();
        this.weekNumber = feedback.getWeekNumber();
        this.createdAt = feedback.getCreatedAt();
        this.candidateName = feedback.getCandidateName();
        this.employeeId = feedback.getEmployeeId();
        this.overallSatisfaction = feedback.getOverallSatisfaction();

        // Populate token from relationship
        if (feedback.getFeedbackRequest() != null) {
            this.token = feedback.getFeedbackRequest().getToken();
        }

        // Technical
        this.isTechnicalSessionHeld = feedback.getIsTechnicalSessionHeld();
        this.courseContentRating = feedback.getCourseContentRating();
        this.technicalKnowledgeRating = feedback.getTechnicalKnowledgeRating();
        this.trainerEngagementRating = feedback.getTrainerEngagementRating();
        this.conceptsScheduleRating = feedback.getConceptsScheduleRating();
        this.udemyRecapRating = feedback.getUdemyRecapRating();
        this.additionalScenarioRating = feedback.getAdditionalScenarioRating();
        this.technicalLowScoreExplanation = feedback.getTechnicalLowScoreExplanation();

        // Mentor
        this.isMentorSessionHeld = feedback.getIsMentorSessionHeld();
        this.mentorGuidanceRating = feedback.getMentorGuidanceRating();
        this.mentorLowScoreExplanation = feedback.getMentorLowScoreExplanation();

        // Coach
        this.coachEffectivenessRating = feedback.getCoachEffectivenessRating();
        this.coachLowScoreExplanation = feedback.getCoachLowScoreExplanation();

        // Buddy
        this.didBuddyMentorConnect = feedback.getDidBuddyMentorConnect();
        this.wereDoubtsClarified = feedback.getWereDoubtsClarified();
        this.buddyMentorGuidanceRating = feedback.getBuddyMentorGuidanceRating();
        this.buddyMentorSuggestions = feedback.getBuddyMentorSuggestions();

        // Behavioral
        this.isBehavioralSessionHeld = feedback.getIsBehavioralSessionHeld();
        this.behavioralDeliveryRating = feedback.getBehavioralDeliveryRating();
        this.behavioralLowScoreExplanation = feedback.getBehavioralLowScoreExplanation();
    }
}
