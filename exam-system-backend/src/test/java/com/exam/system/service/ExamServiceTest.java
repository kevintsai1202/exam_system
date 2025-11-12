package com.exam.system.service;

import com.exam.system.TestDataBuilder;
import com.exam.system.dto.ExamDTO;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import com.exam.system.websocket.WebSocketService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ExamService 測試類別
 * 測試測驗服務層的業務邏輯
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExamService 測試")
class ExamServiceTest {

    @Mock
    private ExamRepository examRepository;

    @Mock
    private QuestionRepository questionRepository;

    @Mock
    private QuestionOptionRepository questionOptionRepository;

    @Mock
    private StudentRepository studentRepository;

    @Mock
    private QRCodeService qrCodeService;

    @Mock
    private WebSocketService webSocketService;

    @Mock
    private StatisticsService statisticsService;

    @Mock
    private ExamSecurityService examSecurityService;

    private ExamService examService;

    private Exam testExam;
    private ExamDTO testExamDTO;
    private List<Question> testQuestions;
    private List<QuestionOption> testOptions;

    @BeforeEach
    void setUp() {
        // 手動建立 ExamService 實例
        examService = new ExamService(
                examRepository,
                questionRepository,
                questionOptionRepository,
                studentRepository,
                qrCodeService,
                webSocketService,
                statisticsService,
                examSecurityService
        );

        // 建立測試資料
        testExam = TestDataBuilder.createExam();
        testExam.setId(1L);

        testExamDTO = TestDataBuilder.createExamDTO();

        // 建立測試題目
        testQuestions = new ArrayList<>();
        Question q1 = TestDataBuilder.createQuestion(testExam, 1);
        q1.setId(1L);
        testQuestions.add(q1);

        // 建立測試選項
        testOptions = new ArrayList<>();
        QuestionOption opt1 = TestDataBuilder.createOption(q1, 1, "選項 A");
        opt1.setId(1L);
        QuestionOption opt2 = TestDataBuilder.createOption(q1, 2, "選項 B");
        opt2.setId(2L);
        testOptions.add(opt1);
        testOptions.add(opt2);
    }

    @Test
    @DisplayName("測試建立測驗 - 成功")
    void testCreateExam_Success() {
        // Given
        when(qrCodeService.generateAccessCode()).thenReturn("ABC123");
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> {
            Exam exam = invocation.getArgument(0);
            exam.setId(1L);
            return exam;
        });
        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setId(1L);
            // 自動設定選項的 ID（模擬 cascade 儲存）
            for (QuestionOption opt : q.getOptions()) {
                if (opt.getId() == null) {
                    opt.setId((long) (q.getOptions().indexOf(opt) + 1));
                }
            }
            return q;
        });
        when(studentRepository.countByExamId(anyLong())).thenReturn(0L);

        // When
        ExamDTO result = examService.createExam(testExamDTO);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo(testExamDTO.getTitle());
        assertThat(result.getAccessCode()).isEqualTo("ABC123");
        assertThat(result.getStatus()).isEqualTo(ExamStatus.CREATED);

        verify(qrCodeService, atLeastOnce()).generateAccessCode();
        verify(examRepository, times(2)).save(any(Exam.class)); // 儲存兩次：一次建立測驗，一次加入題目
    }

    @Test
    @DisplayName("測試建立測驗 - accessCode 衝突時重新生成")
    void testCreateExam_AccessCodeCollision() {
        // Given
        when(qrCodeService.generateAccessCode())
                .thenReturn("ABC123")  // 第一次衝突
                .thenReturn("XYZ789"); // 第二次成功

        // 模擬第一次 save 拋出 DataIntegrityViolationException，第二次成功
        when(examRepository.save(any(Exam.class)))
                .thenThrow(new DataIntegrityViolationException("Duplicate accessCode"))  // 第一次失敗
                .thenAnswer(invocation -> {  // 第二次成功
                    Exam exam = invocation.getArgument(0);
                    exam.setId(1L);
                    return exam;
                })
                .thenAnswer(invocation -> invocation.getArgument(0));  // 第三次（最後保存題目）

        when(questionRepository.save(any(Question.class))).thenAnswer(invocation -> {
            Question q = invocation.getArgument(0);
            q.setId(1L);
            // 自動設定選項的 ID（模擬 cascade 儲存）
            for (QuestionOption opt : q.getOptions()) {
                if (opt.getId() == null) {
                    opt.setId((long) (q.getOptions().indexOf(opt) + 1));
                }
            }
            return q;
        });
        when(studentRepository.countByExamId(anyLong())).thenReturn(0L);

        // When
        ExamDTO result = examService.createExam(testExamDTO);

        // Then
        assertThat(result.getAccessCode()).isEqualTo("XYZ789");
        verify(qrCodeService, times(2)).generateAccessCode();
    }

    @Test
    @DisplayName("測試根據 ID 取得測驗 - 成功")
    void testGetExam_Success() {
        // Given
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));
        when(studentRepository.countByExamId(1L)).thenReturn(0L);

        // When
        ExamDTO result = examService.getExam(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getTitle()).isEqualTo(testExam.getTitle());

        verify(examRepository).findById(1L);
    }

    @Test
    @DisplayName("測試根據 ID 取得測驗 - 測驗不存在")
    void testGetExam_NotFound() {
        // Given
        when(examRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> examService.getExam(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Exam")
                .hasMessageContaining("999");

        verify(examRepository).findById(999L);
    }

    @Test
    @DisplayName("測試根據 accessCode 取得測驗 - 成功")
    void testGetExamByAccessCode_Success() {
        // Given
        when(examRepository.findByAccessCode("TEST01")).thenReturn(Optional.of(testExam));
        when(studentRepository.countByExamId(1L)).thenReturn(0L);

        // When
        ExamDTO result = examService.getExamByAccessCode("TEST01");

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getAccessCode()).isEqualTo("TEST01");

        verify(examRepository).findByAccessCode("TEST01");
    }

    @Test
    @DisplayName("測試根據 accessCode 取得測驗 - 無效代碼")
    void testGetExamByAccessCode_InvalidCode() {
        // Given
        when(examRepository.findByAccessCode("INVALID")).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> examService.getExamByAccessCode("INVALID"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("accessCode");

        verify(examRepository).findByAccessCode("INVALID");
    }

    @Test
    @DisplayName("測試啟動測驗 - 成功")
    void testStartExam_Success() {
        // Given
        String baseUrl = "http://localhost:5173";
        String joinUrl = "http://localhost:5173/join?code=TEST01";
        String qrCodeBase64 = "data:image/png;base64,abc123";

        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));
        when(qrCodeService.generateJoinUrl("TEST01", baseUrl)).thenReturn(joinUrl);
        when(qrCodeService.generateQRCodeBase64(joinUrl)).thenReturn(qrCodeBase64);
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(studentRepository.countByExamId(1L)).thenReturn(0L);
        doNothing().when(webSocketService).broadcastExamStatus(anyLong(), any());

        // When
        ExamDTO result = examService.startExam(1L, baseUrl);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(ExamStatus.STARTED);
        assertThat(result.getQrCodeUrl()).isEqualTo(joinUrl);
        assertThat(result.getQrCodeBase64()).isEqualTo(qrCodeBase64);
        assertThat(result.getInstructorSessionId()).isNotNull();  // Session ID 應該被生成
        assertThat(testExam.getStatus()).isEqualTo(ExamStatus.STARTED);
        assertThat(testExam.getStartedAt()).isNotNull();

        verify(examRepository).findById(1L);
        verify(examRepository).save(testExam);
        verify(qrCodeService).generateJoinUrl("TEST01", baseUrl);
        verify(qrCodeService).generateQRCodeBase64(joinUrl);
        verify(webSocketService).broadcastExamStatus(eq(1L), any());
    }

    @Test
    @DisplayName("測試啟動測驗 - 測驗已啟動")
    void testStartExam_AlreadyStarted() {
        // Given
        testExam.setStatus(ExamStatus.STARTED);
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));

        // When & Then
        assertThatThrownBy(() -> examService.startExam(1L, "http://localhost:5173"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("已經啟動");

        verify(examRepository).findById(1L);
        verify(examRepository, never()).save(any());
    }

    @Test
    @DisplayName("測試開始題目 - 成功")
    void testStartQuestion_Success() {
        // Given
        testExam.setStatus(ExamStatus.STARTED);

        // 先啟動測驗以獲取 sessionId
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));
        when(qrCodeService.generateJoinUrl(anyString(), anyString())).thenReturn("http://test");
        when(qrCodeService.generateQRCodeBase64(anyString())).thenReturn("base64");
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(studentRepository.countByExamId(1L)).thenReturn(0L);
        doNothing().when(webSocketService).broadcastExamStatus(anyLong(), any());

        testExam.setStatus(ExamStatus.CREATED);  // Reset status
        ExamDTO startedExam = examService.startExam(1L, "http://localhost:5173");
        String sessionId = startedExam.getInstructorSessionId();

        // 設定開始題目所需的 mock
        when(questionRepository.findByExamIdOrderByQuestionOrderAsc(1L)).thenReturn(testQuestions);
        when(questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(1L)).thenReturn(testOptions);
        doNothing().when(webSocketService).broadcastQuestion(anyLong(), any());

        // When
        examService.startQuestion(1L, 0, sessionId);

        // Then
        assertThat(testExam.getCurrentQuestionIndex()).isEqualTo(0);

        verify(questionRepository).findByExamIdOrderByQuestionOrderAsc(1L);
        verify(questionOptionRepository).findByQuestionIdOrderByOptionOrderAsc(1L);
        verify(webSocketService).broadcastQuestion(eq(1L), any());
    }

    @Test
    @DisplayName("測試開始題目 - 測驗未啟動（無 Session）")
    void testStartQuestion_ExamNotStarted() {
        // Given - 沒有先啟動測驗，所以沒有 sessionId

        // When & Then
        assertThatThrownBy(() -> examService.startQuestion(1L, 0, "invalid-session"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Session");

        verify(examRepository, never()).save(any());
        verify(questionRepository, never()).findByExamIdOrderByQuestionOrderAsc(anyLong());
    }

    @Test
    @DisplayName("測試開始題目 - 缺少 Session ID")
    void testStartQuestion_MissingSessionId() {
        // When & Then
        assertThatThrownBy(() -> examService.startQuestion(1L, 0, null))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("缺少講師 Session ID");
    }

    @Test
    @DisplayName("測試取得測驗的所有題目")
    void testGetExamQuestions() {
        // Given
        testQuestions.get(0).setOptions(testOptions);
        when(questionRepository.findByExamIdWithOptions(1L)).thenReturn(testQuestions);

        // When
        List<com.exam.system.dto.QuestionDTO> result = examService.getExamQuestions(1L);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getQuestionText()).isEqualTo("測試題目 1");
        assertThat(result.get(0).getOptions()).hasSize(2);

        verify(questionRepository).findByExamIdWithOptions(1L);
    }

    @Test
    @DisplayName("測試結束測驗 - 成功")
    void testEndExam_Success() {
        // Given - 先啟動測驗以獲取 sessionId
        testExam.setStatus(ExamStatus.CREATED);
        when(examRepository.findById(1L)).thenReturn(Optional.of(testExam));
        when(qrCodeService.generateJoinUrl(anyString(), anyString())).thenReturn("http://test");
        when(qrCodeService.generateQRCodeBase64(anyString())).thenReturn("base64");
        when(examRepository.save(any(Exam.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(studentRepository.countByExamId(1L)).thenReturn(0L);
        doNothing().when(webSocketService).broadcastExamStatus(anyLong(), any());
        doNothing().when(statisticsService).broadcastLeaderboard(anyLong(), anyInt());

        ExamDTO startedExam = examService.startExam(1L, "http://localhost:5173");
        String sessionId = startedExam.getInstructorSessionId();

        // When
        examService.endExam(1L, sessionId);

        // Then
        assertThat(testExam.getStatus()).isEqualTo(ExamStatus.ENDED);
        assertThat(testExam.getEndedAt()).isNotNull();

        verify(webSocketService, times(2)).broadcastExamStatus(eq(1L), any());  // start + end
        verify(statisticsService).broadcastLeaderboard(1L, 20);
    }

    @Test
    @DisplayName("測試結束測驗 - 無效 Session")
    void testEndExam_InvalidSession() {
        // Given - 沒有先啟動測驗，所以沒有 sessionId

        // When & Then - 使用錯誤的 sessionId
        assertThatThrownBy(() -> examService.endExam(1L, "wrong-session"))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Session");

        verify(examRepository, never()).save(any());
    }
}
