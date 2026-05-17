# =====================================================
# run-e2e-docker.ps1
# 本機 Docker e2e 測試執行腳本
#
# 用途：
#   1. 用 docker-compose.yml 啟動 PostgreSQL + 後端
#   2. 等待後端 healthcheck 通過（Spring Boot 完全就緒）
#   3. 執行 Playwright e2e 測試
#   4. 顯示結果並視參數決定是否拆除 Docker 服務
#
# 使用方式：
#   scripts\run-e2e-docker.ps1           # 測試完保留容器（方便查看日誌）
#   scripts\run-e2e-docker.ps1 -TearDown # 測試完自動移除容器
#   scripts\run-e2e-docker.ps1 -RebuildImage # 強制重建 Docker image
# =====================================================

param(
    [switch]$TearDown,      # 測試後清除容器與 volumes
    [switch]$RebuildImage   # 強制重建後端 image（有程式碼變更時使用）
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "docker-compose.yml"
$FrontendDir = Join-Path $ProjectRoot "exam-system-frontend"

# ─── 步驟 1：確認前置工具 ───────────────────────────
Write-Host ""
Write-Host "=== [1/4] 環境確認 ===" -ForegroundColor Cyan
docker version --format "Docker: {{.Server.Version}}" 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker 未安裝或未啟動，請先啟動 Docker Desktop"
    exit 1
}

# ─── 步驟 2：啟動 Docker Compose ──────────────────────
Write-Host ""
Write-Host "=== [2/4] 啟動 Docker 服務 ===" -ForegroundColor Cyan

if ($RebuildImage) {
    Write-Host "強制重建 image..." -ForegroundColor Yellow
    docker compose -f $ComposeFile up -d --build db backend
} else {
    # 只啟動 db + backend，e2e 測試不需要 frontend / gateway
    docker compose -f $ComposeFile up -d db backend
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "docker compose up 失敗"
    exit 1
}

Write-Host "容器已啟動，等待後端就緒..." -ForegroundColor Yellow

# ─── 步驟 3：等待後端 healthcheck 通過 ────────────────
Write-Host ""
Write-Host "=== [3/4] 等待後端健康檢查 ===" -ForegroundColor Cyan

# 最多等待 180 秒（Spring Boot + Hibernate DDL 需要時間）
$maxWait = 180
$waited = 0
$interval = 10
$backendHealthy = $false

while ($waited -lt $maxWait) {
    Start-Sleep -Seconds $interval
    $waited += $interval

    # 查詢 Docker healthcheck 狀態
    $status = docker inspect --format="{{.State.Health.Status}}" exam_system_backend 2>&1
    Write-Host "[$waited s] backend 狀態: $status"

    if ($status -eq "healthy") {
        $backendHealthy = $true
        break
    }

    if ($status -eq "unhealthy") {
        Write-Host "後端 unhealthy，輸出最後 50 行日誌：" -ForegroundColor Red
        docker logs --tail 50 exam_system_backend
        break
    }
}

if (-not $backendHealthy) {
    Write-Host "" -ForegroundColor Red
    Write-Error "後端在 ${maxWait}s 內未通過健康檢查，終止測試。"
    Write-Host "可執行以下指令查看日誌：" -ForegroundColor Yellow
    Write-Host "  docker logs exam_system_backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "後端已就緒！" -ForegroundColor Green

# ─── 步驟 4：執行 Playwright e2e 測試 ─────────────────
Write-Host ""
Write-Host "=== [4/4] 執行 Playwright e2e 測試 ===" -ForegroundColor Cyan

Push-Location $FrontendDir
try {
    # 使用本地安裝的 playwright
    # nvm4w 環境下 node 可能不在 PATH，先嘗試 npm script，再嘗試絕對路徑
    $nvmNodePath = "d:\nvm4w\nodejs\node.exe"
    if (Get-Command node -ErrorAction SilentlyContinue) {
        node node_modules/@playwright/test/cli.js test
    } elseif (Test-Path $nvmNodePath) {
        & $nvmNodePath node_modules/@playwright/test/cli.js test
    } else {
        Write-Error "找不到 node 執行檔。請先執行 nvm use <version> 或確認 Node.js 已安裝在 PATH 中。"
        exit 1
    }
    $e2eExit = $LASTEXITCODE
} finally {
    Pop-Location
}

# ─── 結果摘要 ──────────────────────────────────────────
Write-Host ""
if ($e2eExit -eq 0) {
    Write-Host "✅ e2e 測試全部通過！" -ForegroundColor Green
} else {
    Write-Host "❌ 有測試失敗，請查看上方報告。" -ForegroundColor Red
    Write-Host "查看詳細報告：" -ForegroundColor Yellow
    Write-Host "  cd exam-system-frontend && node node_modules/@playwright/test/cli.js show-report" -ForegroundColor Yellow
}

# ─── 選擇性清理 ────────────────────────────────────────
if ($TearDown) {
    Write-Host ""
    Write-Host "清除 Docker 服務與 volumes..." -ForegroundColor Cyan
    docker compose -f $ComposeFile down -v
}

exit $e2eExit
