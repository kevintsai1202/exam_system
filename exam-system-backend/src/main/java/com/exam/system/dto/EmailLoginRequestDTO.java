package com.exam.system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Email 登入請求 DTO
 */
@Data
public class EmailLoginRequestDTO {

    /**
     * 登入用 Email
     */
    @NotBlank(message = "Email 不可為空")
    @Email(message = "Email 格式不正確")
    @Size(max = 100, message = "Email 長度不可超過 100 字元")
    private String email;

    /**
     * 登入密碼
     */
    @NotBlank(message = "密碼不可為空")
    @Size(min = 8, max = 72, message = "密碼長度需介於 8 到 72 字元")
    private String password;
}
