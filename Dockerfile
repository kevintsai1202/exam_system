# ====================================
# 即時互動測驗系統 - Docker 映像檔
# ====================================

# 使用 Eclipse Temurin JDK 21 作為基礎映像（官方推薦的 OpenJDK 發行版）
FROM eclipse-temurin:21-jre-alpine

# 設定維護者資訊
LABEL maintainer="exam-system"
LABEL description="即時互動測驗系統 - Exam System"
LABEL version="1.0.0"

# 設定工作目錄
WORKDIR /app

# 建立資料目錄（用於 H2 資料庫）
RUN mkdir -p /app/data

# 複製 JAR 檔案到容器
COPY target/exam-system-1.0.0.jar /app/exam-system.jar

# 設定容器啟動時執行的命令
# -Djava.security.egd=file:/dev/./urandom 加快啟動速度
# -Dserver.port=80 設定應用程式使用 80 端口
# -Dspring.profiles.active=prod 使用生產環境配置（如需要）
ENTRYPOINT ["java", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-Dserver.port=80", \
    "-jar", \
    "/app/exam-system.jar"]

# 暴露端口
EXPOSE 80

# 設定健康檢查
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:80/actuator/health || exit 1

# 掛載資料卷（用於持久化資料庫）
VOLUME ["/app/data"]
