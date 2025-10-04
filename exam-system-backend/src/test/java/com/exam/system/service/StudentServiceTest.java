package com.exam.system.service;

import com.exam.system.TestDataBuilder;
import com.exam.system.dto.StudentDTO;
import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import com.exam.system.entity.Student;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.ExamRepository;
import com.exam.system.repository.StudentRepository;
import com.exam.system.websocket.WebSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
