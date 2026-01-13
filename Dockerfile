# Этап 1: Сборка
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

# Этап 2: Запуск
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/check-0.0.1-SNAPSHOT.jar app.jar

# Не устанавливайте профиль здесь, он будет установлен через переменные окружения
# ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
