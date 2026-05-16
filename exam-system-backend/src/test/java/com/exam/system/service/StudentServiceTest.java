package com.exam.system.service;

import com.exam.system.TestDataBuilder;
import com.exam.system.dto.StudentDTO;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import com.exam.system.service.CurrentUserProvider;
import com.exam.system.websocket.WebSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * StudentService 測試類別
 * 測試學員服務層的業務邏輯
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StudentService 測試")
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private WebSocketService webSocketService;

    /** Phase 11 新增：調查欄位設定 Repository */
    @Mock
    private ExamSurveyFieldConfigRepository examSurveyFieldConfigRepository;

    /** Phase 11 新增：地點驗證服務 */
    @Mock
    private LocationService locationService;

    /** Phase 11 新增：學員 Profile Repository（UPSERT 用） */
    @Mock
    private StudentProfileRepository studentProfileRepository;

    /** Phase 11 新增：講師-學員關聯 Repository（UPSERT 用） */
    @Mock
    private InstructorStudentRelationRepository instructorStudentRelationRepository;

    /** Phase 12 新增：讀取當前用戶（getInstructorStudents 使用） */
    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private StudentService studentService;

    private Exam testExam;
    private StudentDTO testStudentDTO;

    @BeforeEach
    void setUp() {
        testExam = TestDataBuilder.createExam();
        testExam.setId(1L);
        testExam.setStatus(ExamStatus.STARTED);

        testStudentDTO = TestDataBuilder.createStudentDTO();
        // 設定地區（joinExam 必填欄位）
        testStudentDTO.setLocation("TW");

        // --- 共用 lenient stubs（部分測試不會執行到，避免 UnnecessaryStubbingException） ---

        // 無需必填調查欄位
        lenient().when(examSurveyFieldConfigRepository.findByExamIdOrderByDisplayOrderAsc(any()))
                .thenReturn(Collections.emptyList());

        // 地區代碼驗證通過
        lenient().when(locationService.isValidLocation(any())).thenReturn(true);

        // 預設找不到現有學員（新學員路徑）
        lenient().when(studentRepository.findByExamIdAndEmail(any(), any()))
                .thenReturn(Optional.empty());
        lenient().when(studentRepository.findByExamIdAndName(any(), any()))
                .thenReturn(Optional.empty());

        // StudentProfile UPSERT：預設找不到現有 Profile → 建立新的
        lenient().when(studentProfileRepository.findByEmail(any())).thenReturn(Optional.empty());
        lenient().when(studentProfileRepository.save(any(StudentProfile.class))).thenAnswer(inv -> {
            StudentProfile p = inv.getArgument(0);
            if (p.getId() == null) p.setId(100L);
            return p;
        });

        // InstructorStudentRelation UPSERT：預設找不到現有關聯
        lenient().when(instructorStudentRelationRepository
                .findByInstructorIdAndProfileId(any(), any()))
                .thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("測試學員加入測驗 - 成功")
    void testJoinExam_Success() {
        // Given
        when(examRepository.findByAccessCode("TEST01")).thenReturn(Optional.of(testExam));
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> {
            Student s = invocation.getArgument(0);
            s.setId(1L);
            return s;
        });
        when(studentRepository.countByExamId(1L)).thenReturn(1L);
        doNothing().when(webSocketService).broadcastStudentJoined(anyLong(), any());

        // When
        StudentDTO result = studentService.joinExam(testStudentDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo(testStudentDTO.getName());
        assertThat(result.getSessionId()).isNotNull();
        assertThat(result.getTotalScore()).isEqualTo(0);
        assertThat(result.getExamStatus()).isEqualTo("STARTED");

        verify(examRepository).findByAccessCode("TEST01");
        verify(studentRepository).save(any(Student.class));
        verify(webSocketService).broadcastStudentJoined(eq(1L), any());
        // 確認 Profile 已建立
        verify(studentProfileRepository).save(any(StudentProfile.class));
    }

    @Test
    @DisplayName("測試學員加入測驗 - 無效的 accessCode")
    void testJoinExam_InvalidAccessCode() {
        // Given
        when(examRepository.findByAccessCode("INVALID")).thenReturn(Optional.empty());
        testStudentDTO.setAccessCode("INVALID");

        // When & Then
        assertThatThrownBy(() -> studentService.joinExam(testStudentDTO))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("無效的測驗代碼");

        verify(examRepository).findByAccessCode("INVALID");
        verify(studentRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試學員加入測驗 - 測驗未開始")
    void testJoinExam_ExamNotStarted() {
        // Given
        testExam.setStatus(ExamStatus.CREATED);
        when(examRepository.findByAccessCode("TEST01")).thenReturn(Optional.of(testExam));

        // When & Then
        assertThatThrownBy(() -> studentService.joinExam(testStudentDTO))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("尚未開始");

        verify(examRepository).findByAccessCode("TEST01");
        verify(studentRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試學員加入測驗 - 測驗已結束")
    void testJoinExam_ExamEnded() {
        // Given
        testExam.setStatus(ExamStatus.ENDED);
        when(examRepository.findByAccessCode("TEST01")).thenReturn(Optional.of(testExam));

        // When & Then
        assertThatThrownBy(() -> studentService.joinExam(testStudentDTO))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("已結束");

        verify(examRepository).findByAccessCode("TEST01");
        verify(studentRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試根據 sessionId 取得學員 - 成功")
    void testGetStudentBySessionId_Success() {
        // Given
        Student student = TestDataBuilder.createStudent(testExam);
        student.setId(1L);
        student.setSessionId("session-123");

        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(student));

        // When
        StudentDTO result = studentService.getStudentBySessionId("session-123");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getSessionId()).isEqualTo("session-123");

        verify(studentRepository).findBySessionId("session-123");
    }

    @Test
    @DisplayName("測試根據 sessionId 取得學員 - 找不到學員")
    void testGetStudentBySessionId_NotFound() {
        // Given
        when(studentRepository.findBySessionId("invalid")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> studentService.getStudentBySessionId("invalid"))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(studentRepository).findBySessionId("invalid");
    }
}
