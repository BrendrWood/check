package com.onlinecheck.check;

import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

import java.io.FileInputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ExelService exelService;

    @Autowired
    private ObjectMapper objectMapper; // Добавляем ObjectMapper

    @Autowired
    private StatisticsService statisticsService;

    // ============================================
    // CRUD ОПЕРАЦИИ ДЛЯ ЗАЯВОК
    // ============================================

    // GET: Получение всех заявок
    @GetMapping
    public List<Application> getAllApplications() {
        return applicationRepository.findAllOrderByLastUpdatedDesc();
    }

    // GET: Получение заявки по id
    @GetMapping("/{id}")
    public ResponseEntity<Application> getApplicationById(@PathVariable Long id) {
        return applicationRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // GET: Поиск по номеру заявки
    @GetMapping("/findByNumber")
    public ResponseEntity<Application> findByNumber(@RequestParam String applicationNumber) {
        Application app = applicationRepository.findByApplicationNumber(applicationNumber);
        if (app == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(app);
    }

    // GET: Получение последних N заявок
    @GetMapping("/recent")
    public List<Application> getRecentApplications(@RequestParam(defaultValue = "20") int limit) {
        return applicationRepository.findRecentApplications(limit);
    }

    // GET: Получение всех уникальных дат
    @GetMapping("/dates")
    public List<LocalDate> getAllDates() {
        return applicationRepository.findDistinctDates();
    }

    // GET: Получение заявок по дате
    @GetMapping("/by-date/{date}")
    public List<Application> getApplicationsByDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return applicationRepository.findByDate(date);
    }

    // GET: Получение заявок по диапазону дат
    @GetMapping("/by-date-range")
    public List<Application> getApplicationsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return applicationRepository.findByDateRange(startDate, endDate);
    }

    // GET: Поиск по инженеру
    @GetMapping("/search/engineer")
    public List<Application> searchByEngineer(@RequestParam String engineer) {
        return applicationRepository.findByEngineerContainingIgnoreCase(engineer);
    }

    // GET: Получение заявок по резолюции
    @GetMapping("/resolution/{resolution}")
    public List<Application> getApplicationsByResolution(@PathVariable boolean resolution) {
        return applicationRepository.findByResolution(resolution);
    }

    // GET: Статистика по дате
    @GetMapping("/stats/{date}")
    public Long getStatsByDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return applicationRepository.countByDate(date);
    }

    // GET: Статистика по инженерам
    @GetMapping("/stats/engineers")
    public ResponseEntity<?> getEngineerStats() {
        try {
            // Простая проверка роли (можно улучшить)
            // Для тестирования пока возвращаем всем
            List<StatisticsService.EngineerStats> stats = statisticsService.getEngineerSuccessRates();
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Ошибка: " + e.getMessage());
        }
    }

    // POST: Создание новой заявки
    @PostMapping
    public ResponseEntity<Application> createApplication(@RequestBody Application application) {
        // Проверка уникальности номера
        Application existing = applicationRepository.findByApplicationNumber(application.getApplicationNumber());
        if (existing != null) {
            return ResponseEntity.badRequest().body(null);
        }
        Application saved = applicationRepository.save(application);
        return ResponseEntity.ok(saved);
    }

    // PUT: Обновление заявки
    @PutMapping("/{id}")
    public ResponseEntity<Application> updateApplication(@PathVariable Long id,
                                                         @RequestBody Application updatedApplication) {
        return applicationRepository.findById(id)
                .map(existing -> {
                    // Копируем поля из обновленной заявки
                    if (updatedApplication.getApplicationNumber() != null) {
                        existing.setApplicationNumber(updatedApplication.getApplicationNumber());
                    }
                    if (updatedApplication.getEngineer() != null) {
                        existing.setEngineer(updatedApplication.getEngineer());
                    }
                    if (updatedApplication.getGsmLevel() != null) {
                        existing.setGsmLevel(updatedApplication.getGsmLevel());
                    }
                    if (updatedApplication.getInternetLevel() != null) {
                        existing.setInternetLevel(updatedApplication.getInternetLevel());
                    }
                    if (updatedApplication.getInternetReason() != null) {
                        existing.setInternetReason(updatedApplication.getInternetReason());
                    }

                    // Булевые поля
                    existing.setMpkInstalled(updatedApplication.isMpkInstalled());
                    existing.setHighCeiling(updatedApplication.isHighCeiling());
                    existing.setSensorConnectLevel(updatedApplication.isSensorConnectLevel());
                    existing.setAnimals(updatedApplication.isAnimals());
                    existing.setNightMode(updatedApplication.isNightMode());
                    existing.setSensorsOk(updatedApplication.isSensorsOk());
                    existing.setLabel(updatedApplication.isLabel());
                    existing.setAvr(updatedApplication.isAvr());
                    existing.setSystemPhoto(updatedApplication.isSystemPhoto());
                    existing.setFloorPlan(updatedApplication.isFloorPlan());
                    existing.setSecondForm(updatedApplication.isSecondForm());
                    existing.setDocs(updatedApplication.isDocs());
                    existing.setRoadMap(updatedApplication.isRoadMap());
                    existing.setPublicName(updatedApplication.isPublicName());
                    existing.setRent(updatedApplication.isRent());  // ЗАМЕНА: было setCheckList, теперь setRent

                    // Остальные поля
                    if (updatedApplication.getInstallationDate() != null) {
                        existing.setInstallationDate(updatedApplication.getInstallationDate());
                    }
                    if (updatedApplication.getInspector() != null) {
                        existing.setInspector(updatedApplication.getInspector());
                    }
                    if (updatedApplication.getRentReason() != null) {  
                        existing.setRentReason(updatedApplication.getRentReason());
                    }
                    if (updatedApplication.getComments() != null) {
                        existing.setComments(updatedApplication.getComments());
                    }

                    existing.setResolution(updatedApplication.isResolution());

                    Application saved = applicationRepository.save(existing);
                    return ResponseEntity.ok(saved);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // DELETE: Удаление заявки
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteApplication(@PathVariable Long id) {
        if (applicationRepository.existsById(id)) {
            applicationRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    // ============================================
    // МЕТОДЫ ДЛЯ ЭКСПОРТА
    // ============================================

    // Вспомогательный метод для получения списка заявок
    private List<Application> getApplications(Long id, String number) {
        if (id != null) {
            return applicationRepository.findById(id)
                    .map(List::of)
                    .orElse(List.of());
        } else if (number != null && !number.trim().isEmpty()) {
            Application app = applicationRepository.findByApplicationNumber(number);
            return (app != null) ? List.of(app) : List.of();
        } else {
            return applicationRepository.findAll();
        }
    }

    // Вспомогательный метод для генерации имени файла
    private String generateFilename(Long id, String number) {
        if (id != null) {
            return "application_" + id + ".xlsx";
        } else if (number != null && !number.trim().isEmpty()) {
            return "application_" + number + ".xlsx";
        } else {
            return "all_applications_" +
                    LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) +
                    ".xlsx";
        }
    }

    // GET: Экспорт заявок в Excel
    @GetMapping("/export")
    public void exportApplications(@RequestParam(required = false) Long id,
                                   @RequestParam(required = false) String number,
                                   HttpServletResponse response) throws Exception {

        List<Application> applications = getApplications(id, number);

        // Проверяем, есть ли данные для экспорта
        if (applications.isEmpty()) {
            response.setContentType("text/plain;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("Заявки не найдены");
            return;
        }

        // Генерируем Excel файл
        exelService.exportToExcel(applications);

        // Настраиваем ответ для скачивания
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        // Имя файла
        String filename = generateFilename(id, number);
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        // Отправляем файл
        try (FileInputStream fileIn = new FileInputStream("applications.xlsx")) {
            IOUtils.copy(fileIn, response.getOutputStream());
        }
    }

    // GET: Экспорт заявок, обработанных сегодня
    @GetMapping("/export/today")
    public void exportTodayApplications(HttpServletResponse response) throws Exception {
        // Получаем начало сегодняшнего дня
        LocalDateTime startOfToday = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

        // Используем метод репозитория
        List<Application> todayApplications = applicationRepository.findApplicationsUpdatedToday(startOfToday);

        // Если нет заявок за сегодня - сообщаем об этом
        if (todayApplications.isEmpty()) {
            response.setContentType("text/plain;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("Нет заявок, обработанных сегодня");
            return;
        }

        // Генерируем Excel файл
        exelService.exportToExcel(todayApplications);

        // Настраиваем ответ для скачивания
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        // Форматируем дату для имени файла
        String todayDate = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        response.setHeader("Content-Disposition",
                "attachment; filename=\"applications_processed_today_" + todayDate + ".xlsx\"");

        // Отправляем файл
        try (FileInputStream fileIn = new FileInputStream("applications.xlsx")) {
            IOUtils.copy(fileIn, response.getOutputStream());
        }
    }

    // GET: Экспорт заявок по дате
    @GetMapping("/export/date/{date}")
    public void exportApplicationsByDate(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                         HttpServletResponse response) throws Exception {

        List<Application> applications = applicationRepository.findByDate(date);

        // Если нет заявок за указанную дату
        if (applications.isEmpty()) {
            response.setContentType("text/plain;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("Нет заявок за указанную дату: " + date);
            return;
        }

        // Генерируем Excel файл
        exelService.exportToExcel(applications);

        // Настраиваем ответ для скачивания
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

        // Форматируем дату для имени файла
        String formattedDate = date.format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        response.setHeader("Content-Disposition",
                "attachment; filename=\"applications_" + formattedDate + ".xlsx\"");

        // Отправляем файл
        try (FileInputStream fileIn = new FileInputStream("applications.xlsx")) {
            IOUtils.copy(fileIn, response.getOutputStream());
        }
    }

    // POST: Экспорт результатов поиска
    @PostMapping("/export/search")
    public void exportSearchResults(@RequestParam String searchResults,
                                    @RequestParam(required = false) String searchName,
                                    HttpServletResponse response) throws Exception {

        try {
            // Парсим JSON с ID заявок
            List<Long> ids = objectMapper.readValue(searchResults, new TypeReference<List<Long>>() {});

            // Получаем заявки по ID
            List<Application> applications = applicationRepository.findAllById(ids);

            if (applications.isEmpty()) {
                response.setContentType("text/plain;charset=UTF-8");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("Нет данных для экспорта");
                return;
            }

            // Генерируем имя файла
            String filename = (searchName != null && !searchName.trim().isEmpty())
                    ? "search_results_" + searchName.replaceAll("[^a-zA-Z0-9а-яА-ЯёЁ._-]", "_") + ".xlsx"
                    : "search_results_" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + ".xlsx";

            // Экспортируем в Excel
            exelService.exportToExcel(applications, "search_results.xlsx");

            // Настраиваем ответ для скачивания
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

            // Отправляем файл
            try (FileInputStream fileIn = new FileInputStream("search_results.xlsx")) {
                IOUtils.copy(fileIn, response.getOutputStream());
            }

            // Удаляем временный файл
            Files.deleteIfExists(Paths.get("search_results.xlsx"));

        } catch (Exception e) {
            response.setContentType("text/plain;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("Ошибка экспорта: " + e.getMessage());
        }
    }

    // POST: Экспорт по дате
    @PostMapping("/export/by-date")
    public void exportByDate(@RequestParam String date,
                             @RequestParam(required = false) String ids,
                             @RequestParam(required = false) String fileName,
                             HttpServletResponse response) throws Exception {

        try {
            List<Application> applications;

            if (ids != null && !ids.trim().isEmpty()) {
                // Если переданы ID заявок - используем их
                List<Long> idList = objectMapper.readValue(ids, new TypeReference<List<Long>>() {});
                applications = applicationRepository.findAllById(idList);
            } else {
                // Если ID не переданы - получаем по дате
                LocalDate parsedDate = LocalDate.parse(date);
                applications = applicationRepository.findByDate(parsedDate);
            }

            if (applications.isEmpty()) {
                response.setContentType("text/plain;charset=UTF-8");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("Нет заявок за указанную дату: " + date);
                return;
            }

            // Генерируем имя файла
            String filename;
            if (fileName != null && !fileName.trim().isEmpty()) {
                filename = fileName;
            } else {
                filename = "applications_" + date.replace("-", "") + ".xlsx";
            }

            // Используем уникальное имя временного файла
            String tempFileName = "temp_export_" + System.currentTimeMillis() + ".xlsx";

            // Экспортируем в Excel
            exelService.exportToExcel(applications, tempFileName);

            // Настраиваем ответ для скачивания
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

            // Отправляем файл
            try (FileInputStream fileIn = new FileInputStream(tempFileName)) {
                IOUtils.copy(fileIn, response.getOutputStream());
            }

            // Удаляем временный файл
            Files.deleteIfExists(Paths.get(tempFileName));

        } catch (Exception e) {
            response.setContentType("text/plain;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("Ошибка экспорта: " + e.getMessage());
            e.printStackTrace();
        }
    }

    // POST: Экспорт кастомного списка заявок
    @PostMapping("/export/custom")
    public void exportCustomApplications(@RequestBody Map<String, Object> request,
                                         HttpServletResponse response) throws Exception {

        @SuppressWarnings("unchecked")
        List<Long> ids = (List<Long>) request.get("applications");
        String fileName = (String) request.getOrDefault("fileName", "export.xlsx");

        if (ids == null || ids.isEmpty()) {
            response.setContentType("text/plain;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("Нет данных для экспорта");
            return;
        }

        List<Application> applications = applicationRepository.findAllById(ids);

        if (applications.isEmpty()) {
            response.setContentType("text/plain;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("Заявки не найдены");
            return;
        }

        // Очищаем имя файла
        fileName = fileName.replaceAll("[^a-zA-Z0-9а-яА-ЯёЁ._-]", "_");

        // Экспортируем в Excel
        exelService.exportToExcel(applications, fileName);

        // Настраиваем ответ для скачивания
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + fileName + "\"");

        // Отправляем файл
        try (FileInputStream fileIn = new FileInputStream(fileName)) {
            IOUtils.copy(fileIn, response.getOutputStream());
        }

        // Удаляем временный файл
        Files.deleteIfExists(Paths.get(fileName));
    }
}
