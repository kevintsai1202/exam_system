@echo off
chcp 65001 > nul
REM ====================================
REM 即時互動測驗系統 - Docker 構建腳本
REM ====================================

echo.
echo ====================================
echo   即時互動測驗系統 - Docker 構建工具
echo   Exam System Docker Builder
echo ====================================
echo.

set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%exam-system-backend

REM 檢查 Docker 是否安裝
echo [步驟 1/4] 檢查 Docker 環境...
docker --version > nul 2>&1
if errorlevel 1 (
    echo [錯誤] 未安裝 Docker 或 Docker 未啟動
    echo 請先安裝 Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)
docker --version
echo [成功] Docker 環境正常
echo.

REM 檢查 JAR 檔案
echo [步驟 2/4] 檢查 JAR 檔案...
if not exist "%BACKEND_DIR%\target\exam-system-1.0.0.jar" (
    echo [錯誤] 找不到 JAR 檔案
    echo 正在執行打包...
    cd "%BACKEND_DIR%"
    call mvn clean package -DskipTests
    if errorlevel 1 (
        echo [錯誤] Maven 打包失敗
        pause
        exit /b 1
    )
    cd "%PROJECT_ROOT%"
)
echo [成功] JAR 檔案存在
echo.

REM 構建 Docker 映像
echo [步驟 3/4] 構建 Docker 映像...
echo 這可能需要幾分鐘時間...
cd "%BACKEND_DIR%"
docker build -t exam-system:1.0.0 -t exam-system:latest .
if errorlevel 1 (
    echo [錯誤] Docker 映像構建失敗
    cd "%PROJECT_ROOT%"
    pause
    exit /b 1
)
cd "%PROJECT_ROOT%"
echo [成功] Docker 映像構建完成
echo.

REM 顯示映像資訊
echo [步驟 4/4] 映像資訊...
docker images exam-system
echo.

echo ====================================
echo   構建完成！
echo ====================================
echo.
echo 映像標籤:
echo   - exam-system:1.0.0
echo   - exam-system:latest
echo.
echo 後續操作:
echo.
echo 【方法一】使用 Docker 指令啟動:
echo   docker run -d -p 80:80 --name exam-system exam-system:latest
echo.
echo 【方法二】使用 Docker Compose 啟動:
echo   docker-compose up -d
echo.
echo 【查看容器】:
echo   docker ps
echo.
echo 【查看日誌】:
echo   docker logs -f exam-system
echo.
echo 【停止容器】:
echo   docker stop exam-system
echo.
echo 【匯出映像】（用於部署到其他伺服器）:
echo   docker save exam-system:1.0.0 -o exam-system.tar
echo.
echo ====================================
pause
