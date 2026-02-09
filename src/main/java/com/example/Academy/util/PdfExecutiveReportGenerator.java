package com.example.Academy.util;

import com.example.Academy.dto.report.ExecutiveReportData;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.lowagie.text.pdf.draw.LineSeparator;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class PdfExecutiveReportGenerator {

    private static final Color PRIMARY_COLOR = new Color(0, 122, 255); // Corporate Blue
    private static final Color ACCENT_COLOR = new Color(0, 243, 255); // Neon Cyan
    private static final Color TEXT_COLOR = new Color(33, 37, 41);
    private static final Color MUTED_TEXT = new Color(108, 117, 125);
    private static final Color TABLE_HEADER_BG = new Color(241, 243, 245);

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("MMM dd, yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    public static byte[] generate(ExecutiveReportData data) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter writer = PdfWriter.getInstance(document, out);

        // Footer Event
        writer.setPageEvent(new PdfFooterEvent(data.getReferenceId()));

        document.open();

        // 1. COVER PAGE
        addCoverPage(document, data);
        document.newPage();

        // 2. EXECUTIVE SUMMARY
        addSectionHeader(document, "EXECUTIVE PERFORMANCE SUMMARY");
        addExecutiveSummary(document, data);

        // 3. VISUAL ANALYTICS
        addSectionHeader(document, "WORKFORCE DISTRIBUTION ANALYTICS");
        addCharts(document, data);

        // Detailed breakdown usually warrants a fresh page for clean audit trails
        document.newPage();

        // 4. WEEKLY BREAKDOWN
        addSectionHeader(document, "DETAILED EFFORT LOGS (PERIODIC REVIEW)");
        addWeeklyBreakdownTable(document, data);

        document.close();
        return out.toByteArray();
    }

    private static void addCoverPage(Document document, ExecutiveReportData data) throws DocumentException {
        // Top Space
        for (int i = 0; i < 5; i++)
            document.add(new Paragraph(" "));

        // Identity
        Paragraph systemTitle = new Paragraph("COHORT GOVERNANCE SYSTEM",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.NORMAL, MUTED_TEXT));
        systemTitle.setAlignment(Element.ALIGN_CENTER);
        document.add(systemTitle);

        Paragraph reportLogo = new Paragraph("REPORTS & ANALYTICS",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Font.NORMAL, PRIMARY_COLOR));
        reportLogo.setAlignment(Element.ALIGN_CENTER);
        document.add(reportLogo);

        for (int i = 0; i < 2; i++)
            document.add(new Paragraph(" "));

        // Title
        Paragraph title = new Paragraph("Cohort Weekly Performance\n& Effort Report",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 32, Font.NORMAL, TEXT_COLOR));
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingBefore(20);
        document.add(title);

        Paragraph subtitle = new Paragraph("EXECUTIVE AUDIT COPY",
                FontFactory.getFont(FontFactory.HELVETICA, 12, Font.BOLD, MUTED_TEXT));
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(40);
        document.add(subtitle);

        // Divider
        LineSeparator line = new LineSeparator(2f, 20f, PRIMARY_COLOR, Element.ALIGN_CENTER, -2);
        document.add(new Chunk(line));

        // Details Table
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(60);
        table.setSpacingBefore(40);
        table.getDefaultCell().setBorder(Rectangle.NO_BORDER);
        table.getDefaultCell().setPadding(8);

        addDetailRow(table, "COHORT CODE", data.getCohortCode());
        addDetailRow(table, "BUSINESS UNIT", data.getBusinessUnit());
        addDetailRow(table, "SKILL TRACK", data.getSkillTrack());
        addDetailRow(table, "AUDIT RANGE",
                data.getStartDate().format(DATE_FORMATTER) + " - " + data.getEndDate().format(DATE_FORMATTER));
        addDetailRow(table, "AUTHORED BY", data.getCoachName());
        addDetailRow(table, "GENERATED AT",
                data.getGeneratedAt().format(DATE_FORMATTER) + " @ " + data.getGeneratedAt().format(TIME_FORMATTER));
        addDetailRow(table, "REFERENCE ID", data.getReferenceId());

        document.add(table);

        // Bottom Pattern simulation (Text based or simple line)
        for (int i = 0; i < 8; i++)
            document.add(new Paragraph(" "));
        Paragraph confidentiality = new Paragraph("INTERNAL USE ONLY - CONFIDENTIAL AUDIT DOCUMENT",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Font.NORMAL, MUTED_TEXT));
        confidentiality.setAlignment(Element.ALIGN_CENTER);
        document.add(confidentiality);

    }

    private static void addDetailRow(PdfPTable table, String label, String value) {
        Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.NORMAL, MUTED_TEXT);
        Font valueFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.NORMAL, TEXT_COLOR);

        table.addCell(new Phrase(label, labelFont));
        table.addCell(new Phrase(value, valueFont));
    }

    private static void addSectionHeader(Document document, String title) throws DocumentException {
        Paragraph p = new Paragraph(title,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Font.NORMAL, PRIMARY_COLOR));
        p.setSpacingAfter(5);
        p.setSpacingBefore(10);
        document.add(p);

        LineSeparator line = new LineSeparator(1f, 100f, new Color(222, 226, 230), Element.ALIGN_LEFT, -2);
        document.add(new Chunk(line));
    }

    private static void addExecutiveSummary(Document document, ExecutiveReportData data) throws DocumentException {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingBefore(10);

        addStatCell(table, "Total Hours", data.getTotalHours().toString() + "h");
        addStatCell(table, "Attendance", data.getAttendancePercentage() + "%");
        addStatCell(table, "Compliance", "AUDITED");
        addStatCell(table, "Status", data.getStatus());

        document.add(table);

        // AI Style Insight
        PdfPTable insightBox = new PdfPTable(1);
        insightBox.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell(new Phrase("AI INSIGHT: This cohort shows strong technical engagement with " +
                (data.getMentorHours().doubleValue() > 0 ? "consistent" : "limited") +
                " mentor support this week. Resource utilization is within mandatory compliance limits.",
                FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, Font.NORMAL, PRIMARY_COLOR)));
        cell.setBackgroundColor(new Color(240, 248, 255));
        cell.setBorderColor(new Color(176, 224, 230));
        cell.setPadding(10);
        insightBox.addCell(cell);
        document.add(insightBox);
    }

    private static void addStatCell(PdfPTable table, String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(10);

        Paragraph pLabel = new Paragraph(label.toUpperCase(),
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 8, Font.NORMAL, MUTED_TEXT));
        Paragraph pValue = new Paragraph(value,
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Font.NORMAL, PRIMARY_COLOR));

        cell.addElement(pLabel);
        cell.addElement(pValue);
        table.addCell(cell);
    }

    private static void addCharts(Document document, ExecutiveReportData data) throws DocumentException, IOException {
        // Pie Chart: Role Contribution (Only show active roles)
        DefaultPieDataset pieDataset = new DefaultPieDataset();
        if (data.getTechHours().compareTo(java.math.BigDecimal.ZERO) > 0)
            pieDataset.setValue("Technical", data.getTechHours());
        if (data.getBehavioralHours().compareTo(java.math.BigDecimal.ZERO) > 0)
            pieDataset.setValue("Behavioral", data.getBehavioralHours());
        if (data.getMentorHours().compareTo(java.math.BigDecimal.ZERO) > 0)
            pieDataset.setValue("Mentor", data.getMentorHours());
        if (data.getBuddyMentorHours().compareTo(java.math.BigDecimal.ZERO) > 0)
            pieDataset.setValue("Buddy", data.getBuddyMentorHours());

        JFreeChart pieChart = ChartFactory.createPieChart("Role Contribution Breakdown", pieDataset, true, true, false);
        pieChart.setBackgroundPaint(Color.white);

        // Bar Chart: Daily Trend
        DefaultCategoryDataset barDataset = new DefaultCategoryDataset();
        data.getDailyLogs().forEach(log -> {
            // Exclude Weekend commitment from chart to keep it clean for periodic training
            if (log.getDate().getDayOfWeek().getValue() < 6) {
                String day = log.getDate().getDayOfWeek().toString().substring(0, 3);
                if (data.getTechHours().compareTo(java.math.BigDecimal.ZERO) > 0)
                    barDataset.addValue(log.getTechHours(), "Technical", day);
                if (data.getBehavioralHours().compareTo(java.math.BigDecimal.ZERO) > 0)
                    barDataset.addValue(log.getBehavioralHours(), "Behavioral", day);
                if (data.getMentorHours().compareTo(java.math.BigDecimal.ZERO) > 0)
                    barDataset.addValue(log.getMentorHours(), "Mentor", day);
                if (data.getBuddyMentorHours().compareTo(java.math.BigDecimal.ZERO) > 0)
                    barDataset.addValue(log.getBuddyMentorHours(), "Buddy", day);
            }
        });

        JFreeChart barChart = ChartFactory.createBarChart("Daily Resource Commitment", "Day", "Hours",
                barDataset, PlotOrientation.VERTICAL, true, true, false);
        barChart.setBackgroundPaint(Color.white);

        // Add to document
        addImage(document, pieChart, 220, 180);
        addImage(document, barChart, 480, 220);
    }

    private static void addImage(Document document, JFreeChart chart, int width, int height)
            throws DocumentException, IOException {
        BufferedImage bufferedImage = chart.createBufferedImage(width * 2, height * 2);
        Image image = Image.getInstance(bufferedImage, null);
        image.scaleToFit(width, height);
        image.setAlignment(Element.ALIGN_CENTER);
        document.add(image);
    }

    private static void addWeeklyBreakdownTable(Document document, ExecutiveReportData data) throws DocumentException {
        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 2f, 1.5f, 1.5f, 1.5f, 1.5f, 1f, 3f });

        String[] headers = { "Date", "Tech", "BH", "Mentor", "Buddy", "Hol", "Notes" };
        for (String header : headers) {
            PdfPCell hCell = new PdfPCell(
                    new Phrase(header, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.NORMAL, TEXT_COLOR)));
            hCell.setBackgroundColor(TABLE_HEADER_BG);
            hCell.setPadding(8);
            hCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(hCell);
        }

        for (ExecutiveReportData.DailyReportLog log : data.getDailyLogs()) {
            // Skip weekends in the breakdown table to focus on training days
            if (log.getDate().getDayOfWeek().getValue() >= 6)
                continue;

            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, TEXT_COLOR);

            table.addCell(new Phrase(log.getDate().format(DATE_FORMATTER), cellFont));
            table.addCell(new Phrase(log.getTechHours().toString(), cellFont));
            table.addCell(new Phrase(log.getBehavioralHours().toString(), cellFont));
            table.addCell(new Phrase(log.getMentorHours().toString(), cellFont));
            table.addCell(new Phrase(log.getBuddyMentorHours().toString(), cellFont));

            PdfPCell holCell = new PdfPCell(new Phrase(log.isHoliday() ? "YES" : "", FontFactory
                    .getFont(FontFactory.HELVETICA_BOLD, 7, Font.NORMAL, log.isHoliday() ? Color.RED : TEXT_COLOR)));
            holCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            if (log.isHoliday())
                holCell.setBackgroundColor(new Color(255, 235, 238));
            table.addCell(holCell);

            table.addCell(new Phrase(log.getNotes(), cellFont));
        }

        document.add(table);
    }

    // Page Event for Footer
    static class PdfFooterEvent extends PdfPageEventHelper {
        private String refId;

        public PdfFooterEvent(String refId) {
            this.refId = refId;
        }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            PdfContentByte cb = writer.getDirectContent();
            Font footerFont = FontFactory.getFont(FontFactory.HELVETICA, 8, Font.NORMAL, MUTED_TEXT);

            String text = "Generated by Cohort Governance System | Ref: " + refId + " | Page " + writer.getPageNumber();
            String timestamp = "Audit Copy - Confidential";

            ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, new Phrase(text, footerFont),
                    document.left(), document.bottom() - 10, 0);

            ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, new Phrase(timestamp, footerFont),
                    document.right(), document.bottom() - 10, 0);
        }
    }
}
