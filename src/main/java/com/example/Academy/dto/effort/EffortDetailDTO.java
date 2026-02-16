package com.example.Academy.dto.effort;

import java.math.BigDecimal;

public class EffortDetailDTO {
    private BigDecimal hours;
    private String notes;
    private String mode;
    private String reasonVirtual;

    public EffortDetailDTO() {
    }

    public EffortDetailDTO(BigDecimal hours, String notes) {
        this.hours = hours;
        this.notes = notes;
    }

    public BigDecimal getHours() {
        return hours;
    }

    public void setHours(BigDecimal hours) {
        this.hours = hours;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getMode() {
        return mode;
    }

    public void setMode(String mode) {
        this.mode = mode;
    }

    public String getReasonVirtual() {
        return reasonVirtual;
    }

    public void setReasonVirtual(String reasonVirtual) {
        this.reasonVirtual = reasonVirtual;
    }
}
