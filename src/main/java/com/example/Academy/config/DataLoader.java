package com.example.Academy.config;

import com.example.Academy.entity.User;
import com.example.Academy.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class DataLoader implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        createOrUpdateAdmin();
        createOrUpdateCoach1();
        createOrUpdateCoach2();
        System.out.println("Users loaded successfully.");
    }

    private void createOrUpdateAdmin() {
        String email = "admin@academy.com";
        String defaultAvatar = generateAvatar("A", "#007bff"); // Blue for Admin
        User user = userRepository.findByEmail(email).orElse(new User());

        user.setEmpId("admin1001");
        user.setName("Admin User");
        user.setEmail(email);
        if (user.getPassword() == null || user.getPassword().isEmpty()) { // Check if password is null or empty
            user.setPassword(passwordEncoder.encode("admin123"));
        }
        user.setRole(User.Role.ADMIN);
        user.setEmployeeType(User.EmployeeType.INTERNAL);
        user.setStatus(User.Status.ACTIVE);

        // Only set default avatar if none exists
        if (user.getAvatar() == null || user.getAvatar().isEmpty()) {
            user.setAvatar(defaultAvatar);
        }

        if (user.getCreatedAt() == null)
            user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    private void createOrUpdateCoach1() {
        String email = "coach1@academy.com";
        String defaultAvatar = generateAvatar("C", "#28a745"); // Green for Coach
        User user = userRepository.findByEmail(email).orElse(new User());

        user.setEmpId("coach2001");
        user.setName("Coach One");
        user.setEmail(email);
        if (user.getPassword() == null || user.getPassword().isEmpty()) { // Check if password is null or empty
            user.setPassword(passwordEncoder.encode("coach123"));
        }
        user.setRole(User.Role.COACH);
        user.setEmployeeType(User.EmployeeType.INTERNAL);
        user.setStatus(User.Status.ACTIVE);

        // Only set default avatar if none exists
        if (user.getAvatar() == null || user.getAvatar().isEmpty()) {
            user.setAvatar(defaultAvatar);
        }

        if (user.getCreatedAt() == null)
            user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    private void createOrUpdateCoach2() {
        String email = "coach2@academy.com";
        String defaultAvatar = generateAvatar("C", "#fd7e14"); // Orange for Coach 2
        User user = userRepository.findByEmail(email).orElse(new User());

        user.setEmpId("coach2002");
        user.setName("Coach Two");
        user.setEmail(email);
        if (user.getPassword() == null || user.getPassword().isEmpty()) { // Check if password is null or empty
            user.setPassword(passwordEncoder.encode("coach123"));
        }
        user.setRole(User.Role.COACH);
        user.setEmployeeType(User.EmployeeType.EXTERNAL);
        user.setStatus(User.Status.ACTIVE);

        // Only set default avatar if none exists
        if (user.getAvatar() == null || user.getAvatar().isEmpty()) {
            user.setAvatar(defaultAvatar);
        }

        if (user.getCreatedAt() == null)
            user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    // Placeholder for avatar generation. In a real application, this might generate
    // a URL or base64 image.
    private String generateAvatar(String initial, String color) {
        // For demonstration, returning a simple string.
        // In a real app, you might use a library or service to generate an actual
        // image.
        return "https://via.placeholder.com/150/" + color.substring(1) + "/ffffff?text=" + initial;
    }
}
