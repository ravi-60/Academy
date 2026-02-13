package com.example.Academy.controller;

import com.example.Academy.dto.feedback.FeedbackRequestCreateDTO;
import com.example.Academy.dto.feedback.FeedbackSubmissionDTO;
import com.example.Academy.dto.feedback.FeedbackSessionDTO;
import com.example.Academy.entity.Feedback;
import com.example.Academy.entity.FeedbackRequest;
import com.example.Academy.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FeedbackController {

    private final FeedbackService feedbackService;

    // Admin Endpoints
    @PostMapping("/request")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COACH')")
    public ResponseEntity<FeedbackRequest> createFeedbackRequest(@RequestBody FeedbackRequestCreateDTO dto) {
        return ResponseEntity.ok(feedbackService.createFeedbackRequest(dto));
    }

    @GetMapping("/cohort/{cohortId}/requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH', 'LOCATION_LEAD')")
    public ResponseEntity<List<FeedbackRequest>> getCohortRequests(@PathVariable Long cohortId) {
        return ResponseEntity.ok(feedbackService.getCohortRequests(cohortId));
    }

    @GetMapping("/cohort/{cohortId}/analytics")
    @PreAuthorize("hasAnyRole('ADMIN', 'COACH', 'LOCATION_LEAD')")
    public ResponseEntity<Map<String, Object>> getCohortAnalytics(@PathVariable Long cohortId) {
        return ResponseEntity.ok(feedbackService.getCohortAnalytics(cohortId));
    }

    // Public Endpoints (Unauthenticated)
    @GetMapping("/public/session/{token}")
    public ResponseEntity<FeedbackSessionDTO> getRequestByToken(@PathVariable String token) {
        return ResponseEntity.ok(feedbackService.getRequestByToken(token));
    }

    @PostMapping("/public/submit")
    public ResponseEntity<Feedback> submitFeedback(@RequestBody FeedbackSubmissionDTO dto) {
        return ResponseEntity.ok(feedbackService.submitFeedback(dto));
    }
}
