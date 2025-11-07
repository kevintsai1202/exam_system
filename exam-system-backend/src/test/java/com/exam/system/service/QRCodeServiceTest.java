package com.exam.system.service;

import com.exam.system.config.ExamProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * QRCodeService 測試類別
 * 測試 QR Code 生成服務
 */
@DisplayName("QRCodeService 測試")
class QRCodeServiceTest {

    private ExamProperties examProperties;
    private QRCodeService qrCodeService;

    @BeforeEach
    void setUp() {
        // 建立配置物件
        examProperties = new ExamProperties();

        // 設定 AccessCode 配置
        ExamProperties.AccessCodeConfig accessCodeConfig = new ExamProperties.AccessCodeConfig();
        accessCodeConfig.setLength(6);
        accessCodeConfig.setCharacters("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789");
        examProperties.setAccessCode(accessCodeConfig);

        // 設定 QRCode 配置
        ExamProperties.QRCodeConfig qrcodeConfig = new ExamProperties.QRCodeConfig();
        qrcodeConfig.setWidth(300);
        qrcodeConfig.setHeight(300);
        examProperties.setQrcode(qrcodeConfig);

        // 建立服務
        qrCodeService = new QRCodeService(examProperties);
    }

    @Test
    @DisplayName("測試生成 accessCode - 長度正確")
    void testGenerateAccessCode_CorrectLength() {
        // When
        String accessCode = qrCodeService.generateAccessCode();

        // Then
        assertThat(accessCode).hasSize(6);
    }

    @Test
    @DisplayName("測試生成 accessCode - 字符集正確")
    void testGenerateAccessCode_ValidCharacters() {
        // When
        String accessCode = qrCodeService.generateAccessCode();

        // Then
        String validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        for (char c : accessCode.toCharArray()) {
            assertThat(validChars).contains(String.valueOf(c));
        }
    }

    @Test
    @DisplayName("測試生成 accessCode - 多次生成不一定相同")
    void testGenerateAccessCode_Randomness() {
        // When - 生成100個 accessCode
        Set<String> codes = new HashSet<>();
        for (int i = 0; i < 100; i++) {
            codes.add(qrCodeService.generateAccessCode());
        }

        // Then - 應該有多個不同的 accessCode（不太可能全部相同）
        assertThat(codes.size()).isGreaterThan(1);
    }

    @Test
    @DisplayName("測試生成 joinUrl - 格式正確")
    void testGenerateJoinUrl_CorrectFormat() {
        // Given
        String accessCode = "ABC123";
        String baseUrl = "http://localhost:5173";

        // When
        String joinUrl = qrCodeService.generateJoinUrl(accessCode, baseUrl);

        // Then
        assertThat(joinUrl).isEqualTo("http://localhost:5173/student/join?code=ABC123");
    }

    @Test
    @DisplayName("測試生成 joinUrl - 不同的 baseUrl")
    void testGenerateJoinUrl_DifferentBaseUrl() {
        // Given
        String accessCode = "XYZ789";
        String baseUrl = "https://exam.example.com";

        // When
        String joinUrl = qrCodeService.generateJoinUrl(accessCode, baseUrl);

        // Then
        assertThat(joinUrl).isEqualTo("https://exam.example.com/student/join?code=XYZ789");
        assertThat(joinUrl).startsWith("https://");
        assertThat(joinUrl).contains("code=XYZ789");
    }

    @Test
    @DisplayName("測試生成 QR Code Base64 - 成功")
    void testGenerateQRCodeBase64_Success() {
        // Given
        String content = "http://localhost:5173/student/join?code=TEST01";

        // When
        String qrCodeBase64 = qrCodeService.generateQRCodeBase64(content);

        // Then
        assertThat(qrCodeBase64).isNotNull();
        assertThat(qrCodeBase64).startsWith("data:image/png;base64,");
        assertThat(qrCodeBase64.length()).isGreaterThan(100); // Base64 編碼的圖片應該很長
    }

    @Test
    @DisplayName("測試生成 QR Code Base64 - 簡短內容")
    void testGenerateQRCodeBase64_ShortContent() {
        // Given
        String content = "TEST";

        // When
        String qrCodeBase64 = qrCodeService.generateQRCodeBase64(content);

        // Then
        assertThat(qrCodeBase64).isNotNull();
        assertThat(qrCodeBase64).startsWith("data:image/png;base64,");
    }

    @Test
    @DisplayName("測試生成 QR Code Base64 - 中文內容")
    void testGenerateQRCodeBase64_ChineseContent() {
        // Given
        String content = "測試中文內容";

        // When
        String qrCodeBase64 = qrCodeService.generateQRCodeBase64(content);

        // Then
        assertThat(qrCodeBase64).isNotNull();
        assertThat(qrCodeBase64).startsWith("data:image/png;base64,");
    }

    @Test
    @DisplayName("測試生成 QR Code Base64 - 相同內容應產生相同結果")
    void testGenerateQRCodeBase64_Deterministic() {
        // Given
        String content = "http://localhost:5173/student/join?code=SAME01";

        // When
        String qrCode1 = qrCodeService.generateQRCodeBase64(content);
        String qrCode2 = qrCodeService.generateQRCodeBase64(content);

        // Then - 相同內容應該產生相同的 QR Code
        assertThat(qrCode1).isEqualTo(qrCode2);
    }

    @Test
    @DisplayName("測試生成 QR Code Base64 - 不同內容應產生不同結果")
    void testGenerateQRCodeBase64_DifferentContent() {
        // Given
        String content1 = "http://localhost:5173/student/join?code=CODE1";
        String content2 = "http://localhost:5173/student/join?code=CODE2";

        // When
        String qrCode1 = qrCodeService.generateQRCodeBase64(content1);
        String qrCode2 = qrCodeService.generateQRCodeBase64(content2);

        // Then - 不同內容應該產生不同的 QR Code
        assertThat(qrCode1).isNotEqualTo(qrCode2);
    }
}
