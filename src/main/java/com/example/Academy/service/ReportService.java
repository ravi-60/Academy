package com.example.Academy.service;

import com.example.Academy.dto.report.ChartDataDTO;
import com.example.Academy.dto.report.ReportResponseDTO;
import com.example.Academy.dto.report.ReportStatsDTO;
import com.example.Academy.entity.StakeholderEffort;
import com.example.Academy.repository.ActivityRepository;
import com.example.Academy.repository.CohortRepository;
import com.example.Academy.repository.MentorRepository;
import com.example.Academy.repository.StakeholderEffortRepository;
import com.example.Academy.repository.TrainerRepository;
import com.example.Academy.repository.WeeklySummaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {

        @Autowired
        private StakeholderEffortRepository effortRepository;

        @Autowired
        private WeeklySummaryRepository weeklySummaryRepository;

        @Autowired
        private ActivityRepository activityRepository;

        @Autowired
        private CohortRepository cohortRepository;

        @Autowired
        private TrainerRepository trainerRepository;

        @Autowired
        private MentorRepository mentorRepository;

        public ReportResponseDTO getReportData() {
                ReportStatsDTO stats = calculateStats();
                List<ChartDataDTO> distribution = calculateDistribution();
                List<ChartDataDTO> utilization = calculateUtilization();

                return new ReportResponseDTO(
                                stats,
                                distribution,
                                utilization,
                                activityRepository.findAll() // For simplicity, returning all activities as mock "recent
                                                             // reports"
                );
        }

        private ReportStatsDTO calculateStats() {
                List<StakeholderEffort> allEfforts = effortRepository.findAll();

                BigDecimal totalHours = allEfforts.stream()
                                .map(StakeholderEffort::getEffortHours)
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                long totalTrainers = trainerRepository.count();
                long totalMentors = mentorRepository.count();
                long summaryCount = weeklySummaryRepository.count();

                return new ReportStatsDTO(totalHours, totalTrainers, totalMentors, summaryCount);
        }

        private List<ChartDataDTO> calculateDistribution() {
                List<StakeholderEffort> allEfforts = effortRepository.findAll();

                Map<StakeholderEffort.Role, BigDecimal> roleHours = allEfforts.stream()
                                .collect(Collectors.groupingBy(
                                                StakeholderEffort::getRole,
                                                Collectors.reducing(BigDecimal.ZERO, StakeholderEffort::getEffortHours,
                                                                BigDecimal::add)));

                return roleHours.entrySet().stream()
                                .map(e -> new ChartDataDTO(e.getKey().toString(), e.getValue()))
                                .collect(Collectors.toList());
        }

        private List<ChartDataDTO> calculateUtilization() {
                // Placeholder for trainer-wise utilization
                List<StakeholderEffort> allEfforts = effortRepository.findAll();

                Map<String, BigDecimal> trainerHours = allEfforts.stream()
                                .filter(e -> e.getTrainerMentor() != null)
                                .collect(Collectors.groupingBy(
                                                e -> e.getTrainerMentor().getName(),
                                                Collectors.reducing(BigDecimal.ZERO, StakeholderEffort::getEffortHours,
                                                                BigDecimal::add)));

                return trainerHours.entrySet().stream()
                                .map(e -> new ChartDataDTO(e.getKey(), e.getValue()))
                                .collect(Collectors.toList());
        }
}
