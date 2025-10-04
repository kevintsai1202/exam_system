@echo off
echo ====================================
echo Exam System Backend Compilation
echo ====================================
echo.

echo Setting JAVA_HOME to JDK 21...
set JAVA_HOME=C:\java\jdk-23
set PATH=C:\java\jdk-23\bin;%PATH%

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