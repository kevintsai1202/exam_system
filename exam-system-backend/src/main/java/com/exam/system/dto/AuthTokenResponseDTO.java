package com.exam.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 認證成功回應 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthTokenResponseDTO {

    /**
     * JWT Token
     */
    private String token;

    /**
     * 是否已認證
     */
    private boolean authenticated;

    /**
     * 當前用戶資訊
     */
    private UserDTO user;
}
