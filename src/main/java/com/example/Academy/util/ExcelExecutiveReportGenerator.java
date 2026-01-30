package com.example.Academy.util;

import com.example.Academy.dto.report.ExecutiveReportData;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;

public class ExcelExecutiveReportGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static byte[] generate(ExecutiveReportData data) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Weekly Performance Report");

            // 1. STYLES
            CellStyle headerStyle = createHeaderStyle(workbook);
            CellStyle titleStyle = createTitleStyle(workbook);
            CellStyle statStyle = createStatStyle(workbook);
            CellStyle holidayStyle = createHolidayStyle(workbook);
            CellStyle dateStyle = workbook.createCellStyle();
            dateStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("yyyy-mm-dd"));

            // 2. HEADER / TITLE
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("Cohort Weekly Performance & Effort Report: " + data.getCohortCode());
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

            Row infoRow = sheet.createRow(1);
            infoRow.createCell(0).setCellValue("Business Unit: " + data.getBusinessUnit());
            infoRow.createCell(3).setCellValue("Generated At: " + data.getGeneratedAt().toString());

            Row rangeRow = sheet.createRow(2);
            rangeRow.createCell(0).setCellValue("Report Range: " + data.getStartDate() + " to " + data.getEndDate());
            rangeRow.createCell(3).setCellValue("Reference ID: " + data.getReferenceId());

            // 3. SUMMARY STATS
            Row statsHeader = sheet.createRow(4);
            statsHeader.createCell(0).setCellValue("Total Hours");
            statsHeader.createCell(1).setCellValue("Tech Hours");
            statsHeader.createCell(2).setCellValue("BH Hours");
            statsHeader.createCell(3).setCellValue("Mentor Hours");
            statsHeader.createCell(4).setCellValue("Buddy Hours");
            statsHeader.createCell(5).setCellValue("Attendance %");

            for (int i = 0; i <= 5; i++)
                statsHeader.getCell(i).setCellStyle(headerStyle);

            Row statsRow = sheet.createRow(5);
            statsRow.createCell(0).setCellValue(data.getTotalHours().doubleValue());
            statsRow.createCell(1).setCellValue(data.getTechHours().doubleValue());
            statsRow.createCell(2).setCellValue(data.getBehavioralHours().doubleValue());
            statsRow.createCell(3).setCellValue(data.getMentorHours().doubleValue());
            statsRow.createCell(4).setCellValue(data.getBuddyMentorHours().doubleValue());
            statsRow.createCell(5).setCellValue(data.getAttendancePercentage());
            for (int i = 0; i <= 5; i++)
                statsRow.getCell(i).setCellStyle(statStyle);

            // 4. MAIN DATA TABLE
            int rowNum = 8;
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = { "Date", "Technical Trainer", "Behavioral Trainer", "Mentor", "Buddy Mentor", "Holiday",
                    "Notes" };
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            for (ExecutiveReportData.DailyReportLog log : data.getDailyLogs()) {
                // Skip Sat/Sun to match Periodic Governance standards
                if (log.getDate().getDayOfWeek().getValue() >= 6)
                    continue;

                Row row = sheet.createRow(rowNum++);

                Cell dCell = row.createCell(0);
                dCell.setCellValue(log.getDate().format(DATE_FORMATTER));

                row.createCell(1).setCellValue(log.getTechHours().doubleValue());
                row.createCell(2).setCellValue(log.getBehavioralHours().doubleValue());
                row.createCell(3).setCellValue(log.getMentorHours().doubleValue());
                row.createCell(4).setCellValue(log.getBuddyMentorHours().doubleValue());
                row.createCell(5).setCellValue(log.isHoliday() ? "YES" : "NO");
                row.createCell(6).setCellValue(log.getNotes());

                if (log.isHoliday()) {
                    for (int i = 0; i < headers.length; i++) {
                        row.getCell(i).setCellStyle(holidayStyle);
                    }
                }
            }

            // 5. FREEZE PANES/FILTER
            sheet.createFreezePane(0, 9); // Freeze header row
            sheet.setAutoFilter(new CellRangeAddress(8, rowNum - 1, 0, 6));

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private static CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 16);
        font.setBold(true);
        font.setColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
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
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private static CellStyle createStatStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 12);
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
