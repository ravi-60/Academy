package com.example.Academy.util;

import com.example.Academy.dto.report.ExecutiveReportData;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
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
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle statStyle = createStatStyle(workbook);
            CellStyle dataStyle = createDataStyle(workbook);
            CellStyle holidayStyle = createHolidayStyle(workbook);

            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.cloneStyleFrom(dataStyle);
            dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("dd-mmm-yyyy"));

            // 2. PREMIUM HEADER SECTION
            // Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Cohort Weekly Performance & Effort Analytics: " + data.getCohortCode());
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 16));

            // Meta Info
            Row infoRow = sheet.createRow(1);
            infoRow.createCell(0).setCellValue("Business Unit: " + data.getBusinessUnit());
            infoRow.createCell(8).setCellValue("Skill Track: " + data.getSkillTrack());
            infoRow.createCell(13).setCellValue(
                    "Generated At: " + data.getGeneratedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

            Row rangeRow = sheet.createRow(2);
            rangeRow.createCell(0).setCellValue("Report Range: " + data.getStartDate() + " to " + data.getEndDate());
            rangeRow.createCell(8).setCellValue("Coach: " + data.getCoachName());
            rangeRow.createCell(13).setCellValue("Reference ID: " + data.getReferenceId());

            // 3. SUMMARY STATS (Row 4-5)
            Row statsHeader = sheet.createRow(4);
            String[] statHeaders = { "Total Hours", "Tech Hours", "Behavioral Hours", "Mentor Hours", "Buddy Hours",
                    "Attendance %" };
            for (int i = 0; i < statHeaders.length; i++) {
                Cell cell = statsHeader.createCell(i);
                cell.setCellValue(statHeaders[i]);
                cell.setCellStyle(headerStyle);
            }

            Row statsRow = sheet.createRow(5);
            statsRow.createCell(0).setCellValue(data.getTotalHours().doubleValue());
            statsRow.createCell(1).setCellValue(data.getTechHours().doubleValue());
            statsRow.createCell(2).setCellValue(data.getBehavioralHours().doubleValue());
            statsRow.createCell(3).setCellValue(data.getMentorHours().doubleValue());
            statsRow.createCell(4).setCellValue(data.getBuddyMentorHours().doubleValue());
            statsRow.createCell(5).setCellValue(data.getAttendancePercentage() + "%");
            for (int i = 0; i < statHeaders.length; i++) {
                statsRow.getCell(i).setCellStyle(statStyle);
            }

            // 4. MAIN DATA TABLE (Row 8)
            int rowNum = 8;
            Row headerRow = sheet.createRow(rowNum++);
            headerRow.setHeightInPoints(30);
            String[] headers = {
                    "Cohort Code", "BU", "Skill", "Active GenC Count", "Training Location",
                    "Mapped", "Internal SME /External SME/Mentor ID", "Internal SME /External SME/Mentor Name",
                    "SME/Mentor/Buddy Mentor/MFRP Contributor", "Mode in which trainer connected",
                    "Reason for virtual connect of the trainer", "Area of Visit/Work", "Effort in Hours",
                    "Date", "Month", "Updated By", "Updated Date"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // 5. DATA ROWS
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
            sheet.createFreezePane(0, 9);

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

    private static CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 18);
        font.setBold(true);
        font.setColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
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

    private static CellStyle createStatStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderTop(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.MEDIUM);
        style.setBorderRight(BorderStyle.MEDIUM);
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
        font.setColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFont(font);
        return style;
    }

    private static CellStyle createHolidayStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(IndexedColors.ROSE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}
