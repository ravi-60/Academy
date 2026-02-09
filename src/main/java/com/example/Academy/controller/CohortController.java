package com.example.Academy.controller;

import com.example.Academy.dto.cohort.CohortResponse;
import com.example.Academy.dto.cohort.CreateCohortRequest;
import com.example.Academy.entity.Cohort;
import com.example.Academy.entity.CohortTrainerMapping;
import com.example.Academy.entity.CohortMentorMapping;
import com.example.Academy.service.CohortService;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/cohorts")
@CrossOrigin(origins = "*")
public class CohortController {

    @Autowired
    private CohortService cohortService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Cohort> createCohort(
            @Valid @RequestBody CreateCohortRequest request) {
        return ResponseEntity.ok(
                cohortService.createCohort(request));
    }

    @PostMapping("/bulk")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<Cohort>> createCohorts(
            @Valid @RequestBody List<CreateCohortRequest> requests) {
        return ResponseEntity.ok(
                cohortService.createCohorts(requests));
    }

    @GetMapping
    public ResponseEntity<List<CohortResponse>> getAllCohorts(@RequestParam(required = false) String email) {
        List<Cohort> cohorts;

        if (email != null && !email.isEmpty()) {
            System.out.println("DEBUG: getAllCohorts called with email: " + email);
            try {
                cohorts = cohortService.getCohortsForUser(email);
                System.out.println("DEBUG: getCohortsForUser returned " + cohorts.size() + " cohorts.");
            } catch (Exception e) {
                System.err.println("DEBUG: Error fetching cohorts for user: " + e.getMessage());
                // If user not found, fallback to all or empty? Let's return empty to be safe
                // OR fallback to all if we assume earlier behavior.
                // Given the requirement "only assigned data must be shown", erroring or empty
                // is safer than showing all.
                // But specifically for robustness, if email is invalid, maybe return empty.
                return ResponseEntity.badRequest().build();
            }
        } else {
            System.out.println("DEBUG: getAllCohorts called WITHOUT email. Returning empty list for safety.");
            // previously returned all cohorts, which leaked data. Now default to empty.
            cohorts = List.of();
        }

        return ResponseEntity.ok(
                cohorts.stream()
                        .map(cohortService::mapToResponse)
                        .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cohort> getCohortById(@PathVariable Long id) {
        Optional<Cohort> cohort = cohortService.getCohortById(id);
        return cohort.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<Cohort> getCohortByCode(@PathVariable String code) {
        Optional<Cohort> cohort = cohortService.getCohortByCode(code);
        return cohort.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Cohort> updateCohort(@PathVariable Long id, @RequestBody CreateCohortRequest request) {
        Cohort updatedCohort = cohortService.updateCohort(id, request);
        return ResponseEntity.ok(updatedCohort);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteCohort(@PathVariable Long id) {
        cohortService.deleteCohort(id);
        return ResponseEntity.noContent().build();
    }

    // Trainer management endpoints
    @PostMapping("/{cohortId}/trainers/primary/{trainerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignPrimaryTrainer(@PathVariable Long cohortId, @PathVariable Long trainerId) {
        cohortService.assignPrimaryTrainer(cohortId, trainerId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{cohortId}/trainers/additional")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> addAdditionalTrainer(@PathVariable Long cohortId,
            @RequestParam Long trainerId,
            @RequestParam CohortTrainerMapping.Role role) {
        cohortService.addAdditionalTrainer(cohortId, trainerId, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{cohortId}/trainers/additional/{trainerId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeAdditionalTrainer(@PathVariable Long cohortId, @PathVariable Long trainerId) {
        cohortService.removeAdditionalTrainer(cohortId, trainerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cohortId}/trainers/additional")
    public ResponseEntity<List<CohortTrainerMapping>> getAdditionalTrainers(@PathVariable Long cohortId) {
        List<CohortTrainerMapping> trainers = cohortService.getAdditionalTrainers(cohortId);
        return ResponseEntity.ok(trainers);
    }

    // Mentor management endpoints
    @PostMapping("/{cohortId}/mentors/primary/{mentorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignPrimaryMentor(@PathVariable Long cohortId, @PathVariable Long mentorId) {
        cohortService.assignPrimaryMentor(cohortId, mentorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{cohortId}/mentors/buddy/{buddyMentorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> assignBuddyMentor(@PathVariable Long cohortId, @PathVariable Long buddyMentorId) {
        cohortService.assignBuddyMentor(cohortId, buddyMentorId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{cohortId}/mentors/additional")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> addAdditionalMentor(@PathVariable Long cohortId,
            @RequestParam Long mentorId,
            @RequestParam CohortMentorMapping.Role role) {
        cohortService.addAdditionalMentor(cohortId, mentorId, role);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{cohortId}/mentors/additional/{mentorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeAdditionalMentor(@PathVariable Long cohortId, @PathVariable Long mentorId) {
        cohortService.removeAdditionalMentor(cohortId, mentorId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{cohortId}/mentors/additional")
    public ResponseEntity<List<CohortMentorMapping>> getAdditionalMentors(@PathVariable Long cohortId) {
        List<CohortMentorMapping> mentors = cohortService.getAdditionalMentors(cohortId);
        return ResponseEntity.ok(mentors);
    }
}
