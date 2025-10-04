package com.exam.system.controller;

import com.exam.system.dto.LeaderboardDTO;
import com.exam.system.dto.StatisticsDTO;
import com.exam.system.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
            @RequestParam(required = false, defaultValue = "20") int limit,
            @RequestParam(required = false) Long studentId) {
        log.info("Getting leaderboard for exam: {} (limit: {}, studentId: {})", examId, limit, studentId);
        LeaderboardDTO leaderboard = statisticsService.generateLeaderboard(examId, limit, studentId);
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

}