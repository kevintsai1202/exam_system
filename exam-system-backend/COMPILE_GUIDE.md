# 後端編譯指南

## 環境確認

### 1. 確認 JDK 21
```bash
D:\java\jdk-21\bin\java.exe -version
```
應該顯示：`openjdk version "21"`

### 2. 確認 Maven
```bash
mvn -version
```

## 編譯方式

### 方式 1: Windows PowerShell (推薦)
```powershell
cd D:\GitHub\exam_system\exam-system-backend
$env:JAVA_HOME = "D:\java\jdk-21"
$env:PATH = "D:\java\jdk-21\bin;" + $env:PATH
mvn clean compile
```

### 方式 2: Windows CMD
```cmd
cd D:\GitHub\exam_system\exam-system-backend
set JAVA_HOME=D:\java\jdk-21
set PATH=D:\java\jdk-21\bin;%PATH%
mvn clean compile
```

### 方式 3: 使用批次檔
雙擊執行 `compile.bat`

## 完整建置（含測試）
```bash
mvn clean install
```

## 跳過測試建置
```bash
mvn clean install -DskipTests
```

## 執行應用程式
```bash
mvn spring-boot:run
```

## 常見問題

### Q: 提示 "invalid flag: --release"
**原因**: Maven 使用了錯誤的 Java 版本（1.8 而非 21）

**解決方案**: 確保在執行 Maven 前先設定 JAVA_HOME
```bash
set JAVA_HOME=D:\java\jdk-21
```

### Q: 編譯成功但運行失敗
**原因**: 運行時使用了錯誤的 Java 版本

**解決方案**: 確保 PATH 中 JDK 21 的路徑在最前面
```bash
set PATH=D:\java\jdk-21\bin;%PATH%
```

## 驗證編譯結果

編譯成功後，應該看到：
```
[INFO] BUILD SUCCESS
[INFO] Total time: XX s
```

並且會在 `target/classes` 目錄下生成 .class 檔案。