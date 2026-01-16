package com.exam.system.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

/**
 * 圖片上傳控制器
 */
@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageUploadController {

    @Value("${app.upload.dir:./data/images}")
    private String uploadDir;

    @Value("${app.upload.base-url:http://localhost:8080/api/images}")
    private String baseUrl;

    /**
     * 上傳選項圖片
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "請選擇要上傳的圖片"));
        }

        // 驗證檔案類型
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "只能上傳圖片檔案"));
        }

        try {
            // 確保上傳目錄存在
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // 產生唯一檔名
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null && originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";
            String newFilename = UUID.randomUUID().toString() + extension;

            // 儲存檔案
            Path filePath = uploadPath.resolve(newFilename);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // 產生存取 URL
            String imageUrl = baseUrl + "/" + newFilename;

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "imageUrl", imageUrl,
                    "filename", newFilename));

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "上傳失敗: " + e.getMessage()));
        }
    }

    /**
     * 取得圖片
     */
    @GetMapping("/{filename}")
    public ResponseEntity<?> getImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename);

            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] imageBytes = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);

            return ResponseEntity.ok()
                    .header("Content-Type", contentType != null ? contentType : "image/jpeg")
                    .body(imageBytes);

        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 刪除圖片
     */
    @DeleteMapping("/{filename}")
    public ResponseEntity<?> deleteImage(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir).resolve(filename);

            if (Files.exists(filePath)) {
                Files.delete(filePath);
                return ResponseEntity.ok(Map.of("success", true));
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "success", false,
                    "message", "刪除失敗: " + e.getMessage()));
        }
    }
}
