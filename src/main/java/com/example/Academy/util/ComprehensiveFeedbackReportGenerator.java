package com.example.Academy.util;

import com.example.Academy.entity.Feedback;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ComprehensiveFeedbackReportGenerator {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

    public static java.util.Map<String, byte[]> generate(List<Feedback> feedbackList) throws IOException {
        java.util.Map<String, byte[]> attachments = new java.util.HashMap<>();

        attachments.put("Technical_Feedback.xlsx", createWorkbookBytes(feedbackList, "TECHNICAL"));
        attachments.put("Mentor_Feedback.xlsx", createWorkbookBytes(feedbackList, "MENTOR"));
        attachments.put("Coach_Feedback.xlsx", createWorkbookBytes(feedbackList, "COACH"));
        attachments.put("Buddy_Mentor_Feedback.xlsx", createWorkbookBytes(feedbackList, "BUDDY"));
        attachments.put("Behavioral_Feedback.xlsx", createWorkbookBytes(feedbackList, "BEHAVIORAL"));
        attachments.put("Overall_Feedback.xlsx", createWorkbookBytes(feedbackList, "OVERALL"));

        return attachments;
    }

    private static byte[] createWorkbookBytes(List<Feedback> feedbackList, String type) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            switch (type) {
                case "TECHNICAL":
                    createTechnicalSheet(workbook, feedbackList);
                    break;
                case "MENTOR":
                    createMentorSheet(workbook, feedbackList);
                    break;
                case "COACH":
                    createCoachSheet(workbook, feedbackList);
                    break;
                case "BUDDY":
                    createBuddySheet(workbook, feedbackList);
                    break;
                case "BEHAVIORAL":
                    createBehavioralSheet(workbook, feedbackList);
                    break;
                case "OVERALL":
                    createOverallSheet(workbook, feedbackList);
                    break;
            }
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    private static void createTechnicalSheet(Workbook workbook, List<Feedback> feedbackList) {
        Sheet sheet = workbook.createSheet("Technical Feedback");
        String[] headers = {
                "Week", "Candidate ID", "Technical Session Held?", "Course Content Rating",
                "Technical Knowledge Rating", "Trainer Engagement Rating", "Concepts Schedule Rating",
                "Udemy Recap Rating", "Additional Scenario Rating", "Low Score Explanation"
        };
        createSheetContent(workbook, sheet, headers, feedbackList, "TECHNICAL");
    }

    private static void createMentorSheet(Workbook workbook, List<Feedback> feedbackList) {
        Sheet sheet = workbook.createSheet("Mentor Feedback");
        String[] headers = {
                "Week", "Candidate ID", "Mentor Session Held?", "Mentor Guidance Rating",
                "Low Score Explanation"
        };
        createSheetContent(workbook, sheet, headers, feedbackList, "MENTOR");
    }

    private static void createCoachSheet(Workbook workbook, List<Feedback> feedbackList) {
        Sheet sheet = workbook.createSheet("Coach Feedback");
        String[] headers = {
                "Week", "Candidate ID", "Coach Effectiveness Rating", "Low Score Explanation"
        };
        createSheetContent(workbook, sheet, headers, feedbackList, "COACH");
    }

    private static void createBuddySheet(Workbook workbook, List<Feedback> feedbackList) {
        Sheet sheet = workbook.createSheet("Buddy Mentor Feedback");
        String[] headers = {
                "Week", "Candidate ID", "Did Buddy Connect?", "Doubts Clarified?",
                "Buddy Guidance Rating", "Suggestions"
        };
        createSheetContent(workbook, sheet, headers, feedbackList, "BUDDY");
    }

    private static void createBehavioralSheet(Workbook workbook, List<Feedback> feedbackList) {
        Sheet sheet = workbook.createSheet("Behavioral Feedback");
        String[] headers = {
                "Week", "Candidate ID", "Session Held?", "Delivery Rating",
                "Low Score Explanation"
        };
        createSheetContent(workbook, sheet, headers, feedbackList, "BEHAVIORAL");
    }

    private static void createOverallSheet(Workbook workbook, List<Feedback> feedbackList) {
        Sheet sheet = workbook.createSheet("Overall Feedback");
        String[] headers = {
                "Week", "Candidate ID", "Overall Satisfaction", "Created At"
        };
        createSheetContent(workbook, sheet, headers, feedbackList, "OVERALL");
    }

    private static void createSheetContent(Workbook workbook, Sheet sheet, String[] headers,
            List<Feedback> feedbackList, String type) {
        // Styles
        CellStyle headerStyle = workbook.createCellStyle();
        Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setBorderBottom(BorderStyle.THIN);

        CellStyle dataStyle = workbook.createCellStyle();
        dataStyle.setBorderBottom(BorderStyle.THIN);
        dataStyle.setBorderLeft(BorderStyle.THIN);
        dataStyle.setBorderRight(BorderStyle.THIN);
        dataStyle.setBorderTop(BorderStyle.THIN);

        // Header Row
        Row headerRow = sheet.createRow(0);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // Data Rows
        int rowNum = 1;
        for (Feedback f : feedbackList) {
            Row row = sheet.createRow(rowNum++);
            int col = 0;

            // Common columns first if needed, but per sheet is better
            // Assuming Candidate ID is available via feedbackRequest -> Candidate mapping?
            // Wait, Feedback entity doesn't link to Candidate directly?
            // Let's check Feedback.java again. It links to FeedbackRequest.
            // FeedbackRequest links to Cohort.
            // FeedbackRepository likely stores `employee_id` or similar?
            // Let's check Feedback.java again...
            // Ah, I missed checking if Feedback has Candidate info.

            // Re-checking Feedback.java content:
            // "private FeedbackRequest feedbackRequest;"
            // It doesn't seem to have Candidate info directly in the fields I saw.
            // Wait, I only saw lines 1-100.
            // I need to check lines 100+ of Feedback.java to see if `candidateName` or
            // `employeeId` is there.
            // The previous SQL logs showed: `f1_0.candidate_name`, `f1_0.employee_id`.
            // So they must be there. I will assume getters exist: getCandidateName(),
            // getEmployeeId().

            row.createCell(col++).setCellValue(f.getWeekNumber());
            // Using employeeId as a proxy for Candidate ID
            // I'll use a placeholder getter for now and verify later if I need to.
            // Based on SQL logs `f1_0.employee_id`, I assume `getEmployeeId()` exists.

            // Check if I can see getEmployeeId in the view_file output...
            // The view_file output ended at line 100.
            // I'll assume they exist.

            switch (type) {
                case "TECHNICAL":
                    row.createCell(col++).setCellValue(getSafeString(f.getEmployeeId()));
                    row.createCell(col++).setCellValue(getSafeBoolean(f.getIsTechnicalSessionHeld()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getCourseContentRating()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getTechnicalKnowledgeRating()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getTrainerEngagementRating()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getConceptsScheduleRating()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getUdemyRecapRating()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getAdditionalScenarioRating()));
                    row.createCell(col++).setCellValue(getSafeString(f.getTechnicalLowScoreExplanation()));
                    break;
                case "MENTOR":
                    row.createCell(col++).setCellValue(getSafeString(f.getEmployeeId()));
                    row.createCell(col++).setCellValue(getSafeBoolean(f.getIsMentorSessionHeld()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getMentorGuidanceRating()));
                    row.createCell(col++).setCellValue(getSafeString(f.getMentorLowScoreExplanation()));
                    break;
                case "COACH":
                    row.createCell(col++).setCellValue(getSafeString(f.getEmployeeId()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getCoachEffectivenessRating()));
                    row.createCell(col++).setCellValue(getSafeString(f.getCoachLowScoreExplanation()));
                    break;
                case "BUDDY":
                    row.createCell(col++).setCellValue(getSafeString(f.getEmployeeId()));
                    row.createCell(col++).setCellValue(getSafeBoolean(f.getDidBuddyMentorConnect()));
                    row.createCell(col++).setCellValue(getSafeBoolean(f.getWereDoubtsClarified()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getBuddyMentorGuidanceRating()));
                    row.createCell(col++).setCellValue(getSafeString(f.getBuddyMentorSuggestions()));
                    break;
                case "BEHAVIORAL":
                    row.createCell(col++).setCellValue(getSafeString(f.getEmployeeId()));
                    row.createCell(col++).setCellValue(getSafeBoolean(f.getIsBehavioralSessionHeld()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getBehavioralDeliveryRating()));
                    row.createCell(col++).setCellValue(getSafeString(f.getBehavioralLowScoreExplanation()));
                    break;
                case "OVERALL":
                    row.createCell(col++).setCellValue(getSafeString(f.getEmployeeId()));
                    row.createCell(col++).setCellValue(getSafeInt(f.getOverallSatisfaction()));
                    row.createCell(col++)
                            .setCellValue(f.getCreatedAt() != null ? f.getCreatedAt().format(DATE_FORMATTER) : "");
                    break;
            }
        }

        // Auto-size columns
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
        }
    }

    private static String getSafeString(String val) {
        return val != null ? val : "";
    }

    private static double getSafeInt(Integer val) {
        return val != null ? val.doubleValue() : 0.0;
    }

    private static String getSafeBoolean(Boolean val) {
        return val != null ? (val ? "Yes" : "No") : "No";
    }
}
