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

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReport(
            @RequestParam Long cohortId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam String format) throws IOException, DocumentException {

        byte[] reportContent = executiveReportService.generateReport(cohortId, startDate, endDate, format);

        String filename = "Cohort_Report_" + cohortId + "." + format.toLowerCase();
        MediaType mediaType = format.equalsIgnoreCase("PDF") ? MediaType.APPLICATION_PDF
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(mediaType)
                .body(reportContent);
    }
}
