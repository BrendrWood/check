package com.onlinecheck.check;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;


/* магия Spring Data JPA. Внутри формируются SQL-запросы к БД
findBy --> Найти
findAllBy --> Найти все
countBy --> Посчитать
deleteBy --> Удалить
existsBy --> Проверить существование*/

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    Application findByApplicationNumber(String applicationNumber);

    // Поиск заявок, измененных сегодня (JPQL не SQL)
    @Query("SELECT a FROM Application a WHERE a.lastUpdated >= :startOfDay")
    List<Application> findApplicationsUpdatedToday(LocalDateTime startOfDay);
}