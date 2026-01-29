package com.example.Academy.controller;

import com.example.Academy.dto.report.ReportResponseDTO;
import com.example.Academy.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping
    public ReportResponseDTO getReportData() {
        return reportService.getReportData();
    }
}
