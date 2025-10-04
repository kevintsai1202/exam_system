@echo off
set JAVA_HOME=D:\java\jdk-21
set PATH=D:\java\jdk-21\bin;%PATH%
java -version
echo.
echo Building with Maven...
mvn clean compile -DskipTests