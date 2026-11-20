package com.onlinecheck.check;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReportScheduler {

    @Autowired
    private EmailReportService emailReportService;

    // Запуск каждый день в 21:00 по времени сервера (UTC)
    @Scheduled(cron = "0 0 18 * * *")
    public void sendDailyReport() {
        System.out.println("⏰ Запуск ежедневного отчёта по НОК...");
        emailReportService.sendNokReport();
    }
}
