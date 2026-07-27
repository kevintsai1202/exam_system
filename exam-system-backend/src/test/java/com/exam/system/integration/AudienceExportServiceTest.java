package com.exam.system.integration;

import com.exam.system.entity.Exam;
import com.exam.system.entity.Question;
import com.exam.system.entity.Student;
import com.exam.system.entity.StudentProfile;
import com.exam.system.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** 驗證穩定 cursor、人物去重與測驗摘要匯出格式。 */
class AudienceExportServiceTest {

    /** 依 ID 頁面順序輸出，且沒有 consent 證據時維持 null。 */
    @Test
    void exportsStableProfileAndAttemptContract() {
        StudentRepository repository = mock(StudentRepository.class);
        LocalDateTime joinedAt = LocalDateTime.of(2026, 7, 27, 10, 30);
        StudentProfile profile = StudentProfile.builder()
            .id(20L)
            .email("student@example.com")
            .name("測試學員")
            .createdAt(joinedAt.minusDays(1))
            .build();
        Exam exam = new Exam();
        exam.setId(30L);
        exam.setTitle("AI 全端測驗");
        exam.setQuestions(new ArrayList<>(List.of(new Question(), new Question())));
        Student student = Student.builder()
            .id(40L)
            .profile(profile)
            .exam(exam)
            .joinedAt(joinedAt)
            .totalScore(8)
            .surveyData(Map.of("role", "後端工程師"))
            .answers(new ArrayList<>())
            .build();
        when(repository.findAudienceExportIds(
            eq(LocalDateTime.of(1970, 1, 1, 0, 0)), eq(0L), any(Pageable.class)))
            .thenReturn(List.of(40L));
        when(repository.findAudienceExportDetails(List.of(40L))).thenReturn(List.of(student));

        AudienceExportResponse result = new AudienceExportService(repository).export(null, 100);

        assertEquals("2026-07-27T10:30|40", result.nextCursor());
        assertEquals(1, result.profiles().size());
        assertNull(result.profiles().getFirst().firstConsentAt());
        assertNull(result.profiles().getFirst().consentVersion());
        assertEquals(2, result.attempts().getFirst().questionCount());
        assertEquals(0, result.attempts().getFirst().answeredCount());
        assertEquals("後端工程師", result.attempts().getFirst().surveyData().get("role"));
    }

    /** 沒有新資料時保留呼叫端 cursor，不自行跳號。 */
    @Test
    void emptyPageKeepsCurrentCursor() {
        StudentRepository repository = mock(StudentRepository.class);
        when(repository.findAudienceExportIds(
            eq(LocalDateTime.of(2026, 7, 1, 0, 0)), eq(99L), any(Pageable.class)))
            .thenReturn(List.of());

        AudienceExportResponse result =
            new AudienceExportService(repository).export("2026-07-01T00:00|99", 20);

        assertEquals("2026-07-01T00:00|99", result.nextCursor());
        assertEquals(List.of(), result.profiles());
        assertEquals(List.of(), result.attempts());
    }
}
