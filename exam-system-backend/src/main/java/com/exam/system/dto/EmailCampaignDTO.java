package com.exam.system.dto;

import com.exam.system.entity.CampaignStatus;
import com.exam.system.entity.DeliveryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 郵件活動 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailCampaignDTO {

    private Long id;

    @NotNull(message = "測驗 ID 不能為空")
    private Long examId;

    private String examTitle;

    private Long surveyId;

    private String surveyTitle;

    private Long templateId;

    private String templateName;

    @NotBlank(message = "活動名稱不能為空")
    @Size(max = 100, message = "活動名稱最多 100 字")
    private String name;

    @NotBlank(message = "郵件主旨不能為空")
    @Size(max = 200, message = "郵件主旨最多 200 字")
    private String subject;

    private String htmlContent;

    private CampaignStatus status;

    private LocalDateTime scheduledAt;

    private LocalDateTime sentAt;

    private Integer totalRecipients;

    private Integer sentCount;

    private Integer failedCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private List<EmailRecipientDTO> recipients;

    /**
     * 郵件收件人 DTO
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EmailRecipientDTO {

        private Long id;

        private Long studentId;

        private String email;

        private String name;

        private DeliveryStatus status;

        private LocalDateTime sentAt;

        private String errorMessage;
    }
}
