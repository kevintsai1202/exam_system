package com.exam.system.service;

import com.exam.system.dto.AnswerDTO;
import com.exam.system.entity.Answer;
import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import com.exam.system.entity.Question;
import com.exam.system.entity.QuestionOption;
import com.exam.system.entity.QuestionType;
import com.exam.system.entity.Student;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.AnswerRepository;
import com.exam.system.repository.ExamRepository;
import com.exam.system.repository.QuestionOptionRepository;
import com.exam.system.repository.QuestionRepository;
import com.exam.system.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 答案服務
 * 處理學員答題相關的業務邏輯
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AnswerService {

    private final AnswerRepository answerRepository;
    private final StudentRepository studentRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final ExamRepository examRepository;
    private final StatisticsService statisticsService;

    /**
     * 提交答案
     *
     * @param answerDTO 答案 DTO
     * @return 包含作答結果的答案 DTO
     */
    @Transactional
    public AnswerDTO submitAnswer(AnswerDTO answerDTO) {
        log.info("Student {} submitting answer for question {}", answerDTO.getSessionId(), answerDTO.getQuestionId());

        // 根據 sessionId 查找學員
        Student student = studentRepository.findBySessionId(answerDTO.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "sessionId", answerDTO.getSessionId()));

        // 查找題目
        Question question = questionRepository.findById(answerDTO.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("Question", answerDTO.getQuestionId()));

        // 取得測驗資訊
        Exam exam = question.getExam();

        // 驗證 1：檢查測驗狀態
        if (exam.getStatus() != ExamStatus.STARTED) {
            throw new BusinessException("EXAM_NOT_STARTED", "測驗尚未開始或已結束，無法提交答案");
        }

        // 驗證 2：檢查是否已作答
        if (answerRepository.existsByStudentIdAndQuestionId(student.getId(), question.getId())) {
            throw new BusinessException("ANSWER_ALREADY_EXISTS", "已經作答過此題");
        }

        // 驗證 3：檢查答題時間是否已結束
        if (exam.getCurrentQuestionStartedAt() != null) {
            LocalDateTime questionStartTime = exam.getCurrentQuestionStartedAt();
            LocalDateTime questionEndTime = questionStartTime.plusSeconds(exam.getQuestionTimeLimit());
            LocalDateTime now = LocalDateTime.now();

            if (now.isAfter(questionEndTime)) {
                log.warn("Student {} attempted to answer after time limit. Question started at: {}, ended at: {}, current time: {}",
                    student.getName(), questionStartTime, questionEndTime, now);
                throw new BusinessException("TIME_EXPIRED", "作答時間已結束");
            }

            // 記錄剩餘時間（用於 debug）
            long remainingSeconds = java.time.Duration.between(now, questionEndTime).getSeconds();
            log.debug("Student {} submitting answer with {} seconds remaining", student.getName(), remainingSeconds);
        }

        // 驗證 4：檢查作答的題目是否為當前題目
        List<Question> questions = exam.getQuestions();
        if (questions.isEmpty()) {
            throw new BusinessException("NO_QUESTIONS", "測驗沒有題目");
        }

        int currentIndex = exam.getCurrentQuestionIndex();
        if (currentIndex < 0 || currentIndex >= questions.size()) {
            throw new BusinessException("INVALID_CURRENT_QUESTION", "當前題目索引無效");
        }

        Question currentQuestion = questions.get(currentIndex);
        if (!currentQuestion.getId().equals(question.getId())) {
            throw new BusinessException("WRONG_QUESTION", "只能回答當前題目");
        }

        // 根據題目類型處理答案
        boolean isCorrect;
        Answer answer;

        if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
            // 複選題邏輯
            Set<Long> selectedOptionIds = answerDTO.getSelectedOptionIds();
            if (selectedOptionIds == null || selectedOptionIds.isEmpty()) {
                throw new BusinessException("INVALID_ANSWER", "複選題至少需要選擇一個選項");
            }

            // 驗證所有選項都存在
            for (Long optionId : selectedOptionIds) {
                questionOptionRepository.findById(optionId)
                        .orElseThrow(() -> new ResourceNotFoundException("QuestionOption", optionId));
            }

            // 判斷答案是否正確
            isCorrect = question.isCorrectAnswer(selectedOptionIds);

            // 建立答案實體（複選題）
            answer = Answer.builder()
                    .student(student)
                    .question(question)
                    .selectedOptionId(0L) // 複選題使用 JSON 欄位，這裡設為 0
                    .isCorrect(isCorrect)
                    .build();
            answer.setSelectedOptionIdsSet(selectedOptionIds);

        } else {
            // 單選題 / 是非題邏輯
            Long selectedOptionId = answerDTO.getSelectedOptionId();
            if (selectedOptionId == null) {
                throw new BusinessException("INVALID_ANSWER", "單選題或是非題需要選擇一個選項");
            }

            // 查找選項
            QuestionOption selectedOption = questionOptionRepository.findById(selectedOptionId)
                    .orElseThrow(() -> new ResourceNotFoundException("QuestionOption", selectedOptionId));

            // 判斷答案是否正確
            isCorrect = question.isCorrectAnswer(selectedOptionId);

            // 建立答案實體（單選題 / 是非題）
            answer = Answer.builder()
                    .student(student)
                    .question(question)
                    .selectedOptionId(selectedOptionId)
                    .isCorrect(isCorrect)
                    .build();
        }

        answer = answerRepository.save(answer);

        // 更新學員分數（答對加1分）
        if (isCorrect) {
            student.addScore(1);
            studentRepository.save(student);
        }

        log.info("Answer submitted: student={}, question={}, correct={}", student.getName(), question.getId(), isCorrect);

        // 異步更新統計（觸發 WebSocket 推送）
        statisticsService.updateQuestionStatistics(question.getExam().getId(), question.getId());
        statisticsService.updateCumulativeStatistics(question.getExam().getId());

        return convertToDTO(answer, student, question);
    }

    /**
     * 取得學員的所有答案記錄
     *
     * @param sessionId Session ID
     * @return 答案列表
     */
    @Transactional(readOnly = true)
    public List<AnswerDTO> getStudentAnswers(String sessionId) {
        Student student = studentRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "sessionId", sessionId));

        List<Answer> answers = answerRepository.findByStudentId(student.getId());

        return answers.stream()
                .map(answer -> convertToDTO(answer, student, answer.getQuestion()))
                .collect(Collectors.toList());
    }

    // ==================== 私有輔助方法 ====================

    /**
     * 將 Answer 實體轉換為 DTO
     */
    private AnswerDTO convertToDTO(Answer answer, Student student, Question question) {
        AnswerDTO.AnswerDTOBuilder builder = AnswerDTO.builder()
                .id(answer.getId())
                .studentId(student.getId())
                .sessionId(student.getSessionId())
                .questionId(question.getId())
                .questionText(question.getQuestionText())
                .isCorrect(answer.getIsCorrect())
                .answeredAt(answer.getAnsweredAt())
                .currentTotalScore(student.getTotalScore());

        // 根據題目類型設定答案資訊
        if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE) {
            // 複選題
            Set<Long> selectedOptionIds = answer.getSelectedOptionIdsSet();
            builder.selectedOptionIds(selectedOptionIds);
            builder.correctOptionIds(question.getCorrectOptionIdsSet());
        } else {
            // 單選題 / 是非題
            builder.selectedOptionId(answer.getSelectedOptionId());
            builder.correctOptionId(question.getCorrectOptionId());

            // 查找選項文字（可選）
            QuestionOption selectedOption = questionOptionRepository.findById(answer.getSelectedOptionId())
                    .orElse(null);
            if (selectedOption != null) {
                builder.selectedOptionText(selectedOption.getOptionText());
            }
        }

        return builder.build();
    }

}