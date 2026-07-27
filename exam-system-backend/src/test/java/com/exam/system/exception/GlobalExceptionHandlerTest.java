package com.exam.system.exception;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** 驗證全域錯誤處理器保留 Controller 指定的 HTTP 狀態。 */
class GlobalExceptionHandlerTest {

    /** 未授權例外不得被一般例外處理器誤轉為 500。 */
    @Test
    void preservesResponseStatusExceptionStatus() {
        GlobalExceptionHandler handler = new GlobalExceptionHandler();

        ResponseEntity<GlobalExceptionHandler.ErrorResponse> response =
            handler.handleResponseStatusException(
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "integration token 無效"));

        assertEquals(HttpStatus.UNAUTHORIZED, response.getStatusCode());
        assertEquals(401, response.getBody().getStatus());
        assertEquals("integration token 無效", response.getBody().getMessage());
    }
}
