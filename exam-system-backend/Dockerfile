FROM maven:3.9-eclipse-temurin-21-alpine AS builder
LABEL "language"="java"
LABEL "framework"="spring-boot"
WORKDIR /build

# 先拷貝 pom.xml 下載依賴，享受 Docker layer cache
COPY pom.xml .
RUN mvn dependency:go-offline -B || echo "部分依賴可能有問題，繼續"

# 拷貝並編譯整個 backend 目錄原始碼
COPY src ./src
RUN mvn clean package -DskipTests

# 第二階段：執行環境
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 將 build 完的 jar 拷貝過來
COPY --from=builder /build/target/exam-system-*.jar /app/exam-system.jar

# 建立後端使用到的資料儲存目錄
RUN mkdir -p /app/data

EXPOSE 8080

# 設定環境變數啟動時帶入 profile (可於 Zeabur 環境變數再行覆寫)
ENV SPRING_PROFILES_ACTIVE=docker

CMD ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "exam-system.jar"]
