package com.exam.system.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserSession;
import com.exam.system.entity.UserSession.SessionStatus;
import com.exam.system.entity.UserSession.SessionType;
import com.exam.system.service.SessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 會話管理控制器
 */
@RestController
@RequestMapping("/api/session")
@RequiredArgsConstructor
public class SessionController {

    private final SessionService sessionService;

    /**
     * 取得當前用戶的活躍會話
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveSession(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("hasSession", false));
        }

        return sessionService.getActiveSession(user.getId())
                .map(session -> ResponseEntity.ok(Map.of(
                        "hasSession", true,
                        "session", Map.of(
                                "id", session.getId(),
                                "examId", session.getExamId(),
                                "currentQuestionId",
                                session.getCurrentQuestionId() != null ? session.getCurrentQuestionId() : 0,
                                "sessionType", session.getSessionType().name(),
                                "status", session.getStatus().name(),
                                "studentSessionId",
                                session.getStudentSessionId() != null ? session.getStudentSessionId() : ""))))
                .orElse(ResponseEntity.ok(Map.of("hasSession", false)));
    }

    /**
     * 根據學生 Session ID 取得會話（用於學生斷線回復）
     */
    @GetMapping("/student/{studentSessionId}")
    public ResponseEntity<?> getStudentSession(@PathVariable String studentSessionId) {
        return sessionService.getSessionByStudentId(studentSessionId)
                .map(session -> ResponseEntity.ok(Map.of(
                        "hasSession", true,
                        "session", Map.of(
                                "id", session.getId(),
                                "examId", session.getExamId(),
                                "currentQuestionId",
                                session.getCurrentQuestionId() != null ? session.getCurrentQuestionId() : 0,
                                "status", session.getStatus().name()))))
                .orElse(ResponseEntity.ok(Map.of("hasSession", false)));
    }

    /**
     * 保存會話狀態
     */
    @PostMapping("/save")
    public ResponseEntity<?> saveSession(
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, Object> request) {

        Long userId = user != null ? user.getId() : 0L;
        Long examId = ((Number) request.get("examId")).longValue();
        Long currentQuestionId = request.get("currentQuestionId") != null
                ? ((Number) request.get("currentQuestionId")).longValue()
                : null;
        String sessionTypeStr = (String) request.getOrDefault("sessionType", "STUDENT");
        String studentSessionId = (String) request.get("studentSessionId");

        SessionType sessionType = SessionType.valueOf(sessionTypeStr);

        // 如果是學生且沒有 userId，使用 studentSessionId 的 hash 作為識別
        if (userId == 0L && studentSessionId != null) {
            userId = (long) studentSessionId.hashCode();
        }

        UserSession session = sessionService.saveSession(
                userId, examId, currentQuestionId, sessionType, studentSessionId);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "sessionId", session.getId()));
    }

    /**
     * 更新會話狀態為完成
     */
    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<?> completeSession(@PathVariable Long sessionId) {
        sessionService.completeSession(sessionId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * 刪除會話
     */
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<?> deleteSession(@PathVariable Long sessionId) {
        sessionService.deleteSession(sessionId);
        return ResponseEntity.ok(Map.of("success", true));
    }

    /**
     * 恢復斷線會話
     */
    @PostMapping("/restore")
    public ResponseEntity<?> restoreSession(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(Map.of("restored", false, "message", "未登入"));
        }

        return sessionService.restoreSession(user.getId())
                .map(session -> ResponseEntity.ok(Map.of(
                        "restored", true,
                        "session", Map.of(
                                "id", session.getId(),
                                "examId", session.getExamId(),
                                "currentQuestionId",
                                session.getCurrentQuestionId() != null ? session.getCurrentQuestionId() : 0,
                                "sessionType", session.getSessionType().name()))))
                .orElse(ResponseEntity.ok(Map.of("restored", false, "message", "沒有可恢復的會話")));
    }
}
