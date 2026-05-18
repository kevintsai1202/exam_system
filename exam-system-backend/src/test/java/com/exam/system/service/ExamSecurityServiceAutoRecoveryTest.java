package com.exam.system.service;

import com.exam.system.config.ExamProperties;
import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 驗證升級重啟後 instructor session auto-recovery 邏輯：
 *   - 條件 A: 從未推題 (currentQuestionStartedAt == null)
 *   - 條件 B: 上一題已過期 + 5 秒 buffer
 */
class ExamSecurityServiceAutoRecoveryTest {

    private ExamSecurityService service;

    @BeforeEach
    void setup() {
        service = new ExamSecurityService(new ExamProperties());
    }

    @Test
    void autoRecover_whenNoQuestionPushed() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(null);

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isTrue();
        assertThat(service.getInstructorSession(exam.getId())).isEqualTo("client-token-abc");
    }

    @Test
    void autoRecover_whenLastQuestionExpiredOver5Seconds() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(LocalDateTime.now().minusSeconds(60));
        exam.setCurrentQuestionExpiresAt(Instant.now().minusSeconds(10));

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isTrue();
    }

    @Test
    void doNotRecover_whenLastQuestionStillActive() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(LocalDateTime.now().minusSeconds(5));
        exam.setCurrentQuestionExpiresAt(Instant.now().plusSeconds(25));

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isFalse();
    }

    @Test
    void doNotRecover_whenExpiredWithinBuffer() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(LocalDateTime.now().minusSeconds(30));
        exam.setCurrentQuestionExpiresAt(Instant.now().minusSeconds(2));

        assertThat(service.validateInstructorSession(exam, "client-token-abc")).isFalse();
    }

    @Test
    void doNotRecover_whenProvidedSessionIdIsBlank() {
        Exam exam = newStartedExam();
        exam.setCurrentQuestionStartedAt(null);

        assertThat(service.validateInstructorSession(exam, "")).isFalse();
        assertThat(service.validateInstructorSession(exam, null)).isFalse();
    }

    private Exam newStartedExam() {
        Exam exam = new Exam();
        exam.setId(1L);
        exam.setStatus(ExamStatus.STARTED);
        return exam;
    }
}
