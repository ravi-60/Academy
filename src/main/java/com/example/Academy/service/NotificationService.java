package com.example.Academy.service;

import com.example.Academy.entity.Notification;
import com.example.Academy.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    public List<Notification> getNotificationsForUser(Long userId, String role) {
        // Fetch notifications specific to the user OR targeted at their role (e.g. ALL
        // ADMINS)
        return notificationRepository.findByRecipientIdOrRole(userId, role);
    }

    @Autowired
    private com.example.Academy.repository.UserRepository userRepository;

    // ... existing methods ...

    public void notifyRole(String targetRole, String type, String title, String message, String link) {
        notifyRole(targetRole, type, title, message, link, null);
    }

    public void notifyRole(String targetRole, String type, String title, String message, String link,
            Long excludeUserId) {
        try {
            com.example.Academy.entity.User.Role roleEnum = com.example.Academy.entity.User.Role.valueOf(targetRole);
            List<com.example.Academy.entity.User> users = userRepository.findByRoleAndStatus(roleEnum,
                    com.example.Academy.entity.User.Status.ACTIVE);

            for (com.example.Academy.entity.User user : users) {
                if (excludeUserId != null && user.getId().equals(excludeUserId)) {
                    continue; // Skip the sender
                }
                Notification n = new Notification(
                        user.getId(),
                        targetRole,
                        type,
                        title,
                        message,
                        link);
                createNotification(n);
            }
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid role for notification: " + targetRole);
        }
    }

    public Notification createNotification(Notification notification) {
        Notification saved = notificationRepository.save(notification);

        // Push to specific user channel
        if (saved.getRecipientId() != null) {
            messagingTemplate.convertAndSend("/topic/notifications/" + saved.getRecipientId(), saved);
        }

        return saved;
    }

    public void markAsRead(Long id) {
        notificationRepository.deleteById(id);
    }
}
