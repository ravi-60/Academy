package com.example.Academy.dto.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityDTO {
    private Long id;
    private Long cohortId;
    private String cohortCode;
    private String title;
    private String description;
    private LocalDate weekStartDate;
    private LocalDate weekEndDate;
    private BigDecimal totalHours;
    private String submittedBy;
}
