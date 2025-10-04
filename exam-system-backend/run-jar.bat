@echo off
echo ====================================
echo Exam System Backend - Run JAR
echo ====================================
echo.

echo Setting JAVA_HOME to JDK 21...
set JAVA_HOME=C:\java\jdk-23
set PATH=C:\java\jdk-23\bin;%PATH%

echo.
echo Verifying Java version...
java -version
echo.

echo Checking if JAR exists...
if not exist target\exam-system-1.0.0.jar (
    echo.
    echo ERROR: JAR file not found!
    echo Please run package.bat first to build the JAR.
    echo.
    pause
    exit /b 1
)

echo.
echo Starting application from JAR...
echo Server will start at: http://localhost:8080
echo H2 Console: http://localhost:8080/h2-console
echo.
echo Press Ctrl+C to stop the server
echo.

java -jar target\exam-system-1.0.0.jar