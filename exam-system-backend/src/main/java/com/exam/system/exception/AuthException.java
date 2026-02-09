package com.exam.system.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 認證流程專用異常
 * 可攜帶 HTTP 狀態與錯誤代碼
 */
@Getter
public class AuthException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public AuthException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }
}
