@echo off
echo ====================================
echo Quick Compilation Test
echo ====================================
echo.

set JAVA_HOME=D:\java\jdk-21
set PATH=D:\java\jdk-21\bin;%PATH%

echo Testing compilation...
mvn clean compile -DskipTests

if errorlevel 1 (
    echo.
    echo ====================================
    echo FAILED - Check errors above
    echo ====================================
    pause
    exit /b 1
) else (
    echo.
    echo ====================================
    echo SUCCESS - All files compiled!
    echo ====================================
    echo.
    echo You can now run: run.bat
    echo.
    pause
)