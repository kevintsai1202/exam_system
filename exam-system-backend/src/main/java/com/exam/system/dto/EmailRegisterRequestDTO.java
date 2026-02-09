package com.exam.system.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Email 註冊請求 DTO
 */
@Data
public class EmailRegisterRequestDTO {

    /**
     * 顯示名稱
     */
    @NotBlank(message = "姓名不可為空")
    @Size(min = 1, max = 100, message = "姓名長度需介於 1 到 100 字元")
    private String name;

    /**
     * 註冊 Email
     */
    @NotBlank(message = "Email 不可為空")
    @Email(message = "Email 格式不正確")
    @Size(max = 100, message = "Email 長度不可超過 100 字元")
    private String email;

    /**
     * 註冊密碼
     */
    @NotBlank(message = "密碼不可為空")
    @Size(min = 8, max = 72, message = "密碼長度需介於 8 到 72 字元")
    private String password;
}
