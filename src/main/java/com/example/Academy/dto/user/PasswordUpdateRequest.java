package com.example.Academy.dto.user;

import jakarta.validation.constraints.NotBlank;

public class PasswordUpdateRequest {
    @NotBlank
    private String currentPassword;
    @NotBlank
    private String newPassword;
    private String email;

    // Getters & Setters
    public String getCurrentPassword() {
        return currentPassword;
    }

    public void setCurrentPassword(String currentPassword) {
        this.currentPassword = currentPassword;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
