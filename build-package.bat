@echo off
chcp 65001 > nul
REM ====================================
REM 即時互動測驗系統 - 打包腳本
REM ====================================

echo.
echo ====================================
echo   即時互動測驗系統 - 打包工具
echo   Exam System Package Builder
echo ====================================
echo.

REM 設定路徑
set PROJECT_ROOT=%~dp0
set JAR_SOURCE=%PROJECT_ROOT%exam-system-backend\target\exam-system-1.0.0.jar
set PACKAGE_DIR=%PROJECT_ROOT%package
set JRE_SOURCE=D:\java\jdk-21
set JRE_DEST=%PACKAGE_DIR%\jre

echo [步驟 1/5] 檢查 JAR 檔案...
if not exist "%JAR_SOURCE%" (
    echo [錯誤] 找不到 JAR 檔案: %JAR_SOURCE%
    echo 請先執行: cd exam-system-backend ^&^& mvn clean package -DskipTests
    echo.
    pause
    exit /b 1
)
echo [成功] JAR 檔案存在
echo.

echo [步驟 2/5] 建立 package 目錄...
if exist "%PACKAGE_DIR%" (
    echo 清理現有 package 目錄...
    rmdir /s /q "%PACKAGE_DIR%"
)
mkdir "%PACKAGE_DIR%"
echo [成功] 目錄已建立: %PACKAGE_DIR%
echo.

echo [步驟 3/5] 複製 JAR 檔案...
copy "%JAR_SOURCE%" "%PACKAGE_DIR%\exam_system.jar" > nul
if errorlevel 1 (
    echo [錯誤] 複製 JAR 檔案失敗
    pause
    exit /b 1
)
echo [成功] JAR 檔案已複製: exam_system.jar
echo.

echo [步驟 4/5] 複製 JRE...
echo 這可能需要幾分鐘時間...
if not exist "%JRE_SOURCE%" (
    echo [錯誤] 找不到 JRE: %JRE_SOURCE%
    pause
    exit /b 1
)
xcopy "%JRE_SOURCE%" "%JRE_DEST%" /E /I /Q /H /Y > nul
if errorlevel 1 (
    echo [錯誤] 複製 JRE 失敗
    pause
    exit /b 1
)
echo [成功] JRE 已複製到: %JRE_DEST%
echo.

echo [步驟 5/5] 產生啟動批次檔...

REM 創建啟動批次檔
(
echo @echo off
echo chcp 65001 ^> nul
echo REM ====================================
echo REM 即時互動測驗系統 - 啟動腳本
echo REM ====================================
echo.
echo echo.
echo echo ====================================
echo echo   即時互動測驗系統
echo echo   Exam System v1.0.0
echo echo ====================================
echo echo.
echo.
echo REM 使用本地 JRE
echo set JAVA_HOME=%%~dp0jre
echo set PATH=%%JAVA_HOME%%\bin;%%PATH%%
echo.
echo REM 顯示 Java 版本
echo echo 檢查 Java 版本...
echo java -version
echo echo.
echo.
echo REM 檢查 JAR 檔案
echo if not exist "%%~dp0exam_system.jar" ^(
echo     echo [錯誤] 找不到 JAR 檔案: exam_system.jar
echo     echo.
echo     pause
echo     exit /b 1
echo ^)
echo.
echo echo 啟動應用程式...
echo echo JAR 檔案: exam_system.jar
echo echo 伺服器位址: http://localhost:8080
echo echo.
echo echo 應用程式功能:
echo echo   - 首頁: http://localhost:8080
echo echo   - 講師控制台: http://localhost:8080/instructor
echo echo   - 學員加入: http://localhost:8080/student/join
echo echo   - H2 資料庫: http://localhost:8080/h2-console
echo echo.
echo echo 按 Ctrl+C 可停止伺服器
echo echo ====================================
echo echo.
echo.
echo REM 執行 JAR 檔案
echo "%%~dp0jre\bin\java.exe" -jar "%%~dp0exam_system.jar"
echo.
echo REM 如果執行失敗，暫停以便查看錯誤訊息
echo if errorlevel 1 ^(
echo     echo.
echo     echo [錯誤] 應用程式執行失敗
echo     pause
echo ^)
) > "%PACKAGE_DIR%\start.bat"

echo [成功] 啟動批次檔已建立: start.bat
echo.

REM 創建 README
(
echo ====================================
echo 即時互動測驗系統 - 部署套件
echo ====================================
echo.
echo 版本: 1.0.0
echo 建立日期: %date% %time%
echo.
echo 目錄結構:
echo   exam_system.jar  - 應用程式主檔案
echo   start.bat        - 啟動腳本
echo   jre/             - Java 執行環境
echo   README.txt       - 本說明文件
echo.
echo 使用方式:
echo   1. 雙擊 start.bat 啟動應用程式
echo   2. 瀏覽器開啟 http://localhost:8080
echo   3. 按 Ctrl+C 停止伺服器
echo.
echo 系統需求:
echo   - Windows 作業系統
echo   - 無需額外安裝 Java（已包含）
echo.
echo 功能入口:
echo   - 首頁: http://localhost:8080
echo   - 講師控制台: http://localhost:8080/instructor
echo   - 學員加入: http://localhost:8080/student/join
echo   - H2 資料庫控制台: http://localhost:8080/h2-console
echo.
echo 資料庫位置:
echo   應用程式啟動後會在執行目錄下建立 data 資料夾
echo   資料庫檔案: data/examdb.mv.db
echo.
echo 注意事項:
echo   1. 請確保 Port 8080 未被佔用
echo   2. 資料庫檔案會自動建立並保存
echo   3. 停止伺服器前請先結束所有測驗
echo.
echo ====================================
) > "%PACKAGE_DIR%\README.txt"

echo [成功] README.txt 已建立
echo.

REM 顯示套件資訊
echo ====================================
echo   打包完成！
echo ====================================
echo.
echo 套件位置: %PACKAGE_DIR%
echo.
echo 目錄內容:
dir /b "%PACKAGE_DIR%"
echo.
echo 套件大小:
for /f "tokens=3" %%a in ('dir /-c "%PACKAGE_DIR%" ^| find "個檔案"') do set SIZE=%%a
echo 約 %SIZE% bytes
echo.
echo 使用方式:
echo   1. 進入 package 目錄
echo   2. 執行 start.bat
echo   3. 瀏覽器開啟 http://localhost:8080
echo.
echo ====================================
pause
