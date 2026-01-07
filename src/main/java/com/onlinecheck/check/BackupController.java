package com.onlinecheck.check;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.*;
import java.sql.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Component
public class BackupController {

    @Value("${spring.datasource.url}")
    private String dbUrl;

    @Value("${spring.datasource.username}")
    private String dbUser;

    @Value("${spring.datasource.password}")
    private String dbPassword;

    /**
     * Автоматический бэкап каждый год 2 января в 03:00
     * cron = секунды минуты часы день месяц день_недели
     */
    @Scheduled(cron = "0 0 3 2 1 ?")
    public void annualBackup() {
        System.out.println("=".repeat(60));
        System.out.println("🔄 ВЫПОЛНЕНИЕ АВТОМАТИЧЕСКОГО БЭКАПА");
        System.out.println("📅 Дата: 2 января 03:00 (ежегодно)");
        System.out.println("=".repeat(60));

        try {
            // 1. Создаем директорию для бэкапов
            Path backupDir = Paths.get("backups");
            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
                System.out.println("📁 Создана директория для бэкапов");
            }

            // 2. Генерируем имя файла с датой
            String timestamp = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss"));
            String backupFileName = "backup_" + timestamp + ".zip";
            Path backupPath = backupDir.resolve(backupFileName);

            // 3. Выполняем команду BACKUP через JDBC
            System.out.println("⏳ Создание бэкапа базы данных...");

            Class.forName("org.h2.Driver");
            try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPassword);
                 Statement stmt = conn.createStatement()) {

                // Встроенная команда H2 для создания бэкапа
                String backupSql = String.format("BACKUP TO '%s'", backupPath.toAbsolutePath());
                stmt.execute(backupSql);

                long fileSize = Files.size(backupPath);
                System.out.println("✅ Бэкап создан: " + backupFileName);
                System.out.println("📊 Размер: " + String.format("%.1f", fileSize / 1024.0) + " KB");

                // 4. Удаляем старые бэкапы (оставляем 5 последних)
                int deleted = cleanupOldBackups(backupDir);
                if (deleted > 0) {
                    System.out.println("🗑️  Удалено старых бэкапов: " + deleted);
                }

                // 5. Создаем файл с информацией
                createBackupInfo(backupPath, fileSize);

                System.out.println("📋 Всего хранится бэкапов: " + countBackups(backupDir));
                System.out.println("📍 Путь: " + backupPath.toAbsolutePath());

            }

        } catch (Exception e) {
            System.err.println("❌ ОШИБКА при создании бэкапа:");
            e.printStackTrace();
        }

        System.out.println("=".repeat(60));
        System.out.println("✅ АВТОМАТИЧЕСКИЙ БЭКАП ЗАВЕРШЕН");
        System.out.println("=".repeat(60));
    }

    /**
     * Удаление старых бэкапов (ротация - оставляем 5 последних)
     */
    private int cleanupOldBackups(Path backupDir) throws IOException {
        List<Path> backups = Files.list(backupDir)
                .filter(path -> path.toString().endsWith(".zip"))
                .sorted(Comparator.comparing(path -> {
                    try {
                        return Files.getLastModifiedTime(path);
                    } catch (IOException e) {
                        return null;
                    }
                }))
                .collect(Collectors.toList());

        int toDelete = Math.max(0, backups.size() - 5);
        int deleted = 0;

        for (int i = 0; i < toDelete; i++) {
            try {
                Files.delete(backups.get(i));
                System.out.println("   Удален старый бэкап: " + backups.get(i).getFileName());
                deleted++;
            } catch (IOException e) {
                System.err.println("   Не удалось удалить: " + backups.get(i));
            }
        }

        return deleted;
    }

    /**
     * Подсчет количества бэкапов в директории
     */
    private int countBackups(Path backupDir) throws IOException {
        return (int) Files.list(backupDir)
                .filter(path -> path.toString().endsWith(".zip"))
                .count();
    }

    /**
     * Создание текстового файла с информацией о бэкапе
     */
    private void createBackupInfo(Path backupFile, long size) throws IOException {
        String infoFile = backupFile.toString().replace(".zip", ".txt");
        String info = String.format(
                "Информация о бэкапе\n" +
                        "===================\n" +
                        "Файл: %s\n" +
                        "Создан: %s\n" +
                        "Тип: Автоматический ежегодный бэкап\n" +
                        "Расписание: 2 января, 03:00 каждый год\n" +
                        "Размер: %d байт (%.2f KB)\n" +
                        "База данных: %s\n" +
                        "Пользователь: %s\n" +
                        "Хранение: Последние 5 бэкапов (автоудаление старых)\n" +
                        "Восстановление: Распаковать ZIP в папку data/ и заменить checkdb.mv.db\n",
                backupFile.getFileName(),
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss")),
                size,
                size / 1024.0,
                dbUrl,
                dbUser
        );

        Files.write(Paths.get(infoFile), info.getBytes());
    }
}