package com.example.Academy.controller;

import com.example.Academy.dto.user.CreateUserRequest;
import com.example.Academy.entity.User;
import com.example.Academy.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.example.Academy.dto.user.UpdateUserRequest;
import com.example.Academy.dto.user.ProfileUpdateRequest;
import com.example.Academy.dto.user.PasswordUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

        @Autowired
        private UserService userService;

        // Get all users
        @GetMapping
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<User>> getAllUsers() {
                return ResponseEntity.ok(userService.getAllUsers());
        }

        // Get only coaches
        @GetMapping("/coaches")
        @PreAuthorize("hasAnyRole('ADMIN', 'COACH')")
        public ResponseEntity<List<User>> getCoaches() {
                return ResponseEntity.ok(
                                userService.findByRoleAndStatus("COACH", "ACTIVE"));
        }

        // Search users by role + status
        @GetMapping("/search")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<User>> searchUsers(
                        @RequestParam String role,
                        @RequestParam String status) {
                return ResponseEntity.ok(
                                userService.findByRoleAndStatus(role, status));
        }

        @PostMapping
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<User> createUser(
                        @Valid @RequestBody CreateUserRequest request) {
                return ResponseEntity.ok(
                                userService.createUserFromDto(request));
        }

        @PostMapping("/bulk")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<List<User>> createUsers(
                        @Valid @RequestBody List<CreateUserRequest> requests) {
                return ResponseEntity.ok(
                                userService.createUsers(requests));
        }

        @PutMapping("/{id}")
        @PreAuthorize("hasRole('ADMIN')")
        public ResponseEntity<User> updateUser(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateUserRequest request) {
                return ResponseEntity.ok(
                                userService.updateUserFromDto(id, request));
        }

        @PutMapping("/profile")
        public ResponseEntity<User> updateProfile(
                        @Valid @RequestBody ProfileUpdateRequest request,
                        Authentication authentication) {
                String email = (authentication != null) ? authentication.getName() : request.getEmail();
                if (email == null) {
                        throw new RuntimeException("Authentication email missing");
                }
                User user = userService.getUserByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                return ResponseEntity
                                .ok(userService.updateProfile(user.getId(), request.getName(), request.getLocation()));
        }

        @PutMapping("/password")
        public ResponseEntity<Void> updatePassword(
                        @Valid @RequestBody PasswordUpdateRequest request,
                        Authentication authentication) {
                String email = (authentication != null) ? authentication.getName() : request.getEmail();
                if (email == null) {
                        throw new RuntimeException("Authentication email missing");
                }
                User user = userService.getUserByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));
                userService.updatePassword(user.getId(), request.getCurrentPassword(), request.getNewPassword());
                return ResponseEntity.ok().build();
        }
}
