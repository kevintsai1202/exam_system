@echo off
chcp 65001 > nul
REM ====================================
REM 即時互動測驗系統 - 啟動腳本
REM ====================================

echo.
echo ====================================
echo   即時互動測驗系統
echo   Exam System v1.0.0
echo ====================================
echo.

REM 設定 Java 21 路徑
set JAVA_HOME=D:\java\jdk-21
set PATH=%JAVA_HOME%\bin;%PATH%

REM 顯示 Java 版本
echo 檢查 Java 版本...
java -version
echo.

REM 檢查 JAR 檔案是否存在
if not exist "target\exam-system-1.0.0.jar" (
    echo [錯誤] 找不到 JAR 檔案: target\exam-system-1.0.0.jar
    echo 請先執行打包指令: mvn clean package -DskipTests
    echo.
    pause
    exit /b 1
)

echo 啟動應用程式...
echo JAR 檔案: target\exam-system-1.0.0.jar
echo 伺服器位址: http://localhost:8080
echo.
echo 按 Ctrl+C 可停止伺服器
echo ====================================
echo.

REM 執行 JAR 檔案
java -jar target\exam-system-1.0.0.jar

REM 如果執行失敗，暫停以便查看錯誤訊息
if errorlevel 1 (
    echo.
    echo [錯誤] 應用程式執行失敗
    pause
)
