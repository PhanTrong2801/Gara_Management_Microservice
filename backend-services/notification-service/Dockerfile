# Stage 1: Sử dụng Maven Image để build file JAR
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy file cấu hình maven và mã nguồn vào container
COPY pom.xml .
COPY src ./src

# Build project và bỏ qua chạy test để tiết kiệm thời gian
RUN mvn clean package -DskipTests

# Stage 2: Sử dụng JRE siêu nhẹ để chạy ứng dụng thương mại
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy file JAR đã được build từ Stage 1 sang Stage 2
COPY --from=build /app/target/*.jar app.jar

# Giới hạn bộ nhớ RAM tối đa cho Java (256MB) để bảo vệ RAM máy cá nhân
ENV JAVA_OPTS="-Xmx256m -Xms128m"

# Lệnh khởi chạy ứng dụng
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
