package com.exam.system.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * 郵件範本 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplateDTO {

    private Long id;

    @NotBlank(message = "範本名稱不能為空")
    @Size(max = 100, message = "範本名稱最多 100 字")
    private String name;

    @NotBlank(message = "郵件主旨不能為空")
    @Size(max = 200, message = "郵件主旨最多 200 字")
    private String subject;

    private String htmlContent;

    private String plainTextContent;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
