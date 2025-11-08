package com.exam.system.service;

import com.exam.system.dto.LeaderboardDTO;
import com.exam.system.dto.StatisticsDTO;
import com.exam.system.dto.WebSocketMessage;
import com.exam.system.entity.Question;
import com.exam.system.entity.QuestionOption;
import com.exam.system.entity.Student;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import com.exam.system.websocket.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

/**
 * 統計服務
 * 處理統計資料計算和推送
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final AnswerRepository answerRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final StudentRepository studentRepository;
    private final ExamRepository examRepository;
    private final WebSocketService webSocketService;

    /**
     * 更新題目統計並透過 WebSocket 推送
     *
     * @param examId 測驗 ID
     * @param questionId 題目 ID
     */
    @Transactional(readOnly = true)
    public void updateQuestionStatistics(Long examId, Long questionId) {
        log.debug("Updating statistics for question: {}", questionId);

        StatisticsDTO.QuestionStatistics statistics = generateQuestionStatistics(questionId);

        // 透過 WebSocket 推送
        webSocketService.broadcastQuestionStatistics(examId, questionId,
                WebSocketMessage.statisticsUpdated(statistics));
    }

    /**
     * 生成題目統計資料
     *
     * @param questionId 題目 ID
     * @return 題目統計 DTO
     */
    @Transactional(readOnly = true)
    public StatisticsDTO.QuestionStatistics generateQuestionStatistics(Long questionId) {
        // 查找題目
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", questionId));

        // 查找所有選項
        List<QuestionOption> options = questionOptionRepository.findByQuestionIdOrderByOptionOrderAsc(questionId);

        // 統計各選項被選擇的次數
        List<Map<String, Object>> optionCounts = answerRepository.countByQuestionIdGroupByOption(questionId);
        Map<Long, Long> countMap = optionCounts.stream()
                .collect(Collectors.toMap(
                        m -> ((Number) m.get("optionId")).longValue(),
                        m -> ((Number) m.get("count")).longValue()
                ));

        // 總作答人數
        long totalAnswers = answerRepository.countByQuestionId(questionId);

        // 建立選項統計列表
        List<StatisticsDTO.OptionStatistic> optionStatistics = options.stream()
                .map(option -> {
                    long count = countMap.getOrDefault(option.getId(), 0L);
                    double percentage = totalAnswers > 0 ? (count * 100.0 / totalAnswers) : 0.0;
                    boolean isCorrect = question.getCorrectOptionId().equals(option.getId());

                    return StatisticsDTO.OptionStatistic.builder()
                            .optionId(option.getId())
                            .optionText(option.getOptionText())
                            .count(count)
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .isCorrect(isCorrect)
                            .build();
                })
                .collect(Collectors.toList());

        // 計算正確率（回傳比例，例如 0.5 代表 50%）
        long correctCount = answerRepository.countByQuestionIdAndIsCorrect(questionId, true);
        double correctRate = totalAnswers > 0 ? ((double) correctCount / totalAnswers) : 0.0;

        return StatisticsDTO.QuestionStatistics.builder()
                .questionId(questionId)
                .questionText(question.getQuestionText())
                .totalAnswers(totalAnswers)
                .chartType(question.getSingleStatChartType())
                .optionStatistics(optionStatistics)
                .correctRate(Math.round(correctRate * 10000.0) / 10000.0)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 更新累積統計並透過 WebSocket 推送
     *
     * @param examId 測驗 ID
     */
    @Transactional(readOnly = true)
    public void updateCumulativeStatistics(Long examId) {
        log.debug("Updating cumulative statistics for exam: {}", examId);

        StatisticsDTO.CumulativeStatistics statistics = generateCumulativeStatistics(examId);

        // 透過 WebSocket 推送
        webSocketService.broadcastCumulativeStatistics(examId,
                WebSocketMessage.cumulativeUpdated(statistics));
    }

    /**
     * 生成累積統計資料
     *
     * @param examId 測驗 ID
     * @return 累積統計 DTO
     */
    @Transactional(readOnly = true)
    public StatisticsDTO.CumulativeStatistics generateCumulativeStatistics(Long examId) {
        // 統計各分數的學員數量
        List<Map<String, Object>> scoreDistributionData = studentRepository.countByExamIdGroupByTotalScore(examId);

        // 總學員數
        long totalStudents = studentRepository.countByExamId(examId);

        // 總題目數
        long totalQuestions = questionRepository.countByExamId(examId);

        // 建立分數分布列表
        List<StatisticsDTO.ScoreDistribution> scoreDistribution = scoreDistributionData.stream()
                .map(data -> {
                    int score = ((Number) data.get("score")).intValue();
                    long count = ((Number) data.get("count")).longValue();
                    double percentage = totalStudents > 0 ? (count * 100.0 / totalStudents) : 0.0;

                    return StatisticsDTO.ScoreDistribution.builder()
                            .score(score)
                            .count(count)
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .build();
                })
                .collect(Collectors.toList());

        // 計算平均分數
        double averageScore = scoreDistributionData.stream()
                .mapToDouble(data -> {
                    int score = ((Number) data.get("score")).intValue();
                    long count = ((Number) data.get("count")).longValue();
                    return score * count;
                })
                .sum() / (totalStudents > 0 ? totalStudents : 1);

        // 獲取累積圖表類型（使用第一題的設定）
        List<Question> questions = questionRepository.findByExamIdOrderByQuestionOrderAsc(examId);
        var chartType = questions.isEmpty() ? null : questions.get(0).getCumulativeChartType();

        return StatisticsDTO.CumulativeStatistics.builder()
                .examId(examId)
                .totalStudents((int) totalStudents)
                .totalQuestions((int) totalQuestions)
                .chartType(chartType)
                .scoreDistribution(scoreDistribution)
                .averageScore(Math.round(averageScore * 100.0) / 100.0)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 生成排行榜並透過 WebSocket 推送
     *
     * @param examId 測驗 ID
     * @param limit 返回名次數量（預設 20）
     */
    @Transactional(readOnly = true)
    public void broadcastLeaderboard(Long examId, int limit) {
        log.info("Generating leaderboard for exam: {}", examId);

        LeaderboardDTO leaderboard = generateLeaderboard(examId, limit);

        // 透過 WebSocket 推送
        webSocketService.broadcastLeaderboard(examId,
                WebSocketMessage.leaderboardUpdated(leaderboard));
    }

    /**
     * 生成排行榜
     *
     * @param examId 測驗 ID
     * @param limit 返回名次數量
     * @return 排行榜 DTO
     */
    @Transactional(readOnly = true)
    public LeaderboardDTO generateLeaderboard(Long examId, int limit) {
        // 查詢前 N 名學員
        List<Student> topStudents = studentRepository.findTopNByExamId(examId, limit);

        // 總題目數（用於計算正確率）
        long totalQuestions = questionRepository.countByExamId(examId);

        // 建立排行榜條目
        AtomicInteger rank = new AtomicInteger(1);
        List<LeaderboardDTO.LeaderboardEntry> entries = topStudents.stream()
                .map(student -> {
                    // 計算正確率（回傳比例，例如 0.5 代表 50%）
                    double correctRate = totalQuestions > 0
                            ? ((double) student.getTotalScore() / totalQuestions)
                            : 0.0;

                    return LeaderboardDTO.LeaderboardEntry.builder()
                            .rank(rank.getAndIncrement())
                            .studentId(student.getId())
                            .name(student.getName())
                            .avatarIcon(student.getAvatarIcon())
                            .totalScore(student.getTotalScore())
                            .correctRate(Math.round(correctRate * 10000.0) / 10000.0)
                            .build();
                })
                .collect(Collectors.toList());

        return LeaderboardDTO.builder()
                .examId(examId)
                .totalStudents((int) studentRepository.countByExamId(examId))
                .totalQuestions((int) totalQuestions)
                .leaderboard(entries)
                .timestamp(LocalDateTime.now())
                .build();
    }

}