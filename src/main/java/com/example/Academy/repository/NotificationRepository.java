package com.example.Academy.repository;

import com.example.Academy.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientId(Long recipientId);

    List<Notification> findByRole(String role);

    List<Notification> findByRecipientIdOrRole(Long recipientId, String role);
}
