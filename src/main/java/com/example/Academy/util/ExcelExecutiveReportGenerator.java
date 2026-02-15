package com.example.Academy.util;

import com.example.Academy.dto.report.ExecutiveReportData;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

public class ExcelExecutiveReportGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    public static byte[] generate(ExecutiveReportData data) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Governance Telemetry");

            // 1. STYLES
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.cloneStyleFrom(dataStyle);
            dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("dd-mmm-yyyy"));

            // 2. MAIN DATA TABLE (Row 0)
            int rowNum = 0;
            Row headerRow = sheet.createRow(rowNum++);
            headerRow.setHeightInPoints(30);
            String[] headers = {
                    "Cohort Code", "BU", "Skill", "Active GenC Count", "Training Location",
                    "Mapped Trainer Type (Internal/External)", "Internal SME /External SME/Mentor ID",
                    "Internal SME /External SME/Mentor Name",
                    "SME/Mentor/Buddy Mentor/MFRP Contributor", "Mode in which trainer connected (Virtual/In-Person)",
                    "Reason for virtual connect of the trainer", "Area of Work", "Effort in Hours",
                    "Date", "Month", "Updated By", "Updated Date"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 3. DATA ROWS
            if (data.getDetailedLogs() != null) {
                for (ExecutiveReportData.DetailedEffortLog log : data.getDetailedLogs()) {
                    Row row = sheet.createRow(rowNum++);
                    row.setHeightInPoints(22);

                    row.createCell(0).setCellValue(log.getCohortCode());
                    row.createCell(1).setCellValue(log.getBu());
                    row.createCell(2).setCellValue(log.getSkill());
                    row.createCell(3).setCellValue(log.getActiveGencCount() != null ? log.getActiveGencCount() : 0);
                    row.createCell(4)
                            .setCellValue(log.getTrainingLocation() != null ? log.getTrainingLocation() : "Remote");
                    row.createCell(5).setCellValue(log.getMapped());
                    row.createCell(6).setCellValue(log.getMentorId());
                    row.createCell(7).setCellValue(log.getMentorName());
                    row.createCell(8).setCellValue(log.getRole());
                    row.createCell(9).setCellValue(log.getMode());
                    row.createCell(10).setCellValue(log.getReasonVirtual());
                    row.createCell(11).setCellValue(log.getAreaOfVisit());
                    row.createCell(12).setCellValue(log.getEffortHours().doubleValue());

                    Cell dateCell = row.createCell(13);
                    if (log.getDate() != null) {
                        dateCell.setCellValue(log.getDate().format(DATE_FORMATTER));
                    }

                    row.createCell(14).setCellValue(log.getMonth());
                    row.createCell(15).setCellValue(log.getUpdatedBy());

                    Cell updateCell = row.createCell(16);
                    if (log.getUpdatedDate() != null) {
                        updateCell.setCellValue(log.getUpdatedDate().format(DATE_FORMATTER));
                    }

                    // Apply style to all cells in row
                    for (int i = 0; i < headers.length; i++) {
                        Cell c = row.getCell(i);
                        if (c != null) {
                            c.setCellStyle(dataStyle);
                        }
                    }
                }
            }

            // Freeze panes
            sheet.createFreezePane(0, 1);

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
                if (sheet.getColumnWidth(i) < 3500) {
                    sheet.setColumnWidth(i, 3500);
                }
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private static CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }

    private static CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        return style;
    }
}
