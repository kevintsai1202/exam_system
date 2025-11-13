package com.exam.system.controller;

import com.exam.system.dto.LeaderboardDTO;
import com.exam.system.dto.StatisticsDTO;
import com.exam.system.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 統計控制器
 * 處理統計資料相關的 REST API 請求
 */
@Slf4j
@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    /**
     * 取得題目統計
     * GET /api/statistics/exams/{examId}/questions/{questionId}
     */
    @GetMapping("/exams/{examId}/questions/{questionId}")
    public ResponseEntity<StatisticsDTO.QuestionStatistics> getQuestionStatistics(
            @PathVariable Long examId,
            @PathVariable Long questionId) {
        log.info("Getting statistics for question: {}", questionId);
        StatisticsDTO.QuestionStatistics statistics = statisticsService.generateQuestionStatistics(questionId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * 取得累積統計
     * GET /api/statistics/exams/{examId}/cumulative
     */
    @GetMapping("/exams/{examId}/cumulative")
    public ResponseEntity<StatisticsDTO.CumulativeStatistics> getCumulativeStatistics(
            @PathVariable Long examId) {
        log.info("Getting cumulative statistics for exam: {}", examId);
        StatisticsDTO.CumulativeStatistics statistics = statisticsService.generateCumulativeStatistics(examId);
        return ResponseEntity.ok(statistics);
    }

    /**
     * 取得排行榜
     * GET /api/statistics/exams/{examId}/leaderboard
     */
    @GetMapping("/exams/{examId}/leaderboard")
    public ResponseEntity<LeaderboardDTO> getLeaderboard(
            @PathVariable Long examId,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        log.info("Getting leaderboard for exam: {} (limit: {})", examId, limit);
        LeaderboardDTO leaderboard = statisticsService.generateLeaderboard(examId, limit);
        return ResponseEntity.ok(leaderboard);
    }

    /**
     * 觸發排行榜廣播（測驗結束時使用）
     * POST /api/statistics/exams/{examId}/leaderboard/broadcast
     */
    @PostMapping("/exams/{examId}/leaderboard/broadcast")
    public ResponseEntity<Void> broadcastLeaderboard(
            @PathVariable Long examId,
            @RequestParam(required = false, defaultValue = "20") int limit) {
        log.info("Broadcasting leaderboard for exam: {}", examId);
        statisticsService.broadcastLeaderboard(examId, limit);
        return ResponseEntity.ok().build();
    }

    /**
     * 取得職業分布統計（保留向下兼容）
     * GET /api/statistics/exams/{examId}/occupation-distribution
     */
    @GetMapping("/exams/{examId}/occupation-distribution")
    public ResponseEntity<StatisticsDTO.OccupationDistribution> getOccupationDistribution(
            @PathVariable Long examId) {
        log.info("Getting occupation distribution for exam: {}", examId);
        StatisticsDTO.OccupationDistribution distribution = statisticsService.generateOccupationDistribution(examId);
        return ResponseEntity.ok(distribution);
    }

    /**
     * 取得指定調查欄位的分布統計
     * GET /api/statistics/exams/{examId}/survey-fields/{fieldKey}
     */
    @GetMapping("/exams/{examId}/survey-fields/{fieldKey}")
    public ResponseEntity<StatisticsDTO.SurveyFieldDistribution> getSurveyFieldDistribution(
            @PathVariable Long examId,
            @PathVariable String fieldKey) {
        log.info("Getting survey field distribution for exam: {}, fieldKey: {}", examId, fieldKey);
        StatisticsDTO.SurveyFieldDistribution distribution =
                statisticsService.generateSurveyFieldDistribution(examId, fieldKey);
        return ResponseEntity.ok(distribution);
    }

    /**
     * 取得測驗所有調查欄位的分布統計
     * GET /api/statistics/exams/{examId}/survey-fields
     */
    @GetMapping("/exams/{examId}/survey-fields")
    public ResponseEntity<List<StatisticsDTO.SurveyFieldDistribution>> getAllSurveyFieldDistributions(
            @PathVariable Long examId) {
        log.info("Getting all survey field distributions for exam: {}", examId);
        List<StatisticsDTO.SurveyFieldDistribution> distributions =
                statisticsService.generateAllSurveyFieldDistributions(examId);
        return ResponseEntity.ok(distributions);
    }

}