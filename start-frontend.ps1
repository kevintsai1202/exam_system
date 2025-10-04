# start-frontend.ps1
# 啟動前端開發服務器腳本

Write-Host "`n=== 即時互動測驗系統 - 前端服務啟動 ===" -ForegroundColor Cyan

# 進入前端目錄
Write-Host "`n[1/2] 進入前端目錄..." -ForegroundColor Yellow
Set-Location -Path "exam-system-frontend"

# 啟動 Vite
Write-Host "`n[2/2] 啟動 Vite 開發服務器..." -ForegroundColor Yellow
Write-Host "前端服務將在 http://localhost:5173 啟動" -ForegroundColor Green
Write-Host "`n按 Ctrl+C 停止服務`n" -ForegroundColor Red

npm run dev
