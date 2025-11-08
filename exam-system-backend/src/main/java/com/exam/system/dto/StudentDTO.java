package com.exam.system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 學員 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentDTO {

    /**
     * 學員 ID（回應時使用）
     */
    private Long id;

    /**
     * Session ID（回應時使用）
     */
    private String sessionId;

    /**
     * 測驗 ID（回應時使用）
     */
    private Long examId;

    /**
     * 加入碼（請求時使用）
     */
    @NotBlank(message = "加入碼不能為空")
    @Size(min = 6, max = 6, message = "加入碼長度必須為 6")
    private String accessCode;

    /**
     * 學員姓名
     */
    @NotBlank(message = "姓名不能為空")
    @Size(min = 1, max = 50, message = "姓名長度必須在 1-50 之間")
    private String name;

    /**
     * 學員 Email
     */
    @NotBlank(message = "Email 不能為空")
    @Email(message = "Email 格式不正確")
    @Size(max = 100, message = "Email 長度不能超過 100")
    private String email;

    /**
     * 學員職業
     */
    @Size(max = 50, message = "職業長度不能超過 50")
    private String occupation;

    /**
     * 頭像圖示名稱
     */
    @NotBlank(message = "頭像不能為空")
    private String avatarIcon;

    /**
     * 累積總分（回應時使用）
     */
    private Integer totalScore;

    /**
     * 加入時間（回應時使用）
     */
    private LocalDateTime joinedAt;

    /**
     * 測驗狀態（回應時使用）
     */
    private String examStatus;

}