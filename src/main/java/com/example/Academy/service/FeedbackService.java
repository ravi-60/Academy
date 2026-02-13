package com.example.Academy.service;

import com.example.Academy.dto.feedback.FeedbackRequestCreateDTO;
import com.example.Academy.dto.feedback.FeedbackSubmissionDTO;
import com.example.Academy.dto.feedback.FeedbackSessionDTO;
import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.Feedback;
import com.example.Academy.entity.FeedbackRequest;
import com.example.Academy.entity.CohortTrainerMapping;
import com.example.Academy.entity.CohortMentorMapping;
import com.example.Academy.entity.WeeklySummary;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.FeedbackRepository;
import com.example.Academy.repository.FeedbackRequestRepository;
import com.example.Academy.repository.WeeklySummaryRepository;
import com.example.Academy.repository.CohortTrainerMappingRepository;
import com.example.Academy.repository.CohortMentorMappingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final FeedbackRequestRepository requestRepository;
    private final CohortRepository cohortRepository;
    private final WeeklySummaryRepository weeklySummaryRepository;
    private final CohortTrainerMappingRepository trainerMappingRepository;
    private final CohortMentorMappingRepository mentorMappingRepository;

    @Transactional
    public FeedbackRequest createFeedbackRequest(FeedbackRequestCreateDTO dto) {
        Cohort cohort = cohortRepository.findById(dto.getCohortId())
                .orElseThrow(() -> new RuntimeException("Cohort not found"));

        FeedbackRequest request = new FeedbackRequest();
        request.setCohort(cohort);
        request.setWeekNumber(dto.getWeekNumber());
        if (dto.getExpiryDays() != null) {
            request.setExpiresAt(LocalDateTime.now().plusDays(dto.getExpiryDays()));
        }

        return requestRepository.save(request);
    }

    public List<FeedbackRequest> getCohortRequests(Long cohortId) {
        return requestRepository.findByCohortId(cohortId);
    }

    @Transactional
    public void deactivateFeedbackRequest(Long requestId) {
        FeedbackRequest request = requestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Request not found"));
        request.setActive(false);
        requestRepository.save(request);
    }

    @Transactional
    public Feedback submitFeedback(FeedbackSubmissionDTO dto) {
        FeedbackRequest request = requestRepository.findByToken(dto.getToken())
                .orElseThrow(() -> new RuntimeException("Invalid feedback token"));

        if (!request.getActive()) {
            throw new RuntimeException("This feedback link has been deactivated");
        }

        if (request.getExpiresAt() != null && request.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("This feedback link has expired");
        }

        if (feedbackRepository.existsByFeedbackRequestIdAndEmployeeId(request.getId(), dto.getEmployeeId())) {
            throw new RuntimeException("Feedback already submitted for this Employee ID");
        }

        Feedback feedback = new Feedback();
        feedback.setCohort(request.getCohort());
        feedback.setFeedbackRequest(request);
        feedback.setWeekNumber(request.getWeekNumber());

        // --- Technical Trainer ---
        feedback.setIsTechnicalSessionHeld(dto.getIsTechnicalSessionHeld());
        feedback.setCourseContentRating(dto.getCourseContentRating());
        feedback.setTechnicalKnowledgeRating(dto.getTechnicalKnowledgeRating());
        feedback.setTrainerEngagementRating(dto.getTrainerEngagementRating());
        feedback.setConceptsScheduleRating(dto.getConceptsScheduleRating());
        feedback.setUdemyRecapRating(dto.getUdemyRecapRating());
        feedback.setAdditionalScenarioRating(dto.getAdditionalScenarioRating());
        feedback.setTechnicalLowScoreExplanation(dto.getTechnicalLowScoreExplanation());

        // --- Mentor ---
        feedback.setIsMentorSessionHeld(dto.getIsMentorSessionHeld());
        feedback.setMentorGuidanceRating(dto.getMentorGuidanceRating());
        feedback.setMentorLowScoreExplanation(dto.getMentorLowScoreExplanation());

        // --- Coach ---
        feedback.setCoachEffectivenessRating(dto.getCoachEffectivenessRating());
        feedback.setCoachLowScoreExplanation(dto.getCoachLowScoreExplanation());

        // --- Buddy Mentor ---
        feedback.setDidBuddyMentorConnect(dto.getDidBuddyMentorConnect());
        feedback.setWereDoubtsClarified(dto.getWereDoubtsClarified());
        feedback.setBuddyMentorGuidanceRating(dto.getBuddyMentorGuidanceRating());
        feedback.setBuddyMentorSuggestions(dto.getBuddyMentorSuggestions());

        // --- Behavioral Trainer ---
        feedback.setIsBehavioralSessionHeld(dto.getIsBehavioralSessionHeld());
        feedback.setBehavioralDeliveryRating(dto.getBehavioralDeliveryRating());
        feedback.setBehavioralLowScoreExplanation(dto.getBehavioralLowScoreExplanation());

        // --- Summary ---
        feedback.setOverallSatisfaction(dto.getOverallSatisfaction());
        feedback.setCandidateName(dto.getCandidateName());
        feedback.setEmployeeId(dto.getEmployeeId());

        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getFeedbackForCohort(Long cohortId) {
        return feedbackRepository.findByCohortId(cohortId);
    }

    public FeedbackSessionDTO getRequestByToken(String token) {
        FeedbackRequest request = requestRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Feedback session not found"));

        FeedbackSessionDTO sessionDto = new FeedbackSessionDTO();
        sessionDto.setRequest(request);

        // Fetch effort info for the specific week
        List<WeeklySummary> summaries = weeklySummaryRepository.findByCohortId(request.getCohort().getId());
        // Sort by start date to find the n-th week
        summaries.sort(Comparator.comparing(WeeklySummary::getWeekStartDate));

        if (request.getWeekNumber() > 0 && request.getWeekNumber() <= summaries.size()) {
            WeeklySummary weeklySummary = summaries.get(request.getWeekNumber() - 1);
            sessionDto.setTrainerHours(weeklySummary.getTechnicalTrainerHours());
            sessionDto.setMentorHours(weeklySummary.getMentorHours());
            // Map behavioral trainer to coach hours as a fallback for visibility
            sessionDto.setCoachHours(weeklySummary.getBehavioralTrainerHours());
            sessionDto.setTotalHours(weeklySummary.getTotalHours());
        } else {
            // Fallback: set to zero or null
            sessionDto.setTrainerHours(BigDecimal.ZERO);
            sessionDto.setMentorHours(BigDecimal.ZERO);
            sessionDto.setCoachHours(BigDecimal.ZERO);
            sessionDto.setTotalHours(BigDecimal.ZERO);
        }

        // Fetch Stakeholder Names from Mapping Tables (Real-time lookup)
        Long cohortId = request.getCohort().getId();
        List<CohortTrainerMapping> trainerMappings = trainerMappingRepository.findByCohortId(cohortId);
        List<CohortMentorMapping> mentorMappings = mentorMappingRepository.findByCohortId(cohortId);

        // Technical Trainer
        trainerMappings.stream()
                .filter(m -> m.getRole() == CohortTrainerMapping.Role.TRAINER)
                .findFirst()
                .ifPresent(m -> sessionDto.setTrainerName(m.getTrainer().getName()));

        // Behavioral Trainer
        trainerMappings.stream()
                .filter(m -> m.getRole() == CohortTrainerMapping.Role.BH_TRAINER)
                .findFirst()
                .ifPresent(m -> sessionDto.setBehavioralName(m.getTrainer().getName()));

        // Mentor
        mentorMappings.stream()
                .filter(m -> m.getRole() == CohortMentorMapping.Role.MENTOR)
                .findFirst()
                .ifPresent(m -> sessionDto.setMentorName(m.getMentor().getName()));

        // Buddy Mentor
        mentorMappings.stream()
                .filter(m -> m.getRole() == CohortMentorMapping.Role.BUDDY_MENTOR)
                .findFirst()
                .ifPresent(m -> sessionDto.setBuddyName(m.getMentor().getName()));

        // Coach (from Cohort entity)
        if (request.getCohort().getCoach() != null) {
            sessionDto.setCoachName(request.getCohort().getCoach().getName());
        }

        return sessionDto;
    }

    public Map<String, Object> getCohortAnalytics(Long cohortId) {
        List<Feedback> feedbackList = feedbackRepository.findByCohortId(cohortId);

        double avgTrainer = feedbackList.stream().filter(f -> f.getCourseContentRating() != null)
                .mapToDouble(Feedback::getTechnicalAggregatedScore)
                .average().orElse(0.0);
        double avgMentor = feedbackList.stream().filter(f -> f.getMentorGuidanceRating() != null)
                .mapToInt(Feedback::getMentorGuidanceRating)
                .average().orElse(0.0);
        double avgCoach = feedbackList.stream().filter(f -> f.getCoachEffectivenessRating() != null)
                .mapToInt(Feedback::getCoachEffectivenessRating)
                .average().orElse(0.0);
        double avgOverall = feedbackList.stream()
                .mapToInt(f -> f.getOverallSatisfaction() != null ? f.getOverallSatisfaction() : 0).average()
                .orElse(0.0);

        return Map.of(
                "totalResponses", feedbackList.size(),
                "averages", Map.of(
                        "trainer", avgTrainer,
                        "mentor", avgMentor,
                        "coach", avgCoach,
                        "overall", avgOverall),
                "responses", feedbackList);
    }
}
