# env-java21.ps1
# 即時互動測驗系統 - Java 21 環境設定腳本
# 使用方式: . .\env-java21.ps1

param(
    [string]$JavaHome = "C:\java\jdk-23"
)

# 設定環境變數
$env:JAVA_HOME = $JavaHome
$env:PATH = "$JavaHome\bin;$env:PATH"

# 顯示資訊
Write-Host "`n=== Java 環境設定 ===" -ForegroundColor Cyan
Write-Host "JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
Write-Host "`n=== Java 版本 ===" -ForegroundColor Cyan
java -version

Write-Host "`n環境變數已設定完成！您現在可以執行以下指令：" -ForegroundColor Green
Write-Host "  後端編譯: cd exam-system-backend && mvn clean compile" -ForegroundColor Yellow
Write-Host "  後端啟動: cd exam-system-backend && mvn spring-boot:run" -ForegroundColor Yellow
Write-Host "  後端測試: cd exam-system-backend && mvn test" -ForegroundColor Yellow
Write-Host ""
