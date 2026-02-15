package com.example.Academy.controller;

import com.example.Academy.entity.*;
import com.example.Academy.repository.*;
import com.example.Academy.service.EmailService;
import com.example.Academy.service.ExecutiveReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/email")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EmailDispatchController {

    private final EmailService emailService;
    private final FeedbackRequestRepository feedbackRequestRepository;
    private final CandidateRepository candidateRepository;
    private final CohortRepository cohortRepository;
    private final CohortTrainerMappingRepository trainerMappingRepository;
    private final CohortMentorMappingRepository mentorMappingRepository;
    private final FeedbackRepository feedbackRepository;
    private final ExecutiveReportService executiveReportService;

    @PostMapping("/feedback/{requestId}")
    public ResponseEntity<String> sendFeedbackLink(@PathVariable Long requestId) {
        try {
            FeedbackRequest request = feedbackRequestRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Feedback Request not found"));

            Cohort cohort = request.getCohort();
            List<Candidate> candidates = candidateRepository.findByCohortIdAndStatus(cohort.getId(),
                    Candidate.Status.ACTIVE);

            String feedbackUrl = "http://localhost:8081/feedback/" + request.getToken();
            int successCount = 0;

            for (Candidate candidate : candidates) {
                if (candidate.getEmail() != null && !candidate.getEmail().isEmpty()) {
                    String subject = "Week " + request.getWeekNumber() + " Feedback Request - " + cohort.getCode();
                    String body = String.format(
                            """
                                    <html>
                                        <body>
                                            <h2>Hi %s,</h2>
                                            <p>Please submit your Week %d feedback for <strong>%s</strong>.</p>
                                            <p>Click the link below to start:</p>
                                            <a href="%s" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Submit Feedback</a>
                                            <p>Or copy this link: %s</p>
                                            <br/>
                                            <p>Thank you,<br/>Academy Team</p>
                                        </body>
                                    </html>
                                    """,
                            candidate.getName(), request.getWeekNumber(), cohort.getCode(), feedbackUrl, feedbackUrl);

                    emailService.sendHtmlEmail(candidate.getEmail(), subject, body);
                    successCount++;
                }
            }
            return ResponseEntity.ok("Sent feedback links to " + successCount + " candidates.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error sending emails: " + e.getMessage());
        }
    }

    @PostMapping("/report/{cohortId}")
    public ResponseEntity<String> sendWeeklyReport(
            @PathVariable Long cohortId,
            @RequestParam Integer weekNumber) {
        try {
            Cohort cohort = cohortRepository.findById(cohortId)
                    .orElseThrow(() -> new RuntimeException("Cohort not found"));

            // Calculate dates based on Week Number
            LocalDate startDate = cohort.getStartDate().plusWeeks(weekNumber - 1);
            LocalDate endDate = startDate.plusDays(6);

            // Generate Comprehensive Feedback Report (6 separate files)
            List<Feedback> feedbackList = feedbackRepository.findByCohortIdAndWeekNumber(cohortId, weekNumber);
            java.util.Map<String, byte[]> attachments = com.example.Academy.util.ComprehensiveFeedbackReportGenerator
                    .generate(feedbackList);

            // Add Executive Report (Efforts) as 7th file
            com.example.Academy.dto.report.ExecutiveReportData reportData = executiveReportService
                    .getReportData(cohortId, startDate, endDate);
            byte[] effortReportBytes = com.example.Academy.util.ExcelExecutiveReportGenerator.generate(reportData);
            attachments.put("Effort_Report_" + cohort.getCode() + "_Week" + weekNumber + ".xlsx", effortReportBytes);

            // Get Recipients (Coaches, Trainers, Mentors, Buddy Mentors)
            Set<String> recipientEmails = new HashSet<>();

            // Mapped Trainers/Mentors
            trainerMappingRepository.findByCohortId(cohortId)
                    .forEach(m -> recipientEmails.add(m.getTrainer().getEmail()));
            mentorMappingRepository.findByCohortId(cohortId)
                    .forEach(m -> recipientEmails.add(m.getMentor().getEmail()));

            // Primary/Buddy
            if (cohort.getPrimaryTrainer() != null)
                recipientEmails.add(cohort.getPrimaryTrainer().getEmail());
            if (cohort.getPrimaryMentor() != null)
                recipientEmails.add(cohort.getPrimaryMentor().getEmail());
            if (cohort.getBuddyMentor() != null)
                recipientEmails.add(cohort.getBuddyMentor().getEmail());
            if (cohort.getCoach() != null)
                recipientEmails.add(cohort.getCoach().getEmail());

            int successCount = 0;
            String subject = "Weekly Comprehensive Feedback Report - Week " + weekNumber + " - " + cohort.getCode();
            String body = "Please find attached the Comprehensive Feedback Report (7 files) including the Effort Report for Week "
                    + weekNumber
                    + " (" + startDate + " to "
                    + endDate + ").";

            for (String email : recipientEmails) {
                if (email != null && !email.isEmpty()) {
                    emailService.sendEmailWithAttachments(email, subject, body, attachments);
                    successCount++;
                }
            }

            return ResponseEntity
                    .ok("Sent Week " + weekNumber + " comprehensive report to " + successCount + " recipients.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error sending report: " + e.getMessage());
        }
    }
}
