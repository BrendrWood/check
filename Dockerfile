# Dockerfile
# Этап 1: Сборка
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Копируем pom.xml первым (для кэширования зависимостей)
COPY pom.xml .
RUN mvn dependency:go-offline

# Копируем исходный код
COPY src ./src

# Собираем проект
RUN mvn clean package -DskipTests

# Этап 2: Запуск
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Копируем JAR из этапа сборки
COPY --from=build /app/target/check-0.0.1-SNAPSHOT.jar app.jar

# Открываем порт
EXPOSE 8080

# Команда запуска
ENTRYPOINT ["java", "-jar", "app.jar"]
