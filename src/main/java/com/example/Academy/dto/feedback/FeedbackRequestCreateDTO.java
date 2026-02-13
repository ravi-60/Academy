package com.example.Academy.dto.feedback;

import lombok.Data;

@Data
public class FeedbackRequestCreateDTO {
    private Long cohortId;
    private Integer weekNumber;
    private Integer expiryDays;
}
