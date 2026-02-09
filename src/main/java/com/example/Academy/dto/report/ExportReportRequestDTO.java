package com.example.Academy.dto.report;

import java.time.LocalDate;
import lombok.Data;

@Data
public class ExportReportRequestDTO {
    private Long cohortId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String format; // "PDF" or "EXCEL"
}
