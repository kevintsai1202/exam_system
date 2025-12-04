@echo off
echo ====================================
echo Exam System Backend - Run Application
echo ====================================
echo.

echo Setting JAVA_HOME to JDK 21...
set JAVA_HOME=D:\java\jdk-21
set PATH=D:\java\jdk-21\bin;%PATH%

echo.
echo Verifying Java version...
java -version
echo.

echo Starting Spring Boot Application...
echo Server will start at: http://localhost:8080
echo H2 Console: http://localhost:8080/h2-console
echo.
echo Press Ctrl+C to stop the server
echo.

mvn spring-boot:run