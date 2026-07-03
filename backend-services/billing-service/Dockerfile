FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy trực tiếp file JAR đã build ở máy host vào container
COPY target/*.jar app.jar

# Giới hạn bộ nhớ RAM tối đa cho Java (256MB) để bảo vệ RAM máy cá nhân
ENV JAVA_OPTS="-Xmx256m -Xms128m"

# Lệnh khởi chạy ứng dụng
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
