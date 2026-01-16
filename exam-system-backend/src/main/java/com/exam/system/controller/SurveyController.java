package com.exam.system.controller;

import com.exam.system.dto.SurveyDTO;
import com.exam.system.dto.SurveyResponseDTO;
import com.exam.system.dto.SurveyStatisticsDTO;
import com.exam.system.service.SurveyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 問券調查控制器
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SurveyController {

    private final SurveyService surveyService;

    /**
     * 建立問券
     * POST /api/surveys
     */
    @PostMapping("/surveys")
    public ResponseEntity<SurveyDTO> createSurvey(@Valid @RequestBody SurveyDTO dto) {
        log.info("建立問券: examId={}, title={}", dto.getExamId(), dto.getTitle());
        SurveyDTO created = surveyService.createSurvey(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 更新問券
     * PUT /api/surveys/{id}
     */
    @PutMapping("/surveys/{id}")
    public ResponseEntity<SurveyDTO> updateSurvey(
            @PathVariable Long id,
            @Valid @RequestBody SurveyDTO dto) {
        log.info("更新問券: id={}", id);
        SurveyDTO updated = surveyService.updateSurvey(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * 取得問券
     * GET /api/surveys/{id}
     */
    @GetMapping("/surveys/{id}")
    public ResponseEntity<SurveyDTO> getSurvey(@PathVariable Long id) {
        SurveyDTO survey = surveyService.getSurvey(id);
        return ResponseEntity.ok(survey);
    }

    /**
     * 取得所有問券列表
     * GET /api/surveys
     */
    @GetMapping("/surveys")
    public ResponseEntity<List<SurveyDTO>> getAllSurveys() {
        List<SurveyDTO> surveys = surveyService.getAllSurveys();
        return ResponseEntity.ok(surveys);
    }

    /**
     * 取得測驗的問券列表
     * GET /api/exams/{examId}/surveys
     */
    @GetMapping("/exams/{examId}/surveys")
    public ResponseEntity<List<SurveyDTO>> getSurveysByExamId(@PathVariable Long examId) {
        List<SurveyDTO> surveys = surveyService.getSurveysByExamId(examId);
        return ResponseEntity.ok(surveys);
    }

    /**
     * 啟用問券
     * PUT /api/surveys/{id}/activate
     */
    @PutMapping("/surveys/{id}/activate")
    public ResponseEntity<SurveyDTO> activateSurvey(@PathVariable Long id) {
        log.info("啟用問券: id={}", id);
        SurveyDTO activated = surveyService.activateSurvey(id);
        return ResponseEntity.ok(activated);
    }

    /**
     * 關閉問券
     * PUT /api/surveys/{id}/close
     */
    @PutMapping("/surveys/{id}/close")
    public ResponseEntity<SurveyDTO> closeSurvey(@PathVariable Long id) {
        log.info("關閉問券: id={}", id);
        SurveyDTO closed = surveyService.closeSurvey(id);
        return ResponseEntity.ok(closed);
    }

    /**
     * 刪除問券
     * DELETE /api/surveys/{id}
     */
    @DeleteMapping("/surveys/{id}")
    public ResponseEntity<Map<String, String>> deleteSurvey(@PathVariable Long id) {
        log.info("刪除問券: id={}", id);
        surveyService.deleteSurvey(id);
        return ResponseEntity.ok(Map.of("message", "問券已刪除", "id", id.toString()));
    }

    /**
     * 提交問券回覆
     * POST /api/surveys/{id}/responses
     */
    @PostMapping("/surveys/{id}/responses")
    public ResponseEntity<SurveyResponseDTO> submitResponse(
            @PathVariable Long id,
            @Valid @RequestBody SurveyResponseDTO dto) {
        log.info("提交問券回覆: surveyId={}", id);
        dto.setSurveyId(id);
        SurveyResponseDTO response = surveyService.submitResponse(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 取得問券統計
     * GET /api/surveys/{id}/statistics
     */
    @GetMapping("/surveys/{id}/statistics")
    public ResponseEntity<SurveyStatisticsDTO> getSurveyStatistics(@PathVariable Long id) {
        SurveyStatisticsDTO statistics = surveyService.getSurveyStatistics(id);
        return ResponseEntity.ok(statistics);
    }
}
