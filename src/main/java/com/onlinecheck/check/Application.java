package com.onlinecheck.check;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/*
 * ================================================
 * КЛАСС APPLICATION - ОПИСАНИЕ
 * ================================================
 *
 * Это "форма/шаблон" для одной заявки в системе.
 * Каждый объект этого класса = одна строка в таблице БД.
 */

@Entity

@Table(name = "applications", uniqueConstraints = {
        @UniqueConstraint(columnNames = "applicationNumber") // Номер заявки ДОЛЖЕН быть уникальным
}, indexes = {
        @Index(name = "idx_app_number", columnList = "applicationNumber"),      // Быстрый поиск по номеру
        @Index(name = "idx_last_updated", columnList = "lastUpdated DESC"),     // Сортировка по дате (новые первые)
        @Index(name = "idx_engineer", columnList = "engineer"),                 // Поиск по инженеру
        @Index(name = "idx_resolution", columnList = "resolution"),             // Фильтр OK/NOK
        @Index(name = "idx_installation_date", columnList = "installationDate") // Поиск по дате монтажа
})
public class Application {

    // ================================================
    // ПОЛЯ КЛАССА (СТОЛБЦЫ В ТАБЛИЦЕ БД)
    // ================================================

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Уникальный номер заявки в системе (не путать с applicationNumber!)

    // ОБЫЧНЫЕ ПОЛЯ - станут обычными столбцами в таблице
    private String applicationNumber; // Номер заявки (например, "24-123456")
    private String engineer;          // ФИО инженера, который делал монтаж
    private String gsmLevel;          // Уровень сигнала GSM (например, "-75 dB")
    private String internetLevel;     // Уровень интернета
    private String internetReason;    // Почему не подключен интернет

    // ПОЛЯ ТИПА boolean
    private boolean mpkInstalled;       // МПК установлен? (да/нет)
    private boolean highCeiling;        // Высокий потолок? (да/нет)
    private boolean sensorConnectLevel; // Фото уровня связи датчиков приложено? (да/нет)
    private boolean animals;            // Есть животные/пылесос? (да/нет)
    private boolean nightMode;          // Ночной режим проверен? (да/нет)
    private boolean sensorsOk;          // Датчики установлены по экспертизе? (да/нет)
    private boolean label;              // Наклейка наклеена? (да/нет)
    private boolean avr;                // Акт работ подписан? (да/нет)
    private boolean systemPhoto;        // Фото системы есть? (да/нет)
    private boolean floorPlan;          // Поэтажный план есть? (да/нет)
    private boolean secondForm;         // Форма 002 заполнена? (да/нет)
    private boolean docs;               // ПУД и договор есть? (да/нет)
    private boolean roadMap;            // Схема подъездных путей есть? (да/нет)
    private boolean publicName;         // Публичное наименование соответствует? (да/нет)
    private boolean checkList;          // Чек-лист приложен? (да/нет)

    private String installationDate;    // Дата монтажа (например, "15.12.2024")
    private String inspector;           // Кто проверял заявку

    @Column(length = 2000)
    private String comments; // Комментарии/замечания по заявке

    private boolean resolution; // Резолюция проверки: true=OK, false=NOK

    @Column(name = "last_updated", updatable = true)
    private LocalDateTime lastUpdated; // Когда заявку последний раз меняли

    // ================================================
    // МЕТОДЫ ДЛЯ АВТОМАТИЧЕСКИХ ДЕЙСТВИЙ
    // ================================================

    @PrePersist  // ВЫЗЫВАЕТСЯ ПЕРЕД СОХРАНЕНИЕМ НОВОЙ ЗАЯВКИ
    @PreUpdate   // ВЫЗЫВАЕТСЯ ПЕРЕД ОБНОВЛЕНИЕМ СУЩЕСТВУЮЩЕЙ ЗАЯВКИ
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    // ================================================
    // ГЕТТЕРЫ И СЕТТЕРЫ (GETTERS & SETTERS)
    // ================================================

    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }

    public String getApplicationNumber() {
        return applicationNumber;
    }
    public void setApplicationNumber(String applicationNumber) {
        this.applicationNumber = applicationNumber;
    }

    public String getEngineer() {
        return engineer;
    }
    public void setEngineer(String engineer) {
        this.engineer = engineer;
    }

    public String getGsmLevel() {
        return gsmLevel;
    }
    public void setGsmLevel(String gsmLevel) {
        this.gsmLevel = gsmLevel;
    }

    public String getInternetLevel() {
        return internetLevel;
    }
    public void setInternetLevel(String internetLevel) {
        this.internetLevel = internetLevel;
    }

    public String getInternetReason() {
        return internetReason;
    }
    public void setInternetReason(String internetReason) {
        this.internetReason = internetReason;
    }

    public boolean isMpkInstalled() {
        return mpkInstalled;
    }
    public void setMpkInstalled(boolean mpkInstalled) {
        this.mpkInstalled = mpkInstalled;
    }

    public boolean isHighCeiling() {
        return highCeiling;
    }
    public void setHighCeiling(boolean highCeiling) {
        this.highCeiling = highCeiling;
    }

    public boolean isSensorConnectLevel() {
        return sensorConnectLevel;
    }
    public void setSensorConnectLevel(boolean sensorConnectLevel) {
        this.sensorConnectLevel = sensorConnectLevel;
    }

    public boolean isAnimals() {
        return animals;
    }
    public void setAnimals(boolean animals) {
        this.animals = animals;
    }

    public boolean isNightMode() {
        return nightMode;
    }
    public void setNightMode(boolean nightMode) {
        this.nightMode = nightMode;
    }

    public boolean isSensorsOk() {
        return sensorsOk;
    }
    public void setSensorsOk(boolean sensorsOk) {
        this.sensorsOk = sensorsOk;
    }

    public boolean isLabel() {
        return label;
    }
    public void setLabel(boolean label) {
        this.label = label;
    }

    public boolean isAvr() {
        return avr;
    }
    public void setAvr(boolean avr) {
        this.avr = avr;
    }

    public boolean isSystemPhoto() {
        return systemPhoto;
    }
    public void setSystemPhoto(boolean systemPhoto) {
        this.systemPhoto = systemPhoto;
    }

    public boolean isFloorPlan() {
        return floorPlan;
    }
    public void setFloorPlan(boolean floorPlan) {
        this.floorPlan = floorPlan;
    }

    public boolean isSecondForm() {
        return secondForm;
    }
    public void setSecondForm(boolean secondForm) {
        this.secondForm = secondForm;
    }

    public boolean isDocs() {
        return docs;
    }
    public void setDocs(boolean docs) {
        this.docs = docs;
    }

    public boolean isRoadMap() {
        return roadMap;
    }
    public void setRoadMap(boolean roadMap) {
        this.roadMap = roadMap;
    }

    public boolean isPublicName() {
        return publicName;
    }
    public void setPublicName(boolean publicName) {
        this.publicName = publicName;
    }

    public boolean isCheckList() {
        return checkList;
    }
    public void setCheckList(boolean checkList) {
        this.checkList = checkList;
    }

    public String getInstallationDate() {
        return installationDate;
    }
    public void setInstallationDate(String installationDate) {
        this.installationDate = installationDate;
    }

    public String getInspector() {
        return inspector;
    }
    public void setInspector(String inspector) {
        this.inspector = inspector;
    }

    public String getComments() {
        return comments;
    }
    public void setComments(String comments) {
        this.comments = comments;
    }

    public boolean isResolution() {
        return resolution;
    }
    public void setResolution(boolean resolution) {
        this.resolution = resolution;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }
    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    // ================================================
    // МЕТОД toString() - ДЛЯ ОТЛАДКИ
    // ================================================

    @Override
    public String toString() {
        return "Application{" +
                "id=" + id +
                ", applicationNumber='" + applicationNumber + '\'' +
                ", engineer='" + engineer + '\'' +
                ", resolution=" + resolution +
                ", lastUpdated=" + lastUpdated +
                '}';
    }
}