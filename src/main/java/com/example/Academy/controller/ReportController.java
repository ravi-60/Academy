package com.example.Academy.controller;

import com.example.Academy.dto.report.ReportResponseDTO;
import com.example.Academy.service.ReportService;
import com.example.Academy.service.ExecutiveReportService;
import com.lowagie.text.DocumentException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private ExecutiveReportService executiveReportService;

    @GetMapping
    public ReportResponseDTO getReportData(@RequestParam(required = false) Long cohortId) {
        return reportService.getReportData(cohortId);
    }

    @GetMapping("/recent-activities")
    public ResponseEntity<?> getRecentActivities(@RequestParam(required = false) Long coachId) {
        return ResponseEntity.ok(reportService.getRecentActivities(coachId));
    }

    @GetMapping("/submission-count")
    public ResponseEntity<Long> getSubmissionCount() {
        return ResponseEntity.ok(reportService.getWeeklySubmissionCount());
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam Long cohortId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam String format) throws IOException, DocumentException {

        byte[] reportContent = executiveReportService.generateReport(cohortId, startDate, endDate, format);

        String extension = format.equalsIgnoreCase("EXCEL") ? "xlsx" : format.toLowerCase();
        String filename = "Cohort_Report_" + cohortId + "." + extension;

        MediaType mediaType = format.equalsIgnoreCase("PDF") ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(reportContent);
    }

    @GetMapping("/global-export")
    public ResponseEntity<byte[]> globalExportReport(
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate)
            throws IOException {

        byte[] reportContent;
        String filename;

        if (startDate != null && endDate != null) {
            reportContent = executiveReportService.generateGlobalReportByRange(startDate, endDate);
            filename = String.format("Global_Effort_Report_%s_to_%s.xlsx", startDate, endDate);
        } else if (month != null && year != null) {
            reportContent = executiveReportService.generateGlobalReport(month, year);
            filename = String.format("Global_Effort_Report_%d_%02d.xlsx", year, month);
        } else {
            throw new IllegalArgumentException("Must provide either (month and year) or (startDate and endDate)");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(reportContent);
    }
}
