@echo off
echo ====================================
echo Exam System Backend Compilation
echo ====================================
echo.

echo Setting JAVA_HOME to JDK 21...
set JAVA_HOME=D:\java\jdk-21
set PATH=D:\java\jdk-21\bin;%PATH%

echo.
echo Verifying Java version...
java -version
echo.

echo Starting Maven compilation...
echo.
mvn clean compile -DskipTests

echo.
echo ====================================
echo Compilation Complete
echo ====================================
pause