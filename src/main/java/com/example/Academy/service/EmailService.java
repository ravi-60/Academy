package com.example.Academy.service;

import com.example.Academy.entity.StakeholderEffort;
import com.example.Academy.entity.User;
import com.example.Academy.entity.WeeklySummary;
import com.example.Academy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;

@Service
public class EmailService {

    private JavaMailSender mailSender;

    private final String email;

    private final String password;

    @Autowired
    public EmailService(JavaMailSender mailSender, @Value("${spring.mail.password}") String password,
            @Value("${spring.mail.username}") String email) {
        this.mailSender = mailSender;
        this.password = password;
        this.email = email;
        configureMailSender();
    }

    private void configureMailSender() {
        if (mailSender instanceof org.springframework.mail.javamail.JavaMailSenderImpl) {
            org.springframework.mail.javamail.JavaMailSenderImpl impl = (org.springframework.mail.javamail.JavaMailSenderImpl) mailSender;
            impl.setHost("smtp.gmail.com");
            impl.setPort(587);
            impl.setUsername(email);
            impl.setPassword(password);

            java.util.Properties props = impl.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.debug", "true");
        }
    }

    @Autowired
    private UserService userService;

    @Async
    public void sendDailyEffortNotification(StakeholderEffort effort) {
        List<User> recipients = new java.util.ArrayList<>(userService.getUsersByRole(User.Role.ADMIN));

        String subject = "Daily Effort Submission Notification";
        String body = buildDailyEffortEmailBody(effort);

        sendEmail(recipients, subject, body);
    }

    @Async
    public void sendWeeklySummaryNotification(WeeklySummary summary) {
        List<User> recipients = new java.util.ArrayList<>(userService.getUsersByRole(User.Role.ADMIN));

        String subject = "Weekly Effort Summary - " + summary.getCohort().getCode();
        String body = buildWeeklySummaryEmailBody(summary);

        sendEmail(recipients, subject, body);
    }

    private void sendEmail(List<User> recipients, String subject, String body) {
        try {
            for (User recipient : recipients) {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setTo(recipient.getEmail());
                message.setSubject(subject);
                message.setText(body);
                mailSender.send(message);
            }
        } catch (org.springframework.mail.MailException e) {
            System.err.println("Failed to send email notification: " + e.getMessage());
        }
    }

    private String buildDailyEffortEmailBody(StakeholderEffort effort) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

        return String.format(
                "Dear Team,\n\n" +
                        "A new effort has been submitted:\n\n" +
                        "Cohort: %s\n" +
                        "Trainer/Mentor: %s (%s)\n" +
                        "Role: %s\n" +
                        "Mode: %s\n" +
                        "Area of Work: %s\n" +
                        "Effort Hours: %.2f\n" +
                        "Date: %s\n" +
                        "Submitted By: %s\n\n" +
                        "Best regards,\n" +
                        "Academy System",
                effort.getCohort().getCode(),
                effort.getTrainerMentor().getName(),
                effort.getTrainerMentor().getEmpId(),
                effort.getRole(),
                effort.getMode(),
                effort.getAreaOfWork(),
                effort.getEffortHours(),
                effort.getEffortDate().format(formatter),
                effort.getUpdatedBy().getName());
    }

    private String buildWeeklySummaryEmailBody(WeeklySummary summary) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MMM-yyyy");

        return String.format(
                "Dear Team,\n\n" +
                        "Weekly effort summary for Cohort %s:\n\n" +
                        "Week: %s to %s\n" +
                        "Total Effort Hours: %.2f\n" +
                        "Summary Generated: %s\n\n" +
                        "Please review the efforts for this week.\n\n" +
                        "Best regards,\n" +
                        "Academy System",
                summary.getCohort().getCode(),
                summary.getWeekStartDate().format(formatter),
                summary.getWeekEndDate().format(formatter),
                summary.getTotalHours(),
                summary.getSummaryDate().format(DateTimeFormatter.ofPattern("dd-MMM-yyyy HH:mm")));
    }

    @Async
    public void sendFeedbackLinkToCandidates(List<String> recipients, String cohortCode, String feedbackLink) {
        // We send individual emails to hide other recipients, or use BCC.
        // For personalization (Hi Name), we need a map. simpler to loop.
        // This method assumes the caller handles the loop for personalization if
        // needed,
        // or we pass a list of Candidate objects. Let's pass Candidate objects in the
        // controller
        // and loop there, calling a simple send method here.
        // OR better: keep logic here.
    }

    @Async
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send HTML email to " + to + ": " + e.getMessage());
        }
    }

    @Async
    public void sendEmailWithAttachments(String to, String subject, String body,
            java.util.Map<String, byte[]> attachments) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);

            for (java.util.Map.Entry<String, byte[]> entry : attachments.entrySet()) {
                helper.addAttachment(entry.getKey(),
                        new org.springframework.core.io.ByteArrayResource(entry.getValue()));
            }

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email with multiple attachments to " + to + ": " + e.getMessage());
        }
    }

    @Async
    public void sendEmailWithAttachment(String to, String subject, String body, String filename,
            byte[] attachmentData) {
        try {
            jakarta.mail.internet.MimeMessage message = mailSender.createMimeMessage();
            org.springframework.mail.javamail.MimeMessageHelper helper = new org.springframework.mail.javamail.MimeMessageHelper(
                    message, true);

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body);
            helper.addAttachment(filename, new org.springframework.core.io.ByteArrayResource(attachmentData));

            mailSender.send(message);
        } catch (Exception e) {
            System.err.println("Failed to send email attachment to " + to + ": " + e.getMessage());
        }
    }
}