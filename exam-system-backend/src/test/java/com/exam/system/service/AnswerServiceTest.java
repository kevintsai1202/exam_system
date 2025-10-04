package com.exam.system.service;

import com.exam.system.TestDataBuilder;
import com.exam.system.dto.AnswerDTO;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AnswerService 測試類別
 * 測試答案服務層的業務邏輯
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AnswerService 測試")
class AnswerServiceTest {

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @Mock
    private StatisticsService statisticsService;

    @InjectMocks
    private AnswerService answerService;

    private Exam testExam;
    private Student testStudent;
    private Question testQuestion;
    private QuestionOption testOption1;
    private QuestionOption testOption2;
    private AnswerDTO testAnswerDTO;

    @BeforeEach
    void setUp() {
        // 建立測試資料
        testExam = TestDataBuilder.createExam();
        testExam.setId(1L);

        testStudent = TestDataBuilder.createStudent(testExam);
        testStudent.setId(1L);
        testStudent.setSessionId("session-123");
        testStudent.setTotalScore(0);

        testQuestion = TestDataBuilder.createQuestion(testExam, 1);
        testQuestion.setId(1L);
        testQuestion.setCorrectOptionId(1L); // 正確答案是選項1

        testOption1 = TestDataBuilder.createOption(testQuestion, 1, "選項 A");
        testOption1.setId(1L);

        testOption2 = TestDataBuilder.createOption(testQuestion, 2, "選項 B");
        testOption2.setId(2L);

        testAnswerDTO = TestDataBuilder.createAnswerDTO("session-123", 1L, 1L);
    }

    @Test
    @DisplayName("測試提交答案 - 答對且成功")
    void testSubmitAnswer_CorrectAnswer() {
        // Given
        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(testStudent));
        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(answerRepository.existsByStudentIdAndQuestionId(1L, 1L)).thenReturn(false);
        when(questionOptionRepository.findById(1L)).thenReturn(Optional.of(testOption1));
        when(answerRepository.save(any(Answer.class))).thenAnswer(invocation -> {
            Answer a = invocation.getArgument(0);
            a.setId(1L);
            return a;
        });
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(statisticsService).updateQuestionStatistics(anyLong(), anyLong());
        doNothing().when(statisticsService).updateCumulativeStatistics(anyLong());

        // When
        AnswerDTO result = answerService.submitAnswer(testAnswerDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsCorrect()).isTrue();
        assertThat(result.getSelectedOptionId()).isEqualTo(1L);
        assertThat(result.getCurrentTotalScore()).isEqualTo(1); // 答對加1分

        verify(studentRepository).findBySessionId("session-123");
        verify(questionRepository).findById(1L);
        verify(answerRepository).existsByStudentIdAndQuestionId(1L, 1L);
        verify(answerRepository).save(any(Answer.class));
        verify(studentRepository).save(testStudent); // 因為答對所以更新分數
        verify(statisticsService).updateQuestionStatistics(1L, 1L);
        verify(statisticsService).updateCumulativeStatistics(1L);
    }

    @Test
    @DisplayName("測試提交答案 - 答錯")
    void testSubmitAnswer_WrongAnswer() {
        // Given - 選擇錯誤的選項2
        testAnswerDTO.setSelectedOptionId(2L);

        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(testStudent));
        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(answerRepository.existsByStudentIdAndQuestionId(1L, 1L)).thenReturn(false);
        when(questionOptionRepository.findById(2L)).thenReturn(Optional.of(testOption2));
        when(answerRepository.save(any(Answer.class))).thenAnswer(invocation -> {
            Answer a = invocation.getArgument(0);
            a.setId(1L);
            return a;
        });
        doNothing().when(statisticsService).updateQuestionStatistics(anyLong(), anyLong());
        doNothing().when(statisticsService).updateCumulativeStatistics(anyLong());

        // When
        AnswerDTO result = answerService.submitAnswer(testAnswerDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getIsCorrect()).isFalse();
        assertThat(result.getSelectedOptionId()).isEqualTo(2L);
        assertThat(result.getCurrentTotalScore()).isEqualTo(0); // 答錯不加分

        verify(answerRepository).save(any(Answer.class));
        verify(studentRepository, never()).save(any()); // 答錯不更新分數
        verify(statisticsService).updateQuestionStatistics(1L, 1L);
        verify(statisticsService).updateCumulativeStatistics(1L);
    }

    @Test
    @DisplayName("測試提交答案 - 學員不存在")
    void testSubmitAnswer_StudentNotFound() {
        // Given
        when(studentRepository.findBySessionId("invalid")).thenReturn(Optional.empty());
        testAnswerDTO.setSessionId("invalid");

        // When & Then
        assertThatThrownBy(() -> answerService.submitAnswer(testAnswerDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Student");

        verify(studentRepository).findBySessionId("invalid");
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試提交答案 - 題目不存在")
    void testSubmitAnswer_QuestionNotFound() {
        // Given
        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(testStudent));
        when(questionRepository.findById(999L)).thenReturn(Optional.empty());
        testAnswerDTO.setQuestionId(999L);

        // When & Then
        assertThatThrownBy(() -> answerService.submitAnswer(testAnswerDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Question");

        verify(studentRepository).findBySessionId("session-123");
        verify(questionRepository).findById(999L);
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試提交答案 - 已經作答過")
    void testSubmitAnswer_AlreadyAnswered() {
        // Given
        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(testStudent));
        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(answerRepository.existsByStudentIdAndQuestionId(1L, 1L)).thenReturn(true);

        // When & Then
        assertThatThrownBy(() -> answerService.submitAnswer(testAnswerDTO))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("已經作答過");

        verify(studentRepository).findBySessionId("session-123");
        verify(questionRepository).findById(1L);
        verify(answerRepository).existsByStudentIdAndQuestionId(1L, 1L);
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試提交答案 - 選項不存在")
    void testSubmitAnswer_OptionNotFound() {
        // Given
        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(testStudent));
        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(answerRepository.existsByStudentIdAndQuestionId(1L, 1L)).thenReturn(false);
        when(questionOptionRepository.findById(999L)).thenReturn(Optional.empty());
        testAnswerDTO.setSelectedOptionId(999L);

        // When & Then
        assertThatThrownBy(() -> answerService.submitAnswer(testAnswerDTO))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("QuestionOption");

        verify(questionOptionRepository).findById(999L);
        verify(answerRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試取得學員答案記錄 - 成功")
    void testGetStudentAnswers_Success() {
        // Given
        List<Answer> answers = new ArrayList<>();
        Answer answer1 = TestDataBuilder.createAnswer(testStudent, testQuestion, 1L, true);
        answer1.setId(1L);
        answers.add(answer1);

        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(testStudent));
        when(answerRepository.findByStudentId(1L)).thenReturn(answers);
        when(questionOptionRepository.findById(1L)).thenReturn(Optional.of(testOption1));

        // When
        List<AnswerDTO> result = answerService.getStudentAnswers("session-123");

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getSessionId()).isEqualTo("session-123");
        assertThat(result.get(0).getIsCorrect()).isTrue();

        verify(studentRepository).findBySessionId("session-123");
        verify(answerRepository).findByStudentId(1L);
    }

    @Test
    @DisplayName("測試取得學員答案記錄 - 學員不存在")
    void testGetStudentAnswers_StudentNotFound() {
        // Given
        when(studentRepository.findBySessionId("invalid")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> answerService.getStudentAnswers("invalid"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Student");

        verify(studentRepository).findBySessionId("invalid");
        verify(answerRepository, never()).findByStudentId(anyLong());
    }

    @Test
    @DisplayName("測試答對時分數累加")
    void testScoreAccumulation() {
        // Given
        testStudent.setTotalScore(5); // 已有5分

        when(studentRepository.findBySessionId("session-123")).thenReturn(Optional.of(testStudent));
        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(answerRepository.existsByStudentIdAndQuestionId(1L, 1L)).thenReturn(false);
        when(questionOptionRepository.findById(1L)).thenReturn(Optional.of(testOption1));
        when(answerRepository.save(any(Answer.class))).thenAnswer(invocation -> {
            Answer a = invocation.getArgument(0);
            a.setId(1L);
            return a;
        });
        when(studentRepository.save(any(Student.class))).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(statisticsService).updateQuestionStatistics(anyLong(), anyLong());
        doNothing().when(statisticsService).updateCumulativeStatistics(anyLong());

        // When
        AnswerDTO result = answerService.submitAnswer(testAnswerDTO);

        // Then
        assertThat(result.getCurrentTotalScore()).isEqualTo(6); // 5 + 1 = 6
        assertThat(testStudent.getTotalScore()).isEqualTo(6);

        verify(studentRepository).save(testStudent);
    }
}
