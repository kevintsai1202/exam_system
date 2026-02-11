# ====================================
# 即時互動測驗系統 - Multi-stage Dockerfile
# ====================================

# --- Stage 1: 建置前端 ---
FROM node:20-alpine AS frontend-build
WORKDIR /app

# 建立前端 build 輸出目標目錄（vite.config.ts 指向此路徑）
RUN mkdir -p exam-system-backend/src/main/resources/static

COPY exam-system-frontend/package.json ./exam-system-frontend/
WORKDIR /app/exam-system-frontend
RUN npm install --legacy-peer-deps && npm install --legacy-peer-deps prop-types
COPY exam-system-frontend/ .
RUN npm run build

# --- Stage 2: 建置後端 ---
FROM maven:3.9-eclipse-temurin-21-alpine AS backend-build
WORKDIR /app/exam-system-backend

# 先複製 pom.xml 下載依賴（利用 Docker layer cache）
COPY exam-system-backend/pom.xml .
RUN mvn dependency:go-offline -B

# 複製後端原始碼
COPY exam-system-backend/src ./src

# 將前端建置產物複製到 resources/static
COPY --from=frontend-build /app/exam-system-backend/src/main/resources/static ./src/main/resources/static

# 打包 JAR（跳過測試）
RUN mvn package -DskipTests

# --- Stage 3: 執行 ---
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN mkdir -p /app/data

COPY --from=backend-build /app/exam-system-backend/target/exam-system-1.0.0.jar /app/exam-system.jar

EXPOSE 8080

ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", \
    "/app/exam-system.jar"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

VOLUME ["/app/data"]
