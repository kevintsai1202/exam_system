package com.exam.system.service;

import com.exam.system.dto.SurveyDTO;
import com.exam.system.dto.SurveyDTO.SurveyQuestionDTO;
import com.exam.system.dto.SurveyDTO.SurveyOptionDTO;
import com.exam.system.dto.SurveyResponseDTO;
import com.exam.system.dto.SurveyResponseDTO.SurveyAnswerDTO;
import com.exam.system.dto.SurveyStatisticsDTO;
import com.exam.system.dto.SurveyStatisticsDTO.*;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 問券調查服務
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final SurveyQuestionRepository surveyQuestionRepository;
    private final SurveyOptionRepository surveyOptionRepository;
    private final SurveyResponseRepository surveyResponseRepository;
    private final SurveyAnswerRepository surveyAnswerRepository;
    private final ExamRepository examRepository;
    private final StudentRepository studentRepository;
    private final OwnershipGuard ownershipGuard;
    private final CurrentUserProvider currentUserProvider;

    /**
     * 建立問券
     */
    @Transactional
    public SurveyDTO createSurvey(SurveyDTO dto) {
        log.info("建立問券: examId={}, title={}", dto.getExamId(), dto.getTitle());

        // 驗證測驗存在且屬於當前使用者
        Exam exam = examRepository.findById(dto.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", dto.getExamId()));
        ownershipGuard.assertOwnerOrAdmin(exam);

        // 建立問券
        Survey survey = Survey.builder()
                .exam(exam)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .isAnonymous(dto.getIsAnonymous() != null ? dto.getIsAnonymous() : false)
                .status(SurveyStatus.DRAFT)
                .build();

        Survey savedSurvey = surveyRepository.save(survey);

        // 建立題目
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            int questionOrder = 1;
            for (SurveyQuestionDTO questionDTO : dto.getQuestions()) {
                createQuestion(savedSurvey, questionDTO, questionOrder++);
            }
        }

        return toDTO(surveyRepository.findByIdWithQuestionsAndOptions(savedSurvey.getId()).orElse(savedSurvey));
    }

    /**
     * 更新問券
     */
    @Transactional
    public SurveyDTO updateSurvey(Long id, SurveyDTO dto) {
        log.info("更新問券: id={}", id);

        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey", id));
        ownershipGuard.assertOwnerOrAdmin(survey);

        // 草稿狀態才能編輯
        if (survey.getStatus() != SurveyStatus.DRAFT) {
            throw new BusinessException("只有草稿狀態的問券才能編輯");
        }

        survey.setTitle(dto.getTitle());
        survey.setDescription(dto.getDescription());
        survey.setIsAnonymous(dto.getIsAnonymous());
        survey.setStartAt(dto.getStartAt());
        survey.setEndAt(dto.getEndAt());

        // 刪除舊題目
        survey.getQuestions().clear();
        surveyRepository.save(survey);

        // 重新建立題目
        if (dto.getQuestions() != null && !dto.getQuestions().isEmpty()) {
            int questionOrder = 1;
            for (SurveyQuestionDTO questionDTO : dto.getQuestions()) {
                createQuestion(survey, questionDTO, questionOrder++);
            }
        }

        return toDTO(surveyRepository.findByIdWithQuestionsAndOptions(id).orElse(survey));
    }

    /**
     * 取得問券
     */
    @Transactional(readOnly = true)
    public SurveyDTO getSurvey(Long id) {
        Survey survey = surveyRepository.findByIdWithQuestionsAndOptions(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey", id));
        ownershipGuard.assertOwnerOrAdmin(survey);
        return toDTO(survey);
    }

    /**
     * 取得測驗的問券列表（限 owner 或 ADMIN）
     */
    @Transactional(readOnly = true)
    public List<SurveyDTO> getSurveysByExamId(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        ownershipGuard.assertOwnerOrAdmin(exam);
        return surveyRepository.findByExamId(examId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 取得問券列表
     * ADMIN 取全部；INSTRUCTOR 只取自己 exam 下的問券
     */
    @Transactional(readOnly = true)
    public List<SurveyDTO> getAllSurveys() {
        User current = currentUserProvider.requireCurrentUser();
        List<Survey> surveys;
        if (current.getRole() == UserRole.ADMIN) {
            surveys = surveyRepository.findAll();
        } else {
            surveys = surveyRepository.findByExamOwnerIdOrderByIdDesc(current.getId());
        }
        return surveys.stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * 啟用問券
     */
    @Transactional
    public SurveyDTO activateSurvey(Long id) {
        log.info("啟用問券: id={}", id);

        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey", id));
        ownershipGuard.assertOwnerOrAdmin(survey);

        if (survey.getStatus() != SurveyStatus.DRAFT) {
            throw new BusinessException("只有草稿狀態的問券才能啟用");
        }

        // 驗證是否有題目
        if (survey.getQuestions() == null || survey.getQuestions().isEmpty()) {
            throw new BusinessException("問券必須至少有一個題目");
        }

        survey.activate();
        return toDTO(surveyRepository.save(survey));
    }

    /**
     * 關閉問券
     */
    @Transactional
    public SurveyDTO closeSurvey(Long id) {
        log.info("關閉問券: id={}", id);

        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey", id));
        ownershipGuard.assertOwnerOrAdmin(survey);

        if (survey.getStatus() != SurveyStatus.ACTIVE) {
            throw new BusinessException("只有進行中的問券才能關閉");
        }

        survey.close();
        return toDTO(surveyRepository.save(survey));
    }

    /**
     * 刪除問券
     */
    @Transactional
    public void deleteSurvey(Long id) {
        log.info("刪除問券: id={}", id);

        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Survey", id));
        ownershipGuard.assertOwnerOrAdmin(survey);

        // 只有草稿或已關閉的問券才能刪除
        if (survey.getStatus() == SurveyStatus.ACTIVE) {
            throw new BusinessException("進行中的問券無法刪除，請先關閉");
        }

        surveyRepository.delete(survey);
    }

    /**
     * 提交問券回覆
     */
    @Transactional
    public SurveyResponseDTO submitResponse(SurveyResponseDTO dto) {
        log.info("提交問券回覆: surveyId={}", dto.getSurveyId());

        Survey survey = surveyRepository.findByIdWithQuestionsAndOptions(dto.getSurveyId())
                .orElseThrow(() -> new ResourceNotFoundException("Survey", dto.getSurveyId()));

        // 驗證問券狀態
        if (survey.getStatus() != SurveyStatus.ACTIVE) {
            throw new BusinessException("問券未開放或已關閉");
        }

        // 檢查是否重複填寫
        if (dto.getStudentId() != null) {
            if (surveyResponseRepository.existsBySurveyIdAndStudentId(dto.getSurveyId(), dto.getStudentId())) {
                throw new BusinessException("您已經填寫過此問券");
            }
        } else if (dto.getResponderEmail() != null) {
            if (surveyResponseRepository.existsBySurveyIdAndResponderEmail(dto.getSurveyId(),
                    dto.getResponderEmail())) {
                throw new BusinessException("此 Email 已經填寫過此問券");
            }
        }

        // 建立回覆
        SurveyResponse response = SurveyResponse.builder()
                .survey(survey)
                .responderEmail(dto.getResponderEmail())
                .responderName(dto.getResponderName())
                .build();

        // 關聯學員
        if (dto.getStudentId() != null) {
            Student student = studentRepository.findById(dto.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", dto.getStudentId()));
            response.setStudent(student);
            if (response.getResponderEmail() == null) {
                response.setResponderEmail(student.getEmail());
            }
            if (response.getResponderName() == null) {
                response.setResponderName(student.getName());
            }
        }

        SurveyResponse savedResponse = surveyResponseRepository.save(response);

        // 建立答案
        if (dto.getAnswers() != null) {
            for (SurveyAnswerDTO answerDTO : dto.getAnswers()) {
                createAnswer(savedResponse, answerDTO);
            }
        }

        return toResponseDTO(surveyResponseRepository.findByIdWithAnswers(savedResponse.getId()).orElse(savedResponse));
    }

    /**
     * 取得問券統計
     */
    @Transactional(readOnly = true)
    public SurveyStatisticsDTO getSurveyStatistics(Long surveyId) {
        Survey survey = surveyRepository.findByIdWithQuestionsAndOptions(surveyId)
                .orElseThrow(() -> new ResourceNotFoundException("Survey", surveyId));

        long totalResponses = surveyResponseRepository.countBySurveyId(surveyId);

        List<QuestionStatisticsDTO> questionStats = new ArrayList<>();
        for (SurveyQuestion question : survey.getQuestions()) {
            questionStats.add(calculateQuestionStatistics(question, totalResponses));
        }

        return SurveyStatisticsDTO.builder()
                .surveyId(surveyId)
                .surveyTitle(survey.getTitle())
                .totalResponses((int) totalResponses)
                .questionStatistics(questionStats)
                .build();
    }

    // ==================== 私有方法 ====================

    private void createQuestion(Survey survey, SurveyQuestionDTO dto, int order) {
        SurveyQuestion question = SurveyQuestion.builder()
                .survey(survey)
                .questionOrder(order)
                .questionText(dto.getQuestionText())
                .questionType(dto.getQuestionType())
                .isRequired(dto.getIsRequired() != null ? dto.getIsRequired() : true)
                .maxRating(dto.getMaxRating())
                .build();

        SurveyQuestion savedQuestion = surveyQuestionRepository.save(question);

        // 建立選項（選擇題）
        if (dto.getOptions() != null && !dto.getOptions().isEmpty()) {
            int optionOrder = 1;
            for (SurveyOptionDTO optionDTO : dto.getOptions()) {
                createOption(savedQuestion, optionDTO, optionOrder++);
            }
        }
    }

    private void createOption(SurveyQuestion question, SurveyOptionDTO dto, int order) {
        SurveyOption option = SurveyOption.builder()
                .question(question)
                .optionOrder(order)
                .optionText(dto.getOptionText())
                .build();
        surveyOptionRepository.save(option);
    }

    private void createAnswer(SurveyResponse response, SurveyAnswerDTO dto) {
        SurveyQuestion question = surveyQuestionRepository.findById(dto.getQuestionId())
                .orElseThrow(() -> new ResourceNotFoundException("SurveyQuestion", dto.getQuestionId()));

        SurveyAnswer answer = SurveyAnswer.builder()
                .response(response)
                .question(question)
                .textAnswer(dto.getTextAnswer())
                .ratingValue(dto.getRatingValue())
                .multipleOptionIds(dto.getMultipleOptionIds())
                .build();

        // 單選題
        if (dto.getSelectedOptionId() != null) {
            SurveyOption option = surveyOptionRepository.findById(dto.getSelectedOptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("SurveyOption", dto.getSelectedOptionId()));
            answer.setSelectedOption(option);
        }

        surveyAnswerRepository.save(answer);
    }

    private QuestionStatisticsDTO calculateQuestionStatistics(SurveyQuestion question, long totalResponses) {
        QuestionStatisticsDTO stats = new QuestionStatisticsDTO();
        stats.setQuestionId(question.getId());
        stats.setQuestionText(question.getQuestionText());
        stats.setQuestionType(question.getQuestionType());
        stats.setTotalAnswers((int) surveyAnswerRepository.countByQuestionId(question.getId()));

        switch (question.getQuestionType()) {
            case SINGLE_CHOICE:
            case MULTIPLE_CHOICE:
                stats.setOptionDistribution(calculateOptionDistribution(question));
                break;
            case RATING:
                stats.setRatingStatistics(calculateRatingStatistics(question));
                break;
            case TEXT:
                stats.setTextAnswers(getTextAnswers(question.getId()));
                break;
        }

        return stats;
    }

    private Map<Long, OptionDistributionDTO> calculateOptionDistribution(SurveyQuestion question) {
        Map<Long, OptionDistributionDTO> distribution = new LinkedHashMap<>();
        long totalAnswers = surveyAnswerRepository.countByQuestionId(question.getId());

        // 初始化所有選項
        for (SurveyOption option : question.getOptions()) {
            distribution.put(option.getId(), OptionDistributionDTO.builder()
                    .optionId(option.getId())
                    .optionText(option.getOptionText())
                    .count(0)
                    .percentage(0.0)
                    .build());
        }

        // 統計選擇次數
        List<Object[]> counts = surveyAnswerRepository.countByQuestionIdGroupBySelectedOption(question.getId());
        for (Object[] row : counts) {
            Long optionId = (Long) row[0];
            Long count = (Long) row[1];
            if (distribution.containsKey(optionId)) {
                OptionDistributionDTO dto = distribution.get(optionId);
                dto.setCount(count.intValue());
                dto.setPercentage(totalAnswers > 0 ? (count.doubleValue() / totalAnswers) * 100 : 0.0);
            }
        }

        return distribution;
    }

    private RatingStatisticsDTO calculateRatingStatistics(SurveyQuestion question) {
        Double avgRating = surveyAnswerRepository.calculateAverageRatingByQuestionId(question.getId());
        List<Object[]> ratingCounts = surveyAnswerRepository.countByQuestionIdGroupByRatingValue(question.getId());

        Map<Integer, Integer> distribution = new TreeMap<>();
        for (Object[] row : ratingCounts) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            distribution.put(rating, count.intValue());
        }

        return RatingStatisticsDTO.builder()
                .averageRating(avgRating != null ? avgRating : 0.0)
                .maxRating(question.getMaxRating())
                .distribution(distribution)
                .build();
    }

    private List<String> getTextAnswers(Long questionId) {
        return surveyAnswerRepository.findByQuestionId(questionId).stream()
                .map(SurveyAnswer::getTextAnswer)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    // ==================== DTO 轉換方法 ====================

    private SurveyDTO toDTO(Survey survey) {
        SurveyDTO dto = SurveyDTO.builder()
                .id(survey.getId())
                .examId(survey.getExam().getId())
                .examTitle(survey.getExam().getTitle())
                .title(survey.getTitle())
                .description(survey.getDescription())
                .status(survey.getStatus())
                .isAnonymous(survey.getIsAnonymous())
                .createdAt(survey.getCreatedAt())
                .updatedAt(survey.getUpdatedAt())
                .startAt(survey.getStartAt())
                .endAt(survey.getEndAt())
                .totalQuestions(survey.getQuestions() != null ? survey.getQuestions().size() : 0)
                .totalResponses((int) surveyResponseRepository.countBySurveyId(survey.getId()))
                .build();

        if (survey.getQuestions() != null) {
            dto.setQuestions(survey.getQuestions().stream()
                    .map(this::toQuestionDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private SurveyQuestionDTO toQuestionDTO(SurveyQuestion question) {
        SurveyQuestionDTO dto = SurveyQuestionDTO.builder()
                .id(question.getId())
                .questionOrder(question.getQuestionOrder())
                .questionText(question.getQuestionText())
                .questionType(question.getQuestionType())
                .isRequired(question.getIsRequired())
                .maxRating(question.getMaxRating())
                .build();

        if (question.getOptions() != null) {
            dto.setOptions(question.getOptions().stream()
                    .map(this::toOptionDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private SurveyOptionDTO toOptionDTO(SurveyOption option) {
        return SurveyOptionDTO.builder()
                .id(option.getId())
                .optionOrder(option.getOptionOrder())
                .optionText(option.getOptionText())
                .build();
    }

    private SurveyResponseDTO toResponseDTO(SurveyResponse response) {
        SurveyResponseDTO dto = SurveyResponseDTO.builder()
                .id(response.getId())
                .surveyId(response.getSurvey().getId())
                .surveyTitle(response.getSurvey().getTitle())
                .responderEmail(response.getResponderEmail())
                .responderName(response.getResponderName())
                .submittedAt(response.getSubmittedAt())
                .build();

        if (response.getStudent() != null) {
            dto.setStudentId(response.getStudent().getId());
        }

        if (response.getAnswers() != null) {
            dto.setAnswers(response.getAnswers().stream()
                    .map(this::toAnswerDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private SurveyAnswerDTO toAnswerDTO(SurveyAnswer answer) {
        SurveyAnswerDTO dto = SurveyAnswerDTO.builder()
                .id(answer.getId())
                .questionId(answer.getQuestion().getId())
                .questionText(answer.getQuestion().getQuestionText())
                .textAnswer(answer.getTextAnswer())
                .ratingValue(answer.getRatingValue())
                .multipleOptionIds(answer.getMultipleOptionIds())
                .build();

        if (answer.getSelectedOption() != null) {
            dto.setSelectedOptionId(answer.getSelectedOption().getId());
            dto.setSelectedOptionText(answer.getSelectedOption().getOptionText());
        }

        return dto;
    }
}
