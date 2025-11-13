package com.exam.system.service;

import com.exam.system.dto.*;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import com.exam.system.websocket.WebSocketService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 測驗服務
 * 處理測驗相關的業務邏輯
 */
@Slf4j
@Service
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final StudentRepository studentRepository;
    private final QRCodeService qrCodeService;
    private final WebSocketService webSocketService;
    private final StatisticsService statisticsService;
    private final ExamSecurityService examSecurityService;
    private final SurveyFieldRepository surveyFieldRepository;
    private final ExamSurveyFieldConfigRepository examSurveyFieldConfigRepository;
    /**
     * 建構子注入（使用 @Lazy 解決循環依賴）
     */
    public ExamService(
            ExamRepository examRepository,
            QuestionRepository questionRepository,
            QuestionOptionRepository questionOptionRepository,
            StudentRepository studentRepository,
            QRCodeService qrCodeService,
            WebSocketService webSocketService,
            @Lazy StatisticsService statisticsService,
            ExamSecurityService examSecurityService,
            SurveyFieldRepository surveyFieldRepository,
            ExamSurveyFieldConfigRepository examSurveyFieldConfigRepository
    ) {
        this.examRepository = examRepository;
        this.questionRepository = questionRepository;
        this.questionOptionRepository = questionOptionRepository;
        this.studentRepository = studentRepository;
        this.qrCodeService = qrCodeService;
        this.webSocketService = webSocketService;
        this.statisticsService = statisticsService;
        this.examSecurityService = examSecurityService;
        this.surveyFieldRepository = surveyFieldRepository;
        this.examSurveyFieldConfigRepository = examSurveyFieldConfigRepository;
    }

    /**
     * 建立新測驗
     *
     * @param examDTO 測驗 DTO
     * @return 建立的測驗 DTO
     */
    @Transactional
    public ExamDTO createExam(ExamDTO examDTO) {
        log.info("Creating new exam: {}", examDTO.getTitle());

        // 最多重試 5 次以處理並發 accessCode 衝突
        int maxRetries = 5;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // 生成唯一的 accessCode
                String accessCode = qrCodeService.generateAccessCode();

                // 建立測驗實體
                Exam exam = Exam.builder()
                        .title(examDTO.getTitle())
                        .description(examDTO.getDescription())
                        .questionTimeLimit(examDTO.getQuestionTimeLimit())
                        .status(ExamStatus.CREATED)
                        .currentQuestionIndex(0)
                        .accessCode(accessCode)
                        .build();

                // 儲存測驗以獲得 ID（如果 accessCode 重複會拋出 DataIntegrityViolationException）
                exam = examRepository.save(exam);

                // 建立調查欄位配置
                if (examDTO.getSurveyFieldConfigs() != null && !examDTO.getSurveyFieldConfigs().isEmpty()) {
                    for (ExamSurveyFieldConfigDTO configDTO : examDTO.getSurveyFieldConfigs()) {
                        // 根據 fieldKey 找到對應的 SurveyField
                        SurveyField surveyField = surveyFieldRepository.findByFieldKey(configDTO.getFieldKey())
                                .orElseThrow(() -> new ResourceNotFoundException("SurveyField", "fieldKey", configDTO.getFieldKey()));

                        // 建立配置
                        ExamSurveyFieldConfig config = ExamSurveyFieldConfig.builder()
                                .exam(exam)
                                .surveyField(surveyField)
                                .isRequired(configDTO.getIsRequired())
                                .displayOrder(configDTO.getDisplayOrder())
                                .build();

                        exam.getSurveyFieldConfigs().add(config);
                    }
                }

                // 建立題目和選項
                for (QuestionDTO questionDTO : examDTO.getQuestions()) {
                    Question question = createQuestionFromDTO(questionDTO, exam);
                    exam.addQuestion(question);
                }

                // 再次儲存以包含題目與調查欄位配置
                exam = examRepository.save(exam);

                log.info("Exam created successfully with ID: {} and accessCode: {} (attempt: {})",
                    exam.getId(), exam.getAccessCode(), attempt + 1);
                return convertToDTO(exam);

            } catch (DataIntegrityViolationException e) {
                // accessCode 衝突，檢查是否為最後一次嘗試
                if (attempt == maxRetries - 1) {
                    log.error("Failed to generate unique accessCode after {} attempts", maxRetries);
                    throw new BusinessException("ACCESS_CODE_GENERATION_FAILED",
                        "無法生成唯一的測驗代碼，請重試");
                }
                // 否則繼續重試
                log.warn("AccessCode collision detected, retrying... (attempt: {}/{})", attempt + 1, maxRetries);

                // 短暫延遲後重試，避免立即衝突
                try {
                    Thread.sleep(50);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new BusinessException("EXAM_CREATION_INTERRUPTED", "測驗建立被中斷");
                }
            }
        }

        // 理論上不會執行到這裡，但為了編譯器滿意
        throw new BusinessException("ACCESS_CODE_GENERATION_FAILED", "無法生成唯一的測驗代碼");
    }

    /**
     * 取得所有測驗
     *
     * @return 測驗 DTO 列表
     */
    @Transactional(readOnly = true)
    public List<ExamDTO> getAllExams() {
        log.info("Getting all exams");
        List<Exam> exams = examRepository.findAll();
        return exams.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 根據 ID 取得測驗
     *
     * @param examId 測驗 ID
     * @return 測驗 DTO
     */
    @Transactional(readOnly = true)
    public ExamDTO getExam(Long examId) {
        Exam exam = findExamById(examId);
        return convertToDTO(exam);
    }

    /**
     * 根據 accessCode 取得測驗
     *
     * @param accessCode 加入碼
     * @return 測驗 DTO
     */
    @Transactional(readOnly = true)
    public ExamDTO getExamByAccessCode(String accessCode) {
        Exam exam = examRepository.findByAccessCode(accessCode)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "accessCode", accessCode));
        return convertToDTO(exam);
    }

    /**
     * 啟動測驗
     * 第一個啟動的人會獲得 Session ID 並綁定（3小時有效）
     *
     * @param examId 測驗 ID
     * @param baseUrl 前端基礎 URL（用於生成 QR Code）
     * @return 包含 QR Code 和 instructorSessionId 的測驗 DTO
     */
    @Transactional
    public ExamDTO startExam(Long examId, String baseUrl) {
        log.info("Starting exam: {}", examId);

        Exam exam = findExamById(examId);

        // 驗證測驗狀態：只允許 CREATED 狀態的測驗啟動
        if (exam.getStatus() != ExamStatus.CREATED) {
            throw new BusinessException("EXAM_ALREADY_STARTED", "測驗已經啟動或結束");
        }

        // 使用 ExamSecurityService 建立講師 Session
        String instructorSessionId = examSecurityService.createInstructorSession(examId);

        // 啟動測驗
        exam.start();
        exam = examRepository.save(exam);

        // 生成 QR Code
        String joinUrl = qrCodeService.generateJoinUrl(exam.getAccessCode(), baseUrl);
        String qrCodeBase64 = qrCodeService.generateQRCodeBase64(joinUrl);

        // 透過 WebSocket 廣播測驗啟動事件
        Map<String, Object> statusData = new HashMap<>();
        statusData.put("examId", exam.getId());
        statusData.put("status", exam.getStatus());
        statusData.put("startedAt", exam.getStartedAt());

        webSocketService.broadcastExamStatus(examId, WebSocketMessage.examStarted(statusData));

        log.info("Exam started successfully: {}", examId);

        ExamDTO dto = convertToDTO(exam);
        dto.setQrCodeUrl(joinUrl);
        dto.setQrCodeBase64(qrCodeBase64);
        dto.setInstructorSessionId(instructorSessionId);  // 回傳給前端
        return dto;
    }

    /**
     * 開始特定題目
     *
     * @param examId 測驗 ID
     * @param questionIndex 題目索引（從 0 開始）
     * @param instructorSessionId 講師 Session ID
     */
    @Transactional
    public void startQuestion(Long examId, Integer questionIndex, String instructorSessionId) {
        log.info("Starting question {} for exam: {} by instructor session: {}", questionIndex, examId, instructorSessionId);

        Exam exam = findExamById(examId);

        // 驗證講師權限（使用 ExamSecurityService）
        if (!examSecurityService.validateInstructorSession(exam, instructorSessionId)) {
            throw new BusinessException("SESSION_NOT_FOUND", "測驗未啟動或 Session 已過期");
        }

        // 驗證測驗狀態
        if (exam.getStatus() != ExamStatus.STARTED) {
            throw new BusinessException("EXAM_NOT_STARTED", "測驗尚未啟動");
        }

        // 驗證題目索引
        List<Question> questions = questionRepository.findByExamIdOrderByQuestionOrderAsc(examId);
        if (questionIndex < 0 || questionIndex >= questions.size()) {
            throw new BusinessException("INVALID_QUESTION_INDEX", "無效的題目索引");
        }

        // 更新當前題目索引為下一題（與前端語義保持一致）和題目開始時間
        exam.setCurrentQuestionIndex(questionIndex + 1);
        exam.setCurrentQuestionStartedAt(LocalDateTime.now());
        examRepository.save(exam);

        // 取得題目資訊
        Question question = questions.get(questionIndex);
        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(question.getId());

        // 建立題目推送資料（不包含正確答案）
        Map<String, Object> questionData = new HashMap<>();
        questionData.put("questionId", question.getId());
        questionData.put("questionIndex", questionIndex);
        questionData.put("questionText", question.getQuestionText());
        questionData.put("timeLimit", exam.getQuestionTimeLimit());

        // 計算到期時間（使用 UTC 時間戳，避免時區問題）
        Instant expiresAt = Instant.now().plusSeconds(exam.getQuestionTimeLimit());
        questionData.put("expiresAt", expiresAt);

        questionData.put("options", options.stream()
                .map(opt -> Map.of(
                        "id", opt.getId(),
                        "optionOrder", opt.getOptionOrder(),
                        "optionText", opt.getOptionText()
                ))
                .collect(Collectors.toList()));

        // 透過 WebSocket 廣播題目
        webSocketService.broadcastQuestion(examId, WebSocketMessage.questionStarted(questionData));

        log.info("Question {} started for exam: {}", questionIndex, examId);
    }

    /**
     * 結束測驗
     *
     * @param examId 測驗 ID
     * @param instructorSessionId 講師 Session ID
     */
    @Transactional
    public void endExam(Long examId, String instructorSessionId) {
        log.info("Ending exam: {} by instructor session: {}", examId, instructorSessionId);

        Exam exam = findExamById(examId);

        // 驗證講師權限（使用 ExamSecurityService）
        if (!examSecurityService.validateInstructorSession(exam, instructorSessionId)) {
            throw new BusinessException("SESSION_NOT_FOUND", "測驗未啟動或 Session 已過期");
        }

        // 驗證測驗狀態
        if (exam.getStatus() != ExamStatus.STARTED) {
            throw new BusinessException("EXAM_NOT_STARTED", "測驗尚未啟動");
        }

        // 結束測驗
        exam.end();
        examRepository.save(exam);

        // 使用 ExamSecurityService 清除講師 Session
        examSecurityService.clearInstructorSession(examId);

        // 透過 WebSocket 廣播測驗結束事件
        Map<String, Object> statusData = new HashMap<>();
        statusData.put("examId", exam.getId());
        statusData.put("status", exam.getStatus());
        statusData.put("endedAt", exam.getEndedAt());

        webSocketService.broadcastExamStatus(examId, WebSocketMessage.examEnded(statusData));

        // 自動廣播排行榜
        statisticsService.broadcastLeaderboard(examId, 20);

        log.info("Exam ended successfully: {}", examId);
    }

    /**
     * 取得測驗的所有題目
     *
     * @param examId 測驗 ID
     * @return 題目列表
     */
    @Transactional(readOnly = true)
    public List<QuestionDTO> getExamQuestions(Long examId) {
        List<Question> questions = questionRepository.findByExamIdWithOptions(examId);
        return questions.stream()
                .map(this::convertQuestionToDTO)
                .collect(Collectors.toList());
    }

    /**
     * 複製測驗（包含所有題目和選項）
     *
     * @param examId 原測驗 ID
     * @return 新測驗 DTO
     */
    @Transactional
    public ExamDTO duplicateExam(Long examId) {
        log.info("Duplicating exam: {}", examId);

        // 查找原測驗
        Exam originalExam = findExamById(examId);

        // 最多重試 5 次以處理並發 accessCode 衝突
        int maxRetries = 5;
        for (int attempt = 0; attempt < maxRetries; attempt++) {
            try {
                // 建立新測驗（複製基本資訊）
                String accessCode = qrCodeService.generateAccessCode();

                Exam newExam = Exam.builder()
                        .title(originalExam.getTitle() + " (副本)")
                        .description(originalExam.getDescription())
                        .questionTimeLimit(originalExam.getQuestionTimeLimit())
                        .status(ExamStatus.CREATED)
                        .accessCode(accessCode)
                        .build();

                newExam = examRepository.save(newExam);

                // 複製調查欄位配置
                List<ExamSurveyFieldConfig> originalSurveyFieldConfigs =
                        examSurveyFieldConfigRepository.findByExamIdOrderByDisplayOrderAsc(examId);
                for (ExamSurveyFieldConfig originalConfig : originalSurveyFieldConfigs) {
                    ExamSurveyFieldConfig newConfig = ExamSurveyFieldConfig.builder()
                            .exam(newExam)
                            .surveyField(originalConfig.getSurveyField())
                            .isRequired(originalConfig.getIsRequired())
                            .displayOrder(originalConfig.getDisplayOrder())
                            .build();
                    newExam.getSurveyFieldConfigs().add(newConfig);
                }

                // 複製所有題目
                List<Question> originalQuestions = questionRepository.findByExamIdOrderByQuestionOrderAsc(examId);
                for (Question originalQuestion : originalQuestions) {
                    // 複製題目（使用臨時的 correctOptionId）
                    Question newQuestion = Question.builder()
                            .exam(newExam)
                            .questionText(originalQuestion.getQuestionText())
                            .questionOrder(originalQuestion.getQuestionOrder())
                            .correctOptionId(0L)  // 使用臨時值，稍後設定
                            .singleStatChartType(originalQuestion.getSingleStatChartType())
                            .cumulativeChartType(originalQuestion.getCumulativeChartType())
                            .build();

                    newQuestion = questionRepository.save(newQuestion);

                    // 複製所有選項
                    List<QuestionOption> originalOptions = questionOptionRepository
                            .findByQuestionIdOrderByOptionOrderAsc(originalQuestion.getId());

                    Map<Long, Long> optionIdMap = new HashMap<>();  // 原選項ID -> 新選項ID

                    for (QuestionOption originalOption : originalOptions) {
                        QuestionOption newOption = QuestionOption.builder()
                                .question(newQuestion)
                                .optionText(originalOption.getOptionText())
                                .optionOrder(originalOption.getOptionOrder())
                                .build();

                        newOption = questionOptionRepository.save(newOption);
                        optionIdMap.put(originalOption.getId(), newOption.getId());
                    }

                    // 設定正確答案（對應到新選項ID）
                    Long newCorrectOptionId = optionIdMap.get(originalQuestion.getCorrectOptionId());
                    if (newCorrectOptionId != null) {
                        newQuestion.setCorrectOptionId(newCorrectOptionId);
                        questionRepository.save(newQuestion);
                    }
                }

                log.info("Exam duplicated successfully. Original ID: {}, New ID: {}", examId, newExam.getId());

                // 轉換為 DTO 回傳
                return ExamDTO.builder()
                        .id(newExam.getId())
                        .title(newExam.getTitle())
                        .description(newExam.getDescription())
                        .questionTimeLimit(newExam.getQuestionTimeLimit())
                        .status(newExam.getStatus())
                        .accessCode(newExam.getAccessCode())
                        .createdAt(newExam.getCreatedAt())
                        .build();

            } catch (DataIntegrityViolationException e) {
                if (attempt < maxRetries - 1) {
                    log.warn("AccessCode collision detected, retrying... (attempt {}/{})", attempt + 1, maxRetries);
                    continue;
                }
                throw new BusinessException("DUPLICATE_FAILED", "複製測驗失敗：無法生成唯一的 accessCode");
            }
        }

        throw new BusinessException("DUPLICATE_FAILED", "複製測驗失敗");
    }

    /**
     * 更新測驗（僅限 CREATED 狀態）
     *
     * @param examId 測驗 ID
     * @param examDTO 測驗 DTO
     * @return 更新後的測驗 DTO
     */
    @Transactional
    public ExamDTO updateExam(Long examId, ExamDTO examDTO) {
        log.info("Updating exam: {}", examId);

        // 查找測驗
        Exam exam = findExamById(examId);

        // 驗證測驗狀態（只有 CREATED 狀態可以編輯）
        if (exam.getStatus() != ExamStatus.CREATED) {
            throw new BusinessException("EXAM_ALREADY_STARTED", "測驗已啟動或結束，無法編輯");
        }

        // 更新測驗基本資訊
        exam.setTitle(examDTO.getTitle());
        exam.setDescription(examDTO.getDescription());
        exam.setQuestionTimeLimit(examDTO.getQuestionTimeLimit());

        // 清空並更新調查欄位配置
        exam.getSurveyFieldConfigs().clear();
        examSurveyFieldConfigRepository.flush();  // 立即同步到資料庫

        if (examDTO.getSurveyFieldConfigs() != null && !examDTO.getSurveyFieldConfigs().isEmpty()) {
            for (ExamSurveyFieldConfigDTO configDTO : examDTO.getSurveyFieldConfigs()) {
                // 根據 fieldKey 找到對應的 SurveyField
                SurveyField surveyField = surveyFieldRepository.findByFieldKey(configDTO.getFieldKey())
                        .orElseThrow(() -> new ResourceNotFoundException("SurveyField", "fieldKey", configDTO.getFieldKey()));

                // 建立新的配置
                ExamSurveyFieldConfig config = ExamSurveyFieldConfig.builder()
                        .exam(exam)
                        .surveyField(surveyField)
                        .isRequired(configDTO.getIsRequired())
                        .displayOrder(configDTO.getDisplayOrder())
                        .build();

                exam.getSurveyFieldConfigs().add(config);
            }
        }

        // 清空並刪除所有舊題目（cascade 會自動刪除選項）
        exam.getQuestions().clear();  // 先清空集合
        questionRepository.flush();    // 立即同步到資料庫

        // 建立新題目和選項
        for (QuestionDTO questionDTO : examDTO.getQuestions()) {
            Question question = createQuestionFromDTO(questionDTO, exam);
            exam.addQuestion(question);
        }

        // 儲存測驗
        exam = examRepository.save(exam);

        log.info("Exam updated successfully: {}", examId);
        return convertToDTO(exam);
    }

    // ==================== 私有輔助方法 ====================

    /**
     * 根據 ID 查找測驗，不存在則拋出異常
     */
    private Exam findExamById(Long examId) {
        return examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
    }

    /**
     * 從 DTO 建立 Question 實體
     */
    private Question createQuestionFromDTO(QuestionDTO dto, Exam exam) {
        // 建立題目（暫時不設定 correctOptionId）
        Question question = Question.builder()
                .exam(exam)
                .questionOrder(dto.getQuestionOrder())
                .questionText(dto.getQuestionText())
                .singleStatChartType(dto.getSingleStatChartType())
                .cumulativeChartType(dto.getCumulativeChartType())
                .correctOptionId(0L) // 暫時設定為 0，稍後更新
                .build();

        // 建立選項並添加到題目
        for (QuestionOptionDTO optionDTO : dto.getOptions()) {
            QuestionOption option = QuestionOption.builder()
                    .question(question)
                    .optionOrder(optionDTO.getOptionOrder())
                    .optionText(optionDTO.getOptionText())
                    .build();
            question.addOption(option);
        }

        // 儲存題目（cascade 會自動儲存所有選項）
        question = questionRepository.save(question);

        // 找到正確答案選項的 ID 並設定
        final List<QuestionOption> savedOptions = question.getOptions();
        Long correctOptionId = savedOptions.stream()
                .filter(opt -> opt.getOptionOrder().equals(dto.getCorrectOptionOrder()))
                .findFirst()
                .map(QuestionOption::getId)
                .orElseGet(() -> {
                    // 如果沒有匹配的，使用第一個選項的 ID
                    log.warn("找不到符合 correctOptionOrder {} 的選項，使用第一個選項", dto.getCorrectOptionOrder());
                    return savedOptions.get(0).getId();
                });

        question.setCorrectOptionId(correctOptionId);
        return questionRepository.save(question);
    }

    /**
     * 將 Exam 實體轉換為 DTO
     */
    private ExamDTO convertToDTO(Exam exam) {
        long totalStudents = studentRepository.countByExamId(exam.getId());

        // 轉換調查欄位配置
        List<ExamSurveyFieldConfigDTO> surveyFieldConfigDTOs = exam.getSurveyFieldConfigs().stream()
                .map(config -> ExamSurveyFieldConfigDTO.builder()
                        .id(config.getId())
                        .fieldKey(config.getSurveyField().getFieldKey())
                        .fieldName(config.getSurveyField().getFieldName())
                        .fieldType(config.getSurveyField().getFieldType())
                        .options(config.getSurveyField().getOptions())
                        .isRequired(config.getIsRequired())
                        .displayOrder(config.getDisplayOrder())
                        .build())
                .collect(Collectors.toList());

        ExamDTO dto = ExamDTO.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .questionTimeLimit(exam.getQuestionTimeLimit())
                .status(exam.getStatus())
                .currentQuestionIndex(exam.getCurrentQuestionIndex())
                .currentQuestionStartedAt(exam.getCurrentQuestionStartedAt())
                .accessCode(exam.getAccessCode())
                .createdAt(exam.getCreatedAt())
                .startedAt(exam.getStartedAt())
                .endedAt(exam.getEndedAt())
                .totalQuestions(exam.getQuestions().size())
                .totalStudents((int) totalStudents)
                .surveyFieldConfigs(surveyFieldConfigDTOs)
                .build();

        return dto;
    }

    /**
     * 將 Question 實體轉換為 DTO
     */
    private QuestionDTO convertQuestionToDTO(Question question) {
        List<QuestionOptionDTO> optionDTOs = question.getOptions().stream()
                .map(opt -> QuestionOptionDTO.builder()
                        .id(opt.getId())
                        .optionOrder(opt.getOptionOrder())
                        .optionText(opt.getOptionText())
                        .build())
                .collect(Collectors.toList());

        return QuestionDTO.builder()
                .id(question.getId())
                .questionOrder(question.getQuestionOrder())
                .questionText(question.getQuestionText())
                .correctOptionId(question.getCorrectOptionId())
                .singleStatChartType(question.getSingleStatChartType())
                .cumulativeChartType(question.getCumulativeChartType())
                .options(optionDTOs)
                .build();
    }

    /**
     * 清除測驗的講師 Session
     * 同時重置測驗的題目推送狀態，讓測驗回到「已啟動但尚未推送題目」的狀態
     *
     * @param examId 測驗 ID
     */
    @Transactional
    public void clearExamSession(Long examId) {
        log.info("Clearing session for exam: {}", examId);

        // 清除記憶體中的 instructorSession
        examSecurityService.clearInstructorSession(examId);

        // 重置測驗的題目推送狀態
        Exam exam = findExamById(examId);

        // 只有已啟動的測驗才需要重置
        if (exam.getStatus() == ExamStatus.STARTED) {
            exam.setCurrentQuestionStartedAt(null);
            exam.setCurrentQuestionIndex(0);  // 重置到第一題
            examRepository.save(exam);
            log.info("Reset exam {} to initial STARTED state (no questions pushed)", examId);
        }
    }

    /**
     * 調整題目順序
     *
     * @param examId 測驗 ID
     * @param questionIds 題目 ID 列表（新順序）
     */
    @Transactional
    public void reorderQuestions(Long examId, List<Long> questionIds) {
        log.info("Reordering questions for exam: {}, new order: {}", examId, questionIds);

        // 1. 驗證測驗狀態（僅 CREATED 狀態可調整）
        Exam exam = findExamById(examId);
        if (exam.getStatus() != ExamStatus.CREATED) {
            throw new BusinessException("EXAM_ALREADY_STARTED", "測驗已啟動或結束，無法調整順序");
        }

        // 2. 取得測驗的所有題目
        List<Question> questions = questionRepository.findByExamIdOrderByQuestionOrderAsc(examId);

        // 3. 驗證題目數量
        if (questions.size() != questionIds.size()) {
            throw new BusinessException("INVALID_QUESTION_COUNT", "題目數量不符");
        }

        // 4. 驗證所有題目 ID 都屬於此測驗
        List<Long> existingQuestionIds = questions.stream()
                .map(Question::getId)
                .collect(Collectors.toList());

        for (Long questionId : questionIds) {
            if (!existingQuestionIds.contains(questionId)) {
                throw new BusinessException("INVALID_QUESTION_ID", "題目 ID " + questionId + " 不屬於此測驗");
            }
        }

        // 5. 更新每個題目的順序
        for (int i = 0; i < questionIds.size(); i++) {
            Long questionId = questionIds.get(i);
            Question question = questionRepository.findById(questionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Question", questionId));

            question.setQuestionOrder(i + 1);  // 從 1 開始
            questionRepository.save(question);
        }

        log.info("Questions reordered successfully for exam: {}", examId);
    }

    /**
     * 調整選項順序
     *
     * @param questionId 題目 ID
     * @param optionIds 選項 ID 列表（新順序）
     */
    @Transactional
    public void reorderOptions(Long questionId, List<Long> optionIds) {
        log.info("Reordering options for question: {}, new order: {}", questionId, optionIds);

        // 1. 驗證題目所屬測驗狀態
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", questionId));

        Exam exam = question.getExam();
        if (exam.getStatus() != ExamStatus.CREATED) {
            throw new BusinessException("EXAM_ALREADY_STARTED", "測驗已啟動或結束，無法調整順序");
        }

        // 2. 取得題目的所有選項
        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(questionId);

        // 3. 驗證選項數量
        if (options.size() != optionIds.size()) {
            throw new BusinessException("INVALID_OPTION_COUNT", "選項數量不符");
        }

        // 4. 驗證所有選項 ID 都屬於此題目
        List<Long> existingOptionIds = options.stream()
                .map(QuestionOption::getId)
                .collect(Collectors.toList());

        for (Long optionId : optionIds) {
            if (!existingOptionIds.contains(optionId)) {
                throw new BusinessException("INVALID_OPTION_ID", "選項 ID " + optionId + " 不屬於此題目");
            }
        }

        // 5. 更新每個選項的順序
        for (int i = 0; i < optionIds.size(); i++) {
            Long optionId = optionIds.get(i);
            QuestionOption option = questionOptionRepository.findById(optionId)
                    .orElseThrow(() -> new ResourceNotFoundException("QuestionOption", optionId));

            option.setOptionOrder(i + 1);  // 從 1 開始
            questionOptionRepository.save(option);
        }

        log.info("Options reordered successfully for question: {}", questionId);
    }

}