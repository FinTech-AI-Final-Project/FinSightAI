# Multi-stage build for Spring Boot application
FROM maven:3.9.6-eclipse-temurin-17 AS build
# Set working directory
WORKDIR /app

# Copy pom.xml and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests

# Production stage
FROM openjdk:17-jre-slim

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy JAR file from build stage
COPY --from=build /app/target/finsight-ai-*.jar app.jar

# Copy configuration files
COPY src/main/resources/application-production.properties ./application-production.properties

# Change ownership to app user
RUN chown -R appuser:appuser /app

# Switch to app user
USER appuser

# Expose port
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8081/api/actuator/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "-Dspring.profiles.active=production", "app.jar"]
