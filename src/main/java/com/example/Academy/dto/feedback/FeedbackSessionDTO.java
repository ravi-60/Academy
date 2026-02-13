package com.example.Academy.dto.feedback;

import com.example.Academy.entity.FeedbackRequest;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class FeedbackSessionDTO {
    private FeedbackRequest request;
    private BigDecimal trainerHours;
    private BigDecimal mentorHours;
    private BigDecimal coachHours; // We might use behavioral trainer hours here if coach is not tracked
    private BigDecimal totalHours;

    // Stakeholder Names for Display
    private String trainerName;
    private String mentorName;
    private String coachName;
    private String buddyName;
    private String behavioralName;
}
