package com.onlinecheck.check;

import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.FileInputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private ExelService exelService;

    // ============================================
    // CRUD ОПЕРАЦИИ ДЛЯ ЗАЯВОК
    // ============================================

    // GET: Получение всех заявок
    @GetMapping
    public List<Application> getAllApplications() {
        return applicationRepository.findAll();
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
                    existing.setCheckList(updatedApplication.isCheckList());

                    // Остальные поля
                    if (updatedApplication.getInstallationDate() != null) {
                        existing.setInstallationDate(updatedApplication.getInstallationDate());
                    }
                    if (updatedApplication.getInspector() != null) {
                        existing.setInspector(updatedApplication.getInspector());
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
    // ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ДЛЯ ЭКСПОРТА
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
}