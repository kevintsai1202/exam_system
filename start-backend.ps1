# start-backend.ps1
# 啟動後端服務腳本

param(
    [string]$JavaHome = "C:\java\jdk-23"
)

Write-Host "`n=== 即時互動測驗系統 - 後端服務啟動 ===" -ForegroundColor Cyan

# 設定 Java 環境
Write-Host "`n[1/3] 設定 Java 21 環境..." -ForegroundColor Yellow
$env:JAVA_HOME = $JavaHome
$env:PATH = "$JavaHome\bin;$env:PATH"

Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
java -version

# 進入後端目錄
Write-Host "`n[2/3] 進入後端目錄..." -ForegroundColor Yellow
Set-Location -Path "exam-system-backend"

# 啟動 Spring Boot
Write-Host "`n[3/3] 啟動 Spring Boot 應用程式..." -ForegroundColor Yellow
Write-Host "後端服務將在 http://localhost:8080 啟動" -ForegroundColor Green
Write-Host "H2 Console: http://localhost:8080/h2-console" -ForegroundColor Green
Write-Host "`n按 Ctrl+C 停止服務`n" -ForegroundColor Red

mvn spring-boot:run
