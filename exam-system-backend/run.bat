@echo off
echo ====================================
echo Exam System Backend - Run Application
echo ====================================
echo.

echo Setting JAVA_HOME to JDK 21...
set JAVA_HOME=C:\java\jdk-23
set PATH=C:\java\jdk-23\bin;%PATH%

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