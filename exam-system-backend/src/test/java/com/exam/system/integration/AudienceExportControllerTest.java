package com.exam.system.integration;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** 驗證 Exam 整合端點的獨立 token、limit 與服務委派。 */
class AudienceExportControllerTest {

    /** 正確 Bearer token 才可取得匯出資料。 */
    @Test
    void validTokenExportsAudiencePage() {
        AudienceExportService service = mock(AudienceExportService.class);
        AudienceExportResponse expected =
            new AudienceExportResponse("cursor-2", List.of(), List.of());
        when(service.export("cursor-1", 50)).thenReturn(expected);
        AudienceExportController controller =
            new AudienceExportController(service, "integration-secret");

        AudienceExportResponse actual =
            controller.export("Bearer integration-secret", "cursor-1", 50);

        assertEquals(expected, actual);
        verify(service).export("cursor-1", 50);
    }

    /** 缺 token、錯 token 與超過上限都必須拒絕。 */
    @Test
    void invalidAuthorizationAndLimitAreRejected() {
        AudienceExportService service = mock(AudienceExportService.class);
        AudienceExportController controller =
            new AudienceExportController(service, "integration-secret");

        assertEquals(401, assertThrows(
            ResponseStatusException.class,
            () -> controller.export(null, null, 10)).getStatusCode().value());
        assertEquals(401, assertThrows(
            ResponseStatusException.class,
            () -> controller.export("Bearer wrong", null, 10)).getStatusCode().value());
        assertEquals(400, assertThrows(
            ResponseStatusException.class,
            () -> controller.export("Bearer integration-secret", null, 501))
            .getStatusCode().value());
    }

    /** 部署未設定共享 token 時端點維持關閉。 */
    @Test
    void missingConfiguredTokenKeepsEndpointClosed() {
        AudienceExportController controller =
            new AudienceExportController(mock(AudienceExportService.class), "");

        assertEquals(503, assertThrows(
            ResponseStatusException.class,
            () -> controller.export("Bearer any", null, 10)).getStatusCode().value());
    }
}
