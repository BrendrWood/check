package com.onlinecheck.check;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailReportService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ExelService exelService;

    // Список получателей
    private final String[] recipients = {
            "bystryukov.dv@vrz.gulfstream.ru",
            "tebin.nd@spb.gulfstream.ru",
            "kholmikangas.bs@spb.gulfstream.ru",
            "okonechnikov.vd@Gulfstream.ru"
    };

    // Адрес отправителя (должен совпадать с spring.mail.username)
    private final String senderEmail = "report@gosquality.ru";

    public void sendNokReport() {
        try {
            // 1. Получаем заявки с резолюцией NOK (false)
            List<Application> nokApplications = applicationRepository.findByResolution(false);

            if (nokApplications.isEmpty()) {
                System.out.println("Нет заявок с резолюцией НОК для отправки.");
                return;
            }

            // 2. Генерируем Excel-файл с уникальным именем
            String tempFileName = "nok_report_" + System.currentTimeMillis() + ".xlsx";
            exelService.exportToExcel(nokApplications, tempFileName);

            // 3. Формируем письмо
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail);
            helper.setTo(recipients);
            helper.setSubject("Ежедневный отчёт: Заявки с резолюцией НОК за " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
            helper.setText("Добрый день!\n\nВо вложении отчёт по заявкам с резолюцией 'НОК'.");

            // 4. Прикрепляем Excel-файл
            helper.addAttachment("report_NOK_" + LocalDate.now() + ".xlsx", 
                    new ByteArrayResource(Files.readAllBytes(Paths.get(tempFileName))));

            // 5. Отправляем
            mailSender.send(message);
            System.out.println("✅ Отчёт по НОК успешно отправлен на адреса: " + String.join(", ", recipients));

            // 6. Удаляем временный файл
            Files.deleteIfExists(Paths.get(tempFileName));

        } catch (Exception e) {
            System.err.println("❌ Ошибка при отправке отчёта: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
