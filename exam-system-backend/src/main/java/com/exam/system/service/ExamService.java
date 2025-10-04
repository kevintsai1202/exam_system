package com.exam.system.service;

import com.exam.system.dto.*;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import com.exam.system.websocket.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 測驗服務
 * 處理測驗相關的業務邏輯
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final StudentRepository studentRepository;
    private final QRCodeService qrCodeService;
    private final WebSocketService webSocketService;
    private final StatisticsService statisticsService;

    /**
     * 定時任務執行器 - 用於在題目時間到後推送統計
     */
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(5);

    /**
     * 建立新測驗
     *
     * @param examDTO 測驗 DTO
     * @return 建立的測驗 DTO
     */
    @Transactional
    public ExamDTO createExam(ExamDTO examDTO) {
        log.info("Creating new exam: {}", examDTO.getTitle());

        // 生成唯一的 accessCode
        String accessCode;
        do {
            accessCode = qrCodeService.generateAccessCode();
        } while (examRepository.existsByAccessCode(accessCode));

        // 建立測驗實體
        Exam exam = Exam.builder()
                .title(examDTO.getTitle())
                .description(examDTO.getDescription())
                .questionTimeLimit(examDTO.getQuestionTimeLimit())
                .cumulativeChartType(examDTO.getCumulativeChartType())
                .leaderboardTopN(examDTO.getLeaderboardTopN())
                .status(ExamStatus.CREATED)
                .currentQuestionIndex(0)
                .accessCode(accessCode)
                .build();

        // 儲存測驗以獲得 ID
        exam = examRepository.save(exam);

        // 建立題目和選項
        for (QuestionDTO questionDTO : examDTO.getQuestions()) {
            Question question = createQuestionFromDTO(questionDTO, exam);
            exam.addQuestion(question);
        }

        // 再次儲存以包含題目
        exam = examRepository.save(exam);

        log.info("Exam created successfully with ID: {} and accessCode: {}", exam.getId(), exam.getAccessCode());
        return convertToDTO(exam);
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
     *
     * @param examId 測驗 ID
     * @param baseUrl 前端基礎 URL（用於生成 QR Code）
     * @return 包含 QR Code 的測驗 DTO
     */
    @Transactional
    public ExamDTO startExam(Long examId, String baseUrl) {
        log.info("Starting exam: {}", examId);

        Exam exam = findExamById(examId);

        // 驗證測驗狀態
        if (exam.getStatus() != ExamStatus.CREATED) {
            throw new BusinessException("EXAM_ALREADY_STARTED", "測驗已經啟動或結束");
        }

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
        return dto;
    }

    /**
     * 開始特定題目
     *
     * @param examId 測驗 ID
     * @param questionIndex 題目索引（從 0 開始）
     */
    @Transactional
    public void startQuestion(Long examId, Integer questionIndex) {
        log.info("Starting question {} for exam: {}", questionIndex, examId);

        Exam exam = findExamById(examId);

        // 驗證測驗狀態
        if (exam.getStatus() != ExamStatus.STARTED) {
            throw new BusinessException("EXAM_NOT_STARTED", "測驗尚未啟動");
        }

        // 驗證題目索引
        List<Question> questions = questionRepository.findByExamIdOrderByQuestionOrderAsc(examId);
        if (questionIndex < 0 || questionIndex >= questions.size()) {
            throw new BusinessException("INVALID_QUESTION_INDEX", "無效的題目索引");
        }

        // 更新當前題目索引和開始時間
        exam.setCurrentQuestionIndex(questionIndex);
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

        // 計算到期時間（當前時間 + 時限）
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(exam.getQuestionTimeLimit());
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

        // 安排定時任務：在題目時間到後自動推送統計
        final Long finalQuestionId = question.getId();
        final Long finalExamId = examId;
        scheduler.schedule(() -> {
            try {
                log.info("題目時間到，自動推送統計 - examId: {}, questionId: {}", finalExamId, finalQuestionId);
                statisticsService.updateQuestionStatistics(finalExamId, finalQuestionId);
            } catch (Exception e) {
                log.error("自動推送統計失敗 - examId: {}, questionId: {}", finalExamId, finalQuestionId, e);
            }
        }, exam.getQuestionTimeLimit(), TimeUnit.SECONDS);

        log.info("Question {} started for exam: {}", questionIndex, examId);
    }

    /**
     * 結束測驗
     *
     * @param examId 測驗 ID
     */
    @Transactional
    public void endExam(Long examId) {
        log.info("Ending exam: {}", examId);

        Exam exam = findExamById(examId);

        // 驗證測驗狀態
        if (exam.getStatus() != ExamStatus.STARTED) {
            throw new BusinessException("EXAM_NOT_STARTED", "測驗尚未啟動");
        }

        // 結束測驗
        exam.end();
        examRepository.save(exam);

        // 透過 WebSocket 廣播測驗結束事件
        Map<String, Object> statusData = new HashMap<>();
        statusData.put("examId", exam.getId());
        statusData.put("status", exam.getStatus());
        statusData.put("endedAt", exam.getEndedAt());

        webSocketService.broadcastExamStatus(examId, WebSocketMessage.examEnded(statusData));

        // 推送排行榜（使用測驗設定的顯示名次數）
        statisticsService.broadcastLeaderboard(examId, exam.getLeaderboardTopN());

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
                .chartType(dto.getChartType())
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

        ExamDTO dto = ExamDTO.builder()
                .id(exam.getId())
                .title(exam.getTitle())
                .description(exam.getDescription())
                .questionTimeLimit(exam.getQuestionTimeLimit())
                .cumulativeChartType(exam.getCumulativeChartType())
                .leaderboardTopN(exam.getLeaderboardTopN())
                .status(exam.getStatus())
                .currentQuestionIndex(exam.getCurrentQuestionIndex())
                .accessCode(exam.getAccessCode())
                .createdAt(exam.getCreatedAt())
                .startedAt(exam.getStartedAt())
                .endedAt(exam.getEndedAt())
                .totalQuestions(exam.getQuestions().size())
                .totalStudents((int) totalStudents)
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
                .chartType(question.getChartType())
                .options(optionDTOs)
                .build();
    }

}