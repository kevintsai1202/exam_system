package com.exam.system.controller;

import com.exam.system.dto.SurveyFieldDTO;
import com.exam.system.service.SurveyFieldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 調查欄位控制器
 * 處理調查欄位相關的 REST API 請求
 */
@Slf4j
@RestController
@RequestMapping("/api/survey-fields")
@RequiredArgsConstructor
public class SurveyFieldController {

    private final SurveyFieldService surveyFieldService;

    /**
     * 建立調查欄位
     * POST /api/survey-fields
     */
    @PostMapping
    public ResponseEntity<SurveyFieldDTO> createSurveyField(@Valid @RequestBody SurveyFieldDTO dto) {
        log.info("Creating survey field: {}", dto.getFieldKey());
        SurveyFieldDTO created = surveyFieldService.createSurveyField(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 更新調查欄位
     * PUT /api/survey-fields/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<SurveyFieldDTO> updateSurveyField(
            @PathVariable Long id,
            @Valid @RequestBody SurveyFieldDTO dto) {
        log.info("Updating survey field: {}", id);
        SurveyFieldDTO updated = surveyFieldService.updateSurveyField(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * 刪除調查欄位
     * DELETE /api/survey-fields/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSurveyField(@PathVariable Long id) {
        log.info("Deleting survey field: {}", id);
        surveyFieldService.deleteSurveyField(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 取得單一調查欄位
     * GET /api/survey-fields/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<SurveyFieldDTO> getSurveyField(@PathVariable Long id) {
        log.info("Getting survey field: {}", id);
        SurveyFieldDTO surveyField = surveyFieldService.getSurveyField(id);
        return ResponseEntity.ok(surveyField);
    }

    /**
     * 根據欄位鍵值取得調查欄位
     * GET /api/survey-fields/by-key/{fieldKey}
     */
    @GetMapping("/by-key/{fieldKey}")
    public ResponseEntity<SurveyFieldDTO> getSurveyFieldByKey(@PathVariable String fieldKey) {
        log.info("Getting survey field by key: {}", fieldKey);
        SurveyFieldDTO surveyField = surveyFieldService.getSurveyFieldByKey(fieldKey);
        return ResponseEntity.ok(surveyField);
    }

    /**
     * 取得所有調查欄位
     * GET /api/survey-fields
     */
    @GetMapping
    public ResponseEntity<List<SurveyFieldDTO>> getAllSurveyFields(
            @RequestParam(required = false) Boolean activeOnly) {
        log.info("Getting survey fields (activeOnly: {})", activeOnly);

        List<SurveyFieldDTO> surveyFields = Boolean.TRUE.equals(activeOnly)
                ? surveyFieldService.getActiveSurveyFields()
                : surveyFieldService.getAllSurveyFields();

        return ResponseEntity.ok(surveyFields);
    }

}
