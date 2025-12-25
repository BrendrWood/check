package com.onlinecheck.check;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {

    // Поиск по номеру заявки
    Application findByApplicationNumber(String applicationNumber);

    // Поиск заявок, измененных сегодня (JPQL не SQL)
    @Query("SELECT a FROM Application a WHERE a.lastUpdated >= :startOfDay ORDER BY a.lastUpdated DESC")
    List<Application> findApplicationsUpdatedToday(LocalDateTime startOfDay);

    // Получить последние N заявок (нужно для фронтенда)
    @Query("SELECT a FROM Application a ORDER BY a.lastUpdated DESC")
    List<Application> findAllOrderByLastUpdatedDesc();

    // Получить последние N заявок (альтернативный вариант с лимитом)
    @Query(value = "SELECT * FROM applications ORDER BY last_updated DESC LIMIT :limit", nativeQuery = true)
    List<Application> findRecentApplications(@Param("limit") int limit);

    // Получить заявки за определенную дату
    @Query("SELECT a FROM Application a WHERE DATE(a.lastUpdated) = :date ORDER BY a.lastUpdated DESC")
    List<Application> findByDate(@Param("date") LocalDate date);

    // Получить уникальные даты с заявками
    @Query("SELECT DISTINCT DATE(a.lastUpdated) FROM Application a ORDER BY DATE(a.lastUpdated) DESC")
    List<LocalDate> findDistinctDates();

    // Получить заявки по диапазону дат
    @Query("SELECT a FROM Application a WHERE DATE(a.lastUpdated) BETWEEN :startDate AND :endDate ORDER BY a.lastUpdated DESC")
    List<Application> findByDateRange(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Поиск по инженеру
    List<Application> findByEngineerContainingIgnoreCase(String engineer);

    // Поиск по резолюции
    List<Application> findByResolution(boolean resolution);

    // Подсчет заявок по дате
    @Query("SELECT COUNT(a) FROM Application a WHERE DATE(a.lastUpdated) = :date")
    Long countByDate(@Param("date") LocalDate date);
}