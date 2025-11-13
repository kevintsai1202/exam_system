package com.exam.system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

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
     * 學員職業（保留向下兼容）
     */
    @Size(max = 50, message = "職業長度不能超過 50")
    private String occupation;

    /**
     * 調查資料（其他調查欄位的回答）
     * 例如: {"age_range": "20-30", "gender": "male"}
     */
    private Map<String, String> surveyData;

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
     * 答對題數（回應時使用）
     */
    private Integer correctAnswersCount;

    /**
     * 加入時間（回應時使用）
     */
    private LocalDateTime joinedAt;

    /**
     * 測驗狀態（回應時使用）
     */
    private String examStatus;

    /**
     * 當前正在進行的題目（如果有的話）
     */
    private CurrentQuestionInfo currentQuestion;

    /**
     * 當前題目資訊（內部類別）
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CurrentQuestionInfo {
        private Long questionId;
        private Integer questionIndex;
        private String questionText;
        private List<QuestionOptionInfo> options;
        private LocalDateTime expiresAt;
    }

    /**
     * 題目選項資訊（內部類別）
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionOptionInfo {
        private Long id;
        private Integer optionOrder;
        private String optionText;
    }

}