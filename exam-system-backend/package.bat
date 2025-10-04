@echo off
echo ====================================
echo Exam System Backend - Package JAR
echo ====================================
echo.

echo Setting JAVA_HOME to JDK 21...
set JAVA_HOME=C:\java\jdk-23
set PATH=C:\java\jdk-23\bin;%PATH%

echo.
echo Verifying Java version...
java -version
echo.

echo Building JAR file (skipping tests)...
echo.
mvn clean package -DskipTests

if errorlevel 1 (
    echo.
    echo ====================================
    echo Build FAILED!
    echo ====================================
    pause
    exit /b 1
)

echo.
echo ====================================
echo Build Successful!
echo ====================================
echo JAR file created at: target\exam-system-1.0.0.jar
echo.
echo To run the JAR:
echo java -jar target\exam-system-1.0.0.jar
echo.
pause