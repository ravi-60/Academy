package com.example.Academy.dto.cohort;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateCohortRequest {
    @NotBlank
    private String code;

    @NotBlank
    private String bu;

    @NotBlank
    private String skill;

    @NotBlank
    private String trainingLocation;

    @NotBlank
    private String startDate;

    private String endDate;
    private Integer activeGencCount;

    // For Bulk Upload (CSV) where IDs are unknown
    private String coachEmail;
    private String primaryTrainerEmail;
    private String primaryMentorEmail;
    private String buddyMentorEmail;

    // THIS IS KEY
    private Long coachId;
    private Long primaryTrainerId;
    private Long primaryMentorId;
    private Long buddyMentorId;

}
