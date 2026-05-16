package com.exam.system.service;

import com.exam.system.dto.ExamDTO;
import com.exam.system.dto.QuestionDTO;
import com.exam.system.entity.*;
import com.exam.system.exception.AuthException;
import com.exam.system.repository.*;
import com.exam.system.websocket.WebSocketService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * ExamService 帳號隔離整合測試
 * 使用真實的 CurrentUserProvider + OwnershipGuard，透過 SecurityContextHolder 設定測試使用者，
 * 驗證 createExam 自動指派 owner、getAllExams 角色分流、以及 ownership 守衛行為
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ExamService 帳號隔離測試")
class ExamServiceIsolationTest {

    // ==================== Mock 所有外部相依 ====================

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
    @Mock
    private SurveyFieldRepository surveyFieldRepository;
    @Mock
    private ExamSurveyFieldConfigRepository examSurveyFieldConfigRepository;

    // ==================== 真實的 ownership chain ====================

    /** 真實實例：從 SecurityContextHolder 讀取 principal */
    private CurrentUserProvider currentUserProvider;

    /** 真實實例：依賴 currentUserProvider 進行 owner 判斷 */
    private OwnershipGuard ownershipGuard;

    private ExamService examService;

    /** 測試用第一位講師 */
    private User instructor1;

    /** 測試用第二位講師 */
    private User instructor2;

    /** 測試用管理員 */
    private User admin;

    @BeforeEach
    void setUp() {
        currentUserProvider = new CurrentUserProvider();
        ownershipGuard = new OwnershipGuard(currentUserProvider);

        examService = new ExamService(
                examRepository,
                questionRepository,
                questionOptionRepository,
                studentRepository,
                qrCodeService,
                webSocketService,
                statisticsService,
                examSecurityService,
                surveyFieldRepository,
                examSurveyFieldConfigRepository,
                currentUserProvider,
                ownershipGuard
        );

        // 建立測試使用者
        instructor1 = buildUser(1L, "inst1@test.com", UserRole.INSTRUCTOR);
        instructor2 = buildUser(2L, "inst2@test.com", UserRole.INSTRUCTOR);
        admin = buildUser(99L, "admin@test.com", UserRole.ADMIN);
    }

    @AfterEach
    void clearSecurityContext() {
        // 確保每個測試後清除 SecurityContextHolder，避免狀態污染
        SecurityContextHolder.clearContext();
    }

    // ==================== createExam 測試 ====================

    /**
     * createExam 應自動將當前登入使用者設為測驗 owner
     */
    @Test
    @DisplayName("createExam：自動指派當前使用者為 owner")
    void createExam_assignsCurrentUserAsOwner() {
        // 設定安全上下文為 instructor1
        loginAs(instructor1);

        // 準備 mock 回應
        when(qrCodeService.generateAccessCode()).thenReturn("AB1234");
        when(examRepository.save(any(Exam.class))).thenAnswer(inv -> {
            Exam e = inv.getArgument(0);
            e.setId(10L);
            return e;
        });
        when(studentRepository.countByExamId(anyLong())).thenReturn(0L);

        ExamDTO dto = ExamDTO.builder()
                .title("隔離測試")
                .description("測試")
                .questionTimeLimit(30)
                .questions(Collections.emptyList())
                .build();

        ExamDTO result = examService.createExam(dto);

        // 驗證 save 被呼叫時，exam 已帶有 owner
        verify(examRepository, atLeastOnce()).save(argThat(exam ->
                exam.getOwner() != null && exam.getOwner().getId().equals(instructor1.getId())));
        assertThat(result).isNotNull();
    }

    // ==================== getAllExams 測試 ====================

    /**
     * ADMIN 呼叫 getAllExams 應使用 findAll，取回全部測驗
     */
    @Test
    @DisplayName("getAllExams：ADMIN 取回所有測驗")
    void getAllExams_adminGetsAll() {
        loginAs(admin);

        Exam exam1 = buildExam(1L, "Exam-A", instructor1);
        Exam exam2 = buildExam(2L, "Exam-B", instructor2);
        when(examRepository.findAll()).thenReturn(List.of(exam1, exam2));
        when(studentRepository.countByExamId(anyLong())).thenReturn(0L);

        List<ExamDTO> result = examService.getAllExams();

        assertThat(result).hasSize(2);
        verify(examRepository).findAll();
        verify(examRepository, never()).findByOwnerIdOrderByCreatedAtDesc(anyLong());
    }

    /**
     * INSTRUCTOR 呼叫 getAllExams 應使用 findByOwnerId，只取回自己的測驗
     */
    @Test
    @DisplayName("getAllExams：INSTRUCTOR 只取回自己的測驗")
    void getAllExams_instructorGetsOwnOnly() {
        loginAs(instructor1);

        Exam exam1 = buildExam(1L, "Exam-A", instructor1);
        when(examRepository.findByOwnerIdOrderByCreatedAtDesc(instructor1.getId()))
                .thenReturn(List.of(exam1));
        when(studentRepository.countByExamId(anyLong())).thenReturn(0L);

        List<ExamDTO> result = examService.getAllExams();

        assertThat(result).hasSize(1);
        verify(examRepository).findByOwnerIdOrderByCreatedAtDesc(instructor1.getId());
        verify(examRepository, never()).findAll();
    }

    // ==================== getExam 擁有者守衛測試 ====================

    /**
     * 測驗的 owner 本人可以讀取自己的測驗
     */
    @Test
    @DisplayName("getExam：owner 本人可讀取")
    void getExam_ownerCanAccess() {
        loginAs(instructor1);

        Exam exam = buildExam(5L, "My Exam", instructor1);
        when(examRepository.findById(5L)).thenReturn(Optional.of(exam));
        when(studentRepository.countByExamId(5L)).thenReturn(0L);

        ExamDTO result = examService.getExam(5L);
        assertThat(result.getId()).isEqualTo(5L);
    }

    /**
     * 其他講師嘗試讀取別人的測驗，應拋出 403 AuthException
     */
    @Test
    @DisplayName("getExam：非 owner 拋出 403")
    void getExam_nonOwnerGetsForbidden() {
        loginAs(instructor2);

        Exam exam = buildExam(5L, "Other's Exam", instructor1);
        when(examRepository.findById(5L)).thenReturn(Optional.of(exam));

        assertThatThrownBy(() -> examService.getExam(5L))
                .isInstanceOf(AuthException.class)
                .satisfies(ex -> assertThat(((AuthException) ex).getCode())
                        .isEqualTo("EXAM_FORBIDDEN"));
    }

    // ==================== 輔助方法 ====================

    /**
     * 設定 SecurityContextHolder 的登入使用者
     */
    private void loginAs(User user) {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(user, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    /**
     * 建立測試用 User
     */
    private User buildUser(Long id, String email, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setRole(role);
        return user;
    }

    /**
     * 建立測試用 Exam（附帶 owner）；accessCode 以 id 補零確保 6 字元以內
     */
    private Exam buildExam(Long id, String title, User owner) {
        Exam exam = Exam.builder()
                .title(title)
                .questionTimeLimit(30)
                .status(ExamStatus.CREATED)
                .currentQuestionIndex(0)
                .accessCode(String.format("T%05d", id))
                .owner(owner)
                .build();
        exam.setId(id);
        return exam;
    }
}
