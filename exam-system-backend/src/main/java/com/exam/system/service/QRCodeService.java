package com.exam.system.service;

import com.exam.system.config.ExamProperties;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Random;

/**
 * QR Code 生成服務
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QRCodeService {

    private final ExamProperties examProperties;
    private final Random random = new Random();

    /**
     * 生成唯一的 accessCode
     *
     * @return 6 位英數字的 accessCode
     */
    public String generateAccessCode() {
        String characters = examProperties.getAccessCode().getCharacters();
        int length = examProperties.getAccessCode().getLength();

        StringBuilder code = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            int index = random.nextInt(characters.length());
            code.append(characters.charAt(index));
        }

        return code.toString();
    }

    /**
     * 生成 QR Code 的 Base64 編碼圖片
     *
     * @param content QR Code 內容（通常是 URL）
     * @return Base64 編碼的 PNG 圖片
     */
    public String generateQRCodeBase64(String content) {
        try {
            int width = examProperties.getQrcode().getWidth();
            int height = examProperties.getQrcode().getHeight();

            // 設定 QR Code 參數
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
            hints.put(EncodeHintType.MARGIN, 1);

            // 生成 QR Code 矩陣
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);

            // 將矩陣轉換為圖片
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
            byte[] imageBytes = outputStream.toByteArray();

            // 轉換為 Base64
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            return "data:image/png;base64," + base64Image;

        } catch (WriterException | IOException e) {
            log.error("Failed to generate QR code for content: {}", content, e);
            throw new RuntimeException("QR Code 生成失敗", e);
        }
    }

    /**
     * 生成學員加入測驗的 URL
     *
     * @param accessCode 測驗加入碼
     * @param baseUrl 基礎 URL（例如：http://localhost:5173）
     * @return 完整的加入 URL
     */
    public String generateJoinUrl(String accessCode, String baseUrl) {
        return String.format("%s/student/join?code=%s", baseUrl, accessCode);
    }

}