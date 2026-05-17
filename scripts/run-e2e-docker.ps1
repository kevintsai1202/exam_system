# =====================================================
# run-e2e-docker.ps1
# 本機 Docker e2e 測試執行腳本
#
# 用途：
#   1. 用 docker-compose.yml 啟動所有服務（db / backend / frontend / gateway）
#   2. 等待後端 healthcheck 通過（Spring Boot 完全就緒）
#   3. 等待 nginx gateway 可存取（確保前端 UI 測試可用）
#   4. 安裝 Playwright Chromium 瀏覽器（若尚未安裝）
#   5. 執行所有 Playwright 測試（API tests + UI tests）
#   6. 顯示結果並視參數決定是否拆除 Docker 服務
#
# 使用方式：
#   scripts\run-e2e-docker.ps1                   # 測試完保留容器（方便查看日誌）
#   scripts\run-e2e-docker.ps1 -TearDown         # 測試完自動移除容器
#   scripts\run-e2e-docker.ps1 -RebuildImage     # 強制重建所有 Docker image
#   scripts\run-e2e-docker.ps1 -APIOnly          # 只跑 API 測試（僅啟動 db+backend）
# =====================================================

param(
    [switch]$TearDown,      # 測試後清除容器與 volumes
    [switch]$RebuildImage,  # 強制重建所有 image（有程式碼變更時使用）
    [switch]$APIOnly        # 只跑 API-only 測試（不需要 frontend / gateway）
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ComposeFile = Join-Path $ProjectRoot "docker-compose.yml"
$FrontendDir = Join-Path $ProjectRoot "exam-system-frontend"

# ─── 步驟 1：確認前置工具 ───────────────────────────
Write-Host ""
Write-Host "=== [1/6] 環境確認 ===" -ForegroundColor Cyan
docker version --format "Docker: {{.Server.Version}}" 2>&1 | Write-Host
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker 未安裝或未啟動，請先啟動 Docker Desktop"
    exit 1
}

# ─── 步驟 2：啟動 Docker Compose ──────────────────────
Write-Host ""
Write-Host "=== [2/6] 啟動 Docker 服務 ===" -ForegroundColor Cyan

if ($APIOnly) {
    # API-only 模式：只啟動 db + backend
    Write-Host "API-only 模式：只啟動 db + backend" -ForegroundColor Yellow
    if ($RebuildImage) {
        docker compose -f $ComposeFile up -d --build db backend
    } else {
        docker compose -f $ComposeFile up -d db backend
    }
} elseif ($RebuildImage) {
    Write-Host "強制重建所有 image..." -ForegroundColor Yellow
    docker compose -f $ComposeFile up -d --build
} else {
    # 預設：啟動全部服務（db + backend + frontend + gateway）
    docker compose -f $ComposeFile up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Error "docker compose up 失敗"
    exit 1
}

Write-Host "容器已啟動，等待後端就緒..." -ForegroundColor Yellow

# ─── 步驟 3：等待後端 healthcheck 通過 ────────────────
Write-Host ""
Write-Host "=== [3/6] 等待後端健康檢查 ===" -ForegroundColor Cyan

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

# ─── 步驟 4：等待 Gateway（UI 測試才需要）──────────────
if (-not $APIOnly) {
    Write-Host ""
    Write-Host "=== [4/6] 等待 Gateway / 前端服務就緒 ===" -ForegroundColor Cyan

    $gatewayWait = 60
    $gwWaited = 0
    $gwInterval = 5
    $gatewayHealthy = $false

    while ($gwWaited -lt $gatewayWait) {
        Start-Sleep -Seconds $gwInterval
        $gwWaited += $gwInterval

        try {
            # Invoke-WebRequest 連不到時會丟例外，這裡捕捉並繼續等待
            $resp = Invoke-WebRequest -Uri "http://localhost" -Method GET -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -lt 400) {
                $gatewayHealthy = $true
                break
            }
        } catch {
            Write-Host "[$gwWaited s] 等待 Gateway (http://localhost)..."
        }
    }

    if (-not $gatewayHealthy) {
        Write-Host "⚠  Gateway 在 ${gatewayWait}s 內無回應，UI 測試可能失敗。" -ForegroundColor Yellow
        Write-Host "可執行以下指令查看 gateway/frontend 日誌：" -ForegroundColor Yellow
        Write-Host "  docker logs exam_system_gateway" -ForegroundColor Yellow
        Write-Host "  docker logs exam_system_frontend" -ForegroundColor Yellow
        # 不直接 exit 1，讓 API 測試仍可執行
    } else {
        Write-Host "Gateway 已就緒！" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "=== [4/6] 略過 Gateway 等待（API-only 模式）===" -ForegroundColor DarkGray
}

# ─── 步驟 5：安裝 Playwright 瀏覽器 ───────────────────
Write-Host ""
Write-Host "=== [5/6] 安裝 Playwright 瀏覽器 ===" -ForegroundColor Cyan

Push-Location $FrontendDir
try {
    $nvmNodePath = "d:\nvm4w\nodejs\node.exe"
    if (Get-Command node -ErrorAction SilentlyContinue) {
        if (-not $APIOnly) {
            # 安裝 Chromium（UI 測試需要）
            Write-Host "安裝 Chromium..." -ForegroundColor Yellow
            node node_modules/@playwright/test/cli.js install chromium
        }
    } elseif (Test-Path $nvmNodePath) {
        if (-not $APIOnly) {
            Write-Host "安裝 Chromium（nvm4w node）..." -ForegroundColor Yellow
            & $nvmNodePath node_modules/@playwright/test/cli.js install chromium
        }
    } else {
        Write-Error "找不到 node 執行檔。請先執行 nvm use <version> 或確認 Node.js 已安裝在 PATH 中。"
        exit 1
    }
} finally {
    Pop-Location
}

# ─── 步驟 6：執行 Playwright 測試 ─────────────────────
Write-Host ""
Write-Host "=== [6/6] 執行 Playwright 測試 ===" -ForegroundColor Cyan

Push-Location $FrontendDir
try {
    $nvmNodePath = "d:\nvm4w\nodejs\node.exe"
    if (Get-Command node -ErrorAction SilentlyContinue) {
        if ($APIOnly) {
            # 只執行 api project
            node node_modules/@playwright/test/cli.js test --project=api
        } else {
            # 執行全部 project（api + ui-chromium）
            node node_modules/@playwright/test/cli.js test
        }
    } elseif (Test-Path $nvmNodePath) {
        if ($APIOnly) {
            & $nvmNodePath node_modules/@playwright/test/cli.js test --project=api
        } else {
            & $nvmNodePath node_modules/@playwright/test/cli.js test
        }
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
    Write-Host "查看失敗截圖 / 影片：" -ForegroundColor Yellow
    Write-Host "  exam-system-frontend\test-results\" -ForegroundColor Yellow
}

# ─── 選擇性清理 ────────────────────────────────────────
if ($TearDown) {
    Write-Host ""
    Write-Host "清除 Docker 服務與 volumes..." -ForegroundColor Cyan
    docker compose -f $ComposeFile down -v
}

exit $e2eExit
