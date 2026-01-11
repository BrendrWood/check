package com.onlinecheck.check;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.FileOutputStream;
import java.util.List;

@Service
public class ExelService {

    public void exportToExcel(List<Application> applications) throws Exception {
        // Проверка на пустой список
        if (applications == null || applications.isEmpty()) {
            throw new IllegalArgumentException("Нет данных для экспорта");
        }
        exportToExcel(applications, "applications.xlsx");
    }

    public void exportToExcel(List<Application> applications, String fileName) throws Exception {
        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Заявки");

        // Создаем панель закрепления (freeze pane) - закрепляем первую строку
        sheet.createFreezePane(0, 1, 0, 1);

        // Создаем стили
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle booleanStyle = createBooleanStyle(workbook);
        CellStyle centerStyle = createCenterStyle(workbook);
        CellStyle wrapStyle = createWrapStyle(workbook);
        CellStyle resolutionStyle = createResolutionStyle(workbook);
        CellStyle engineerCellStyle = createEngineerCellStyle(workbook);

        // Создаем заголовки столбцов
        Row headerRow = sheet.createRow(0);
        String[] headers = {
                "Номер заявки",
                "Инженер",
                "Уровень GSM",
                "Интернет",
                "Причина, по которой не подключен интернет",
                "МПК",
                "Высокий потолок",
                "Уровень связи датчиков с КП",
                "Животные или пылесос",
                "Ночной режим",
                "Датчики по экспертизе",
                "Наклейка",
                "Акт работ",
                "Фото объекта, КП, КЛ, СИМ",
                "Поэтажный план",
                "Форма 002",
                "ПУД и договор",
                "Подъездные пути",
                "Публичное имя",
                "Чек-лист",
                "Дата монтажа",
                "Проверяющий",
                "Комментарии",
                "Резолюция"
        };

        // Заполняем заголовки
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle); // Все заголовки серые
        }

        // Добавляем данные
        int rowNum = 1;
        for (Application app : applications) {
            Row row = sheet.createRow(rowNum++);

            // Основные данные (строки)
            createCell(row, 0, app.getApplicationNumber(), centerStyle);
            createCell(row, 1, app.getEngineer(), engineerCellStyle);
            createCell(row, 2, app.getGsmLevel(), centerStyle);
            createCell(row, 3, app.getInternetLevel(), centerStyle);
            createCell(row, 4, app.getInternetReason(), wrapStyle);

            // Булевые поля - преобразуем в "да"/"нет"
            createBooleanCell(row, 5, app.isMpkInstalled(), booleanStyle);
            createBooleanCell(row, 6, app.isHighCeiling(), booleanStyle);
            createBooleanCell(row, 7, app.isSensorConnectLevel(), booleanStyle);
            createBooleanCell(row, 8, app.isAnimals(), booleanStyle);
            createBooleanCell(row, 9, app.isNightMode(), booleanStyle);
            createBooleanCell(row, 10, app.isSensorsOk(), booleanStyle);
            createBooleanCell(row, 11, app.isLabel(), booleanStyle);
            createBooleanCell(row, 12, app.isAvr(), booleanStyle);
            createBooleanCell(row, 13, app.isSystemPhoto(), booleanStyle);
            createBooleanCell(row, 14, app.isFloorPlan(), booleanStyle);
            createBooleanCell(row, 15, app.isSecondForm(), booleanStyle);
            createBooleanCell(row, 16, app.isDocs(), booleanStyle);
            createBooleanCell(row, 17, app.isRoadMap(), booleanStyle);
            createBooleanCell(row, 18, app.isPublicName(), booleanStyle);
            createBooleanCell(row, 19, app.isCheckList(), booleanStyle);

            // Остальные данные
            createCell(row, 20, app.getInstallationDate(), centerStyle);
            createCell(row, 21, app.getInspector(), centerStyle);
            createCell(row, 22, app.getComments(), wrapStyle);

            // Резолюция - преобразуем в "ок"/"нок"
            createResolutionCell(row, 23, app.isResolution(), resolutionStyle);
        }

        // Устанавливаем фиксированные ширины для колонок
        // Булевые колонки (5-19, 23) - узкие
        sheet.setColumnWidth(5, 1500);   // МПК
        sheet.setColumnWidth(6, 1500);   // Высокий потолок
        sheet.setColumnWidth(7, 2500);   // Уровень связи датчиков с КП
        sheet.setColumnWidth(8, 2000);   // Животные или пылесос
        sheet.setColumnWidth(9, 1500);   // Ночной режим
        sheet.setColumnWidth(10, 2000);  // Датчики по экспертизе
        sheet.setColumnWidth(11, 1500);  // Наклейка
        sheet.setColumnWidth(12, 1500);  // Акт работ
        sheet.setColumnWidth(13, 1500);  // Фото объекта
        sheet.setColumnWidth(14, 1500);  // Поэтажный план
        sheet.setColumnWidth(15, 1500);  // Форма 002
        sheet.setColumnWidth(16, 1500);  // ПУД и договор
        sheet.setColumnWidth(17, 1800);  // Подъездные пути
        sheet.setColumnWidth(18, 1500);  // Публичное имя
        sheet.setColumnWidth(19, 1500);  // Чек-лист

        // Резолюция
        sheet.setColumnWidth(23, 1500);  // Резолюция

        // Основные колонки - шире
        sheet.setColumnWidth(0, 2500);   // Номер заявки
        sheet.setColumnWidth(1, 7000);   // Инженер
        sheet.setColumnWidth(2, 2000);   // Уровень GSM
        sheet.setColumnWidth(3, 2000);   // Интернет
        sheet.setColumnWidth(4, 6000);   // Причина
        sheet.setColumnWidth(20, 2500);  // Дата монтажа
        sheet.setColumnWidth(21, 3500);  // Проверяющий
        sheet.setColumnWidth(22, 8000);  // Комментарии

        // Устанавливаем высоту строки для заголовков
        headerRow.setHeight((short)600); // Фиксированная высота для заголовков

        // Сохранить файл Excel
        try (FileOutputStream fileOut = new FileOutputStream(fileName)){
            workbook.write(fileOut);
        }
        workbook.close();
    }

    // Метод для создания обычной ячейки
    private void createCell(Row row, int column, String value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null && !value.trim().isEmpty()) {
            cell.setCellValue(value);
        } else {
            cell.setCellValue("");
        }
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    // Метод для создания ячейки с булевым значением в виде "да"/"нет"
    private void createBooleanCell(Row row, int column, boolean value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value ? "да" : "нет");
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    // Метод для создания ячейки с резолюцией "ок"/"нок"
    private void createResolutionCell(Row row, int column, boolean value, CellStyle style) {
        Cell cell = row.createCell(column);
        cell.setCellValue(value ? "ок" : "нок");
        if (style != null) {
            cell.setCellStyle(style);
        }
    }

    // Стиль для заголовков - обычный (серый)
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 9);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setWrapText(true);
        return style;
    }

    // Стиль для булевых ячеек - компактный
    private CellStyle createBooleanStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setFontHeightInPoints((short) 10);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    // Стиль для резолюции - выделенный
    private CellStyle createResolutionStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.MEDIUM);
        style.setBorderTop(BorderStyle.MEDIUM);
        style.setBorderLeft(BorderStyle.MEDIUM);
        style.setBorderRight(BorderStyle.MEDIUM);
        return style;
    }

    // Стиль для центрированных ячеек
    private CellStyle createCenterStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    // Стиль для ячеек с переносом текста
    private CellStyle createWrapStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setWrapText(true);
        style.setVerticalAlignment(VerticalAlignment.TOP);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    // Стиль для ячейки инженера - выравнивание по левому краю
    private CellStyle createEngineerCellStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.LEFT);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setWrapText(true);
        return style;
    }
}