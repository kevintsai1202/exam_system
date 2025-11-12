# Docker 部署指南

即時互動測驗系統 - Docker 部署完整說明文件

## 目錄結構

```
exam_system/
├── docker-compose.yml          # Docker Compose 配置
├── docker-build.bat            # Docker 構建腳本（Windows）
├── DOCKER_DEPLOYMENT.md        # 本說明文件
└── exam-system-backend/
    ├── Dockerfile              # Docker 映像定義
    ├── .dockerignore          # Docker 忽略文件
    └── target/
        └── exam-system-1.0.0.jar
```

## 前置需求

### 1. 安裝 Docker

**Windows**:
- 下載並安裝 [Docker Desktop](https://www.docker.com/products/docker-desktop)
- 啟動 Docker Desktop
- 驗證安裝: `docker --version`

**Linux**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io docker-compose

# 啟動 Docker 服務
sudo systemctl start docker
sudo systemctl enable docker

# 將當前用戶加入 docker 群組
sudo usermod -aG docker $USER
```

### 2. 確保已打包 JAR

```bash
cd exam-system-backend
mvn clean package -DskipTests
```

## 構建 Docker 映像

### 方法一：使用自動化腳本（Windows）

```cmd
docker-build.bat
```

### 方法二：手動構建

```bash
# 進入後端目錄
cd exam-system-backend

# 構建映像
docker build -t exam-system:1.0.0 -t exam-system:latest .

# 查看構建的映像
docker images exam-system
```

## 啟動應用

### 方法一：使用 Docker Compose（推薦）

```bash
# 啟動服務（背景執行）
docker-compose up -d

# 查看日誌
docker-compose logs -f

# 停止服務
docker-compose down

# 停止並刪除資料卷
docker-compose down -v
```

### 方法二：使用 Docker 指令

```bash
# 基本啟動
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  exam-system:latest

# 進階啟動（含資料持久化和環境變數）
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  -v exam-data:/app/data \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e TZ=Asia/Taipei \
  --restart unless-stopped \
  exam-system:latest
```

## 訪問應用

啟動後，透過以下網址訪問：

- **首頁**: http://localhost:8080
- **講師控制台**: http://localhost:8080/instructor
- **學員加入**: http://localhost:8080/student/join
- **H2 資料庫**: http://localhost:8080/h2-console

## 常用管理指令

### 查看容器狀態

```bash
# 列出運行中的容器
docker ps

# 列出所有容器（包含停止的）
docker ps -a

# 查看容器詳細資訊
docker inspect exam-system
```

### 查看日誌

```bash
# 查看即時日誌
docker logs -f exam-system

# 查看最後 100 行日誌
docker logs --tail 100 exam-system

# 查看指定時間的日誌
docker logs --since 30m exam-system
```

### 進入容器

```bash
# 進入容器 shell
docker exec -it exam-system sh

# 查看容器內檔案
docker exec exam-system ls -la /app
```

### 停止和刪除

```bash
# 停止容器
docker stop exam-system

# 啟動已停止的容器
docker start exam-system

# 重啟容器
docker restart exam-system

# 刪除容器
docker rm exam-system

# 強制刪除運行中的容器
docker rm -f exam-system
```

### 映像管理

```bash
# 列出所有映像
docker images

# 刪除映像
docker rmi exam-system:1.0.0

# 清理未使用的映像
docker image prune
```

## 資料持久化

Docker 容器使用資料卷（Volume）來持久化 H2 資料庫：

```bash
# 查看資料卷
docker volume ls

# 查看資料卷詳細資訊
docker volume inspect exam-data

# 備份資料卷
docker run --rm -v exam-data:/source -v $(pwd):/backup alpine tar czf /backup/exam-data-backup.tar.gz -C /source .

# 還原資料卷
docker run --rm -v exam-data:/target -v $(pwd):/backup alpine tar xzf /backup/exam-data-backup.tar.gz -C /target
```

## 部署到其他伺服器

### 方法一：匯出/匯入映像

**在本機匯出映像**:
```bash
docker save exam-system:1.0.0 -o exam-system.tar
```

**傳輸到目標伺服器** (使用 scp 或其他方式):
```bash
scp exam-system.tar user@server:/tmp/
```

**在目標伺服器匯入映像**:
```bash
docker load -i /tmp/exam-system.tar
```

**啟動容器**:
```bash
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  -v exam-data:/app/data \
  --restart unless-stopped \
  exam-system:1.0.0
```

### 方法二：使用 Docker Registry

**推送到 Docker Hub**:
```bash
# 登入 Docker Hub
docker login

# 標記映像
docker tag exam-system:1.0.0 yourusername/exam-system:1.0.0

# 推送映像
docker push yourusername/exam-system:1.0.0
```

**在目標伺服器拉取**:
```bash
docker pull yourusername/exam-system:1.0.0
docker run -d --name exam-system -p 8080:8080 yourusername/exam-system:1.0.0
```

### 方法三：使用私有 Registry

**建立私有 Registry**:
```bash
docker run -d -p 5000:5000 --name registry registry:2
```

**推送到私有 Registry**:
```bash
docker tag exam-system:1.0.0 localhost:5000/exam-system:1.0.0
docker push localhost:5000/exam-system:1.0.0
```

## 環境變數配置

可以透過環境變數自訂應用行為：

```bash
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  -e SERVER_PORT=8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e TZ=Asia/Taipei \
  -e SPRING_DATASOURCE_URL=jdbc:h2:file:/app/data/examdb \
  exam-system:latest
```

## 健康檢查

容器內建健康檢查機制：

```bash
# 查看健康狀態
docker inspect --format='{{.State.Health.Status}}' exam-system

# 查看健康檢查日誌
docker inspect --format='{{json .State.Health}}' exam-system | jq
```

## 資源限制

### 使用 Docker Run

```bash
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  --memory="1g" \
  --cpus="2" \
  exam-system:latest
```

### 使用 Docker Compose

已在 `docker-compose.yml` 中配置資源限制。

## 日誌管理

### 配置日誌驅動

```bash
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  --log-driver json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  exam-system:latest
```

### 查看日誌配置

```bash
docker inspect --format='{{.HostConfig.LogConfig}}' exam-system
```

## 故障排除

### 容器無法啟動

```bash
# 查看容器日誌
docker logs exam-system

# 查看容器狀態
docker inspect exam-system

# 嘗試互動模式啟動
docker run -it --rm exam-system:latest
```

### Port 已被佔用

```bash
# 查看 Port 佔用情況
netstat -ano | findstr :8080  # Windows
lsof -i :8080                  # Linux/Mac

# 使用不同的 Port
docker run -d --name exam-system -p 9090:8080 exam-system:latest
```

### 資料庫問題

```bash
# 進入容器檢查資料庫檔案
docker exec -it exam-system sh
ls -la /app/data

# 刪除並重建資料卷
docker-compose down -v
docker-compose up -d
```

## 效能優化

### 1. 使用更小的基礎映像

Dockerfile 已使用 `eclipse-temurin:21-jre-alpine`（約 180 MB）

### 2. 多階段構建（可選）

如需包含 Maven 構建步驟，可修改 Dockerfile：

```dockerfile
# 階段一：構建
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /build
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# 階段二：運行
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /build/target/exam-system-1.0.0.jar /app/exam-system.jar
ENTRYPOINT ["java", "-jar", "/app/exam-system.jar"]
EXPOSE 8080
```

### 3. 優化 JVM 參數

```bash
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  -e JAVA_OPTS="-Xms512m -Xmx1g -XX:+UseG1GC" \
  exam-system:latest
```

## 安全建議

1. **不要以 root 身份運行**（可在 Dockerfile 中添加）
2. **使用網路隔離**（Docker network）
3. **定期更新基礎映像**
4. **掃描映像漏洞**: `docker scan exam-system:latest`
5. **使用 secrets 管理敏感資訊**

## 監控和告警

### 使用 Docker Stats

```bash
# 即時查看容器資源使用
docker stats exam-system
```

### 整合監控工具

- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog / New Relic

## 備份策略

**自動化備份腳本**:

```bash
#!/bin/bash
# backup.sh
BACKUP_DIR=/backup/exam-system
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 備份資料卷
docker run --rm \
  -v exam-data:/source \
  -v $BACKUP_DIR:/backup \
  alpine tar czf /backup/exam-data-$TIMESTAMP.tar.gz -C /source .

# 保留最近 7 天的備份
find $BACKUP_DIR -name "exam-data-*.tar.gz" -mtime +7 -delete
```

## 更新部署

```bash
# 1. 構建新版本映像
docker build -t exam-system:1.0.1 .

# 2. 停止舊容器
docker stop exam-system

# 3. 備份資料（可選）
docker run --rm -v exam-data:/source -v $(pwd):/backup alpine tar czf /backup/backup.tar.gz -C /source .

# 4. 刪除舊容器
docker rm exam-system

# 5. 啟動新容器
docker run -d \
  --name exam-system \
  -p 8080:8080 \
  -v exam-data:/app/data \
  --restart unless-stopped \
  exam-system:1.0.1

# 6. 驗證新版本
docker logs -f exam-system
```

## 生產環境檢查清單

- [ ] 已測試 Docker 映像
- [ ] 已配置資料持久化
- [ ] 已設定健康檢查
- [ ] 已配置資源限制
- [ ] 已設定日誌管理
- [ ] 已配置備份策略
- [ ] 已設定監控告警
- [ ] 已配置重啟策略
- [ ] 已測試故障恢復
- [ ] 已準備回滾方案

## 聯絡資訊

如有問題，請參考專案文件或聯繫維護團隊。

---

**版本**: 1.0.0
**最後更新**: 2025-11-12
