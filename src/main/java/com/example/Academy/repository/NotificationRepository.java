package com.example.Academy.repository;

import com.example.Academy.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientId(Long recipientId);

    List<Notification> findByRole(String role);

    @org.springframework.data.jpa.repository.Query("SELECT n FROM Notification n WHERE n.recipientId = :recipientId OR (n.role = :role AND n.recipientId IS NULL)")
    List<Notification> findByRecipientIdOrRole(
            @org.springframework.data.repository.query.Param("recipientId") Long recipientId,
            @org.springframework.data.repository.query.Param("role") String role);
}
