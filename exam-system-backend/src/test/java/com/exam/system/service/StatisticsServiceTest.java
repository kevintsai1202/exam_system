package com.exam.system.service;

import com.exam.system.TestDataBuilder;
import com.exam.system.dto.LeaderboardDTO;
import com.exam.system.dto.StatisticsDTO;
import com.exam.system.entity.*;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import com.exam.system.websocket.WebSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * StatisticsService 測試類別
 * 測試統計服務層的業務邏輯
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("StatisticsService 測試")
class StatisticsServiceTest {

    @Mock
    private AnswerRepository answerRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private ExamRepository examRepository;

    @Mock
    private WebSocketService webSocketService;

    @InjectMocks
    private StatisticsService statisticsService;

    private Exam testExam;
    private Question testQuestion;
    private List<QuestionOption> testOptions;
    private List<Student> testStudents;

    @BeforeEach
    void setUp() {
        testExam = TestDataBuilder.createExam();
        testExam.setId(1L);

        testQuestion = TestDataBuilder.createQuestion(testExam, 1);
        testQuestion.setId(1L);
        testQuestion.setCorrectOptionId(1L);

        // 建立3個選項
        testOptions = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            QuestionOption option = TestDataBuilder.createOption(testQuestion, i, "選項 " + i);
            option.setId((long) i);
            testOptions.add(option);
        }

        // 建立5個學員
        testStudents = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Student student = TestDataBuilder.createStudent(testExam);
            student.setId((long) i);
            student.setName("學員" + i);
            student.setTotalScore(i); // 分數從1到5
            testStudents.add(student);
        }
    }

    @Test
    @DisplayName("測試生成題目統計 - 成功")
    void testGenerateQuestionStatistics_Success() {
        // Given
        // 模擬答題情況：10個人作答，6人選1（正確），3人選2，1人選3
        List<Map<String, Object>> optionCounts = new ArrayList<>();
        optionCounts.add(Map.of("optionId", 1L, "count", 6L));
        optionCounts.add(Map.of("optionId", 2L, "count", 3L));
        optionCounts.add(Map.of("optionId", 3L, "count", 1L));

        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(1L)).thenReturn(testOptions);
        when(answerRepository.countByQuestionIdGroupByOption(1L)).thenReturn(optionCounts);
        when(answerRepository.countByQuestionId(1L)).thenReturn(10L);
        when(answerRepository.countByQuestionIdAndIsCorrect(1L, true)).thenReturn(6L);

        // When
        StatisticsDTO.QuestionStatistics result = statisticsService.generateQuestionStatistics(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getQuestionId()).isEqualTo(1L);
        assertThat(result.getTotalAnswers()).isEqualTo(10L);
        assertThat(result.getCorrectRate()).isEqualTo(60.0); // 6/10 = 60%
        assertThat(result.getOptionStatistics()).hasSize(3);

        // 檢查選項統計
        StatisticsDTO.OptionStatistic opt1 = result.getOptionStatistics().get(0);
        assertThat(opt1.getOptionId()).isEqualTo(1L);
        assertThat(opt1.getCount()).isEqualTo(6L);
        assertThat(opt1.getPercentage()).isEqualTo(60.0);
        assertThat(opt1.getIsCorrect()).isTrue();

        StatisticsDTO.OptionStatistic opt2 = result.getOptionStatistics().get(1);
        assertThat(opt2.getCount()).isEqualTo(3L);
        assertThat(opt2.getPercentage()).isEqualTo(30.0);
        assertThat(opt2.getIsCorrect()).isFalse();

        verify(questionRepository).findById(1L);
        verify(answerRepository).countByQuestionId(1L);
        verify(answerRepository).countByQuestionIdAndIsCorrect(1L, true);
    }

    @Test
    @DisplayName("測試生成題目統計 - 無人作答")
    void testGenerateQuestionStatistics_NoAnswers() {
        // Given
        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(1L)).thenReturn(testOptions);
        when(answerRepository.countByQuestionIdGroupByOption(1L)).thenReturn(new ArrayList<>());
        when(answerRepository.countByQuestionId(1L)).thenReturn(0L);
        when(answerRepository.countByQuestionIdAndIsCorrect(1L, true)).thenReturn(0L);

        // When
        StatisticsDTO.QuestionStatistics result = statisticsService.generateQuestionStatistics(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTotalAnswers()).isEqualTo(0L);
        assertThat(result.getCorrectRate()).isEqualTo(0.0);
        assertThat(result.getOptionStatistics()).hasSize(3);

        // 所有選項的計數都應該是0
        result.getOptionStatistics().forEach(opt -> {
            assertThat(opt.getCount()).isEqualTo(0L);
            assertThat(opt.getPercentage()).isEqualTo(0.0);
        });
    }

    @Test
    @DisplayName("測試生成題目統計 - 題目不存在")
    void testGenerateQuestionStatistics_QuestionNotFound() {
        // Given
        when(questionRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> statisticsService.generateQuestionStatistics(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Question");

        verify(questionRepository).findById(999L);
    }

    @Test
    @DisplayName("測試更新題目統計並推送")
    void testUpdateQuestionStatistics() {
        // Given
        List<Map<String, Object>> optionCounts = new ArrayList<>();
        optionCounts.add(Map.of("optionId", 1L, "count", 5L));

        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(1L)).thenReturn(testOptions);
        when(answerRepository.countByQuestionIdGroupByOption(1L)).thenReturn(optionCounts);
        when(answerRepository.countByQuestionId(1L)).thenReturn(5L);
        when(answerRepository.countByQuestionIdAndIsCorrect(1L, true)).thenReturn(5L);
        doNothing().when(webSocketService).broadcastQuestionStatistics(anyLong(), anyLong(), any());

        // When
        statisticsService.updateQuestionStatistics(1L, 1L);

        // Then
        verify(webSocketService).broadcastQuestionStatistics(eq(1L), eq(1L), any());
    }


    @Test
    @DisplayName("測試生成累積統計 - 無學員")
    void testGenerateCumulativeStatistics_NoStudents() {
        // Given
        when(studentRepository.countByExamIdGroupByTotalScore(1L)).thenReturn(new ArrayList<>());
        when(studentRepository.countByExamId(1L)).thenReturn(0L);
        when(questionRepository.countByExamId(1L)).thenReturn(5L);

        // When
        StatisticsDTO.CumulativeStatistics result = statisticsService.generateCumulativeStatistics(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTotalStudents()).isEqualTo(0L);
        assertThat(result.getScoreDistribution()).isEmpty();
    }

    @Test
    @DisplayName("測試更新累積統計並推送")
    void testUpdateCumulativeStatistics() {
        // Given
        when(studentRepository.countByExamIdGroupByTotalScore(1L)).thenReturn(new ArrayList<>());
        when(studentRepository.countByExamId(1L)).thenReturn(0L);
        when(questionRepository.countByExamId(1L)).thenReturn(5L);
        doNothing().when(webSocketService).broadcastCumulativeStatistics(anyLong(), any());

        // When
        statisticsService.updateCumulativeStatistics(1L);

        // Then
        verify(webSocketService).broadcastCumulativeStatistics(eq(1L), any());
    }


    @Test
    @DisplayName("測試百分比計算精度")
    void testPercentageCalculation() {
        // Given - 測試 33.33% 的情況
        List<Map<String, Object>> optionCounts = new ArrayList<>();
        optionCounts.add(Map.of("optionId", 1L, "count", 1L));
        optionCounts.add(Map.of("optionId", 2L, "count", 1L));
        optionCounts.add(Map.of("optionId", 3L, "count", 1L));

        when(questionRepository.findById(1L)).thenReturn(Optional.of(testQuestion));
        when(questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(1L)).thenReturn(testOptions);
        when(answerRepository.countByQuestionIdGroupByOption(1L)).thenReturn(optionCounts);
        when(answerRepository.countByQuestionId(1L)).thenReturn(3L);
        when(answerRepository.countByQuestionIdAndIsCorrect(1L, true)).thenReturn(1L);

        // When
        StatisticsDTO.QuestionStatistics result = statisticsService.generateQuestionStatistics(1L);

        // Then
        // 檢查百分比精度（應該四捨五入到小數點後2位）
        result.getOptionStatistics().forEach(opt -> {
            assertThat(opt.getPercentage()).isEqualTo(33.33);
        });
        assertThat(result.getCorrectRate()).isEqualTo(33.33); // 1/3 = 33.33%
    }
}
