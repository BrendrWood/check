package com.onlinecheck.check;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    @Autowired
    private ApplicationRepository applicationRepository;

    public List<EngineerStats> getEngineerSuccessRates() {
        // Получаем всех уникальных инженеров
        List<String> engineers = applicationRepository.findAll().stream()
                .map(Application::getEngineer)
                .filter(engineer -> engineer != null && !engineer.trim().isEmpty())
                .distinct()
                .collect(Collectors.toList());

        List<EngineerStats> stats = new ArrayList<>();

        for (String engineer : engineers) {
            // Получаем заявки инженера
            List<Application> engineerApplications = applicationRepository
                    .findByEngineerContainingIgnoreCase(engineer);

            if (engineerApplications.isEmpty()) continue;

            // Берем последние 20 заявок (или меньше, если меньше 20)
            List<Application> lastApplications = engineerApplications.stream()
                    .sorted((a1, a2) -> a2.getLastUpdated().compareTo(a1.getLastUpdated()))
                    .limit(20)
                    .collect(Collectors.toList());

            // Считаем успешные заявки (resolution = true)
            long successCount = lastApplications.stream()
                    .filter(Application::isResolution)
                    .count();

            double successRate = (successCount * 10.0) / lastApplications.size();
            successRate = Math.round(successRate * 10.0) / 10.0; // Округление до 1 знака

            stats.add(new EngineerStats(
                    engineer,
                    successRate,
                    lastApplications.size(),
                    (int) successCount
            ));
        }

        // Сортируем по коэффициенту успешности (по убыванию)
        stats.sort((s1, s2) -> Double.compare(s2.getSuccessRate(), s1.getSuccessRate()));

        return stats;
    }

    // DTO класс для статистики инженера
    public static class EngineerStats {
        private String engineer;
        private double successRate; // 0-10
        private int totalApplications;
        private int successCount;

        public EngineerStats(String engineer, double successRate,
                             int totalApplications, int successCount) {
            this.engineer = engineer;
            this.successRate = successRate;
            this.totalApplications = totalApplications;
            this.successCount = successCount;
        }

        public String getEngineer() { return engineer; }
        public double getSuccessRate() { return successRate; }
        public int getTotalApplications() { return totalApplications; }
        public int getSuccessCount() { return successCount; }
    }
}