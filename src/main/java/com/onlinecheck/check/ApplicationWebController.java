package com.onlinecheck.check;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Controller
@RequestMapping("/applications")
public class ApplicationWebController {

    @Autowired
    private ApplicationRepository applicationRepository;

    @ModelAttribute
    public void addCommonAttributes(Model model) {
        // Загружаем только последние 20 заявок для сайдбара
        List<Application> recentApplications = applicationRepository.findRecentApplications(20);
        model.addAttribute("recentApplications", recentApplications);
        model.addAttribute("today", LocalDate.now().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
    }

    @GetMapping
    public String showForm(Model model) {
        if (!model.containsAttribute("application")) {
            model.addAttribute("application", new Application());
        }
        return "applications";
    }

    @PostMapping("/search")
    public String searchApplication(@RequestParam String number, Model model) {
        Application app = applicationRepository.findByApplicationNumber(number);

        if (app != null) {
            model.addAttribute("application", app);
            model.addAttribute("message", "Заявка найдена");
        } else {
            Application newApp = new Application();
            newApp.setApplicationNumber(number);
            model.addAttribute("application", newApp);
            model.addAttribute("error", "Заявка не найдена. Создайте новую.");
        }

        return "applications";
    }

    @PostMapping("/save")
    public String saveApplication(@ModelAttribute Application application, Model model) {
        try {
            // Проверяем уникальность номера
            Application existing = applicationRepository.findByApplicationNumber(application.getApplicationNumber());

            if (existing != null && !existing.getId().equals(application.getId())) {
                model.addAttribute("error", "Заявка с номером " + application.getApplicationNumber() + " уже существует!");
                model.addAttribute("application", application);
                return "applications";
            }

            // Сохраняем заявку (косяки уже в поле comments)
            applicationRepository.save(application);

            model.addAttribute("success", "Заявка сохранена успешно!");
            model.addAttribute("application", application);

        } catch (Exception e) {
            model.addAttribute("error", "Ошибка: " + e.getMessage());
            model.addAttribute("application", application);
        }

        return "applications";
    }

    @GetMapping("/load/{id}")
    public String loadApplication(@PathVariable Long id, Model model) {
        return applicationRepository.findById(id)
                .map(app -> {
                    model.addAttribute("application", app);
                    model.addAttribute("message", "Заявка загружена");
                    return "applications";
                })
                .orElseGet(() -> {
                    model.addAttribute("error", "Заявка не найдена");
                    model.addAttribute("application", new Application());
                    return "applications";
                });
    }

    @GetMapping("/clear")
    public String clearForm() {
        return "redirect:/applications";
    }

    @PostMapping("/delete/{id}")
    public String deleteApplication(@PathVariable Long id, Model model) {
        try {
            if (applicationRepository.existsById(id)) {
                applicationRepository.deleteById(id);
                model.addAttribute("success", "Заявка удалена!");
            } else {
                model.addAttribute("error", "Заявка не найдена");
            }
        } catch (Exception e) {
            model.addAttribute("error", "Ошибка при удалении: " + e.getMessage());
        }

        model.addAttribute("application", new Application());
        return "applications";
    }

    // Новый метод для тестирования - добавление тестовых данных
    @GetMapping("/add-test-data")
    public String addTestData() {
        try {
            // Создаем несколько тестовых заявок
            for (int i = 1; i <= 5; i++) {
                Application app = new Application();
                app.setApplicationNumber("24-00" + i + "00");
                app.setEngineer("Инженер " + i);
                app.setGsmLevel("-75 dB");
                app.setInternetLevel("Хороший");
                app.setMpkInstalled(true);
                app.setHighCeiling(i % 2 == 0);
                app.setResolution(i % 2 == 0);
                app.setInstallationDate(LocalDate.now().minusDays(i).format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
                app.setInspector("Проверяющий " + i);
                app.setComments("Тестовый комментарий " + i);

                applicationRepository.save(app);
            }
            return "redirect:/applications?success=Тестовые данные добавлены";
        } catch (Exception e) {
            return "redirect:/applications?error=" + e.getMessage();
        }
    }
}