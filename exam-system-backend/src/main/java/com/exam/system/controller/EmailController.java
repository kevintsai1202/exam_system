package com.exam.system.controller;

import com.exam.system.dto.EmailTemplateDTO;
import com.exam.system.dto.EmailCampaignDTO;
import com.exam.system.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 郵件控制器
 */
@Slf4j
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    // ==================== 範本 API ====================

    /**
     * 建立郵件範本
     * POST /api/email-templates
     */
    @PostMapping("/email-templates")
    public ResponseEntity<EmailTemplateDTO> createTemplate(@Valid @RequestBody EmailTemplateDTO dto) {
        log.info("建立郵件範本: name={}", dto.getName());
        EmailTemplateDTO created = emailService.createTemplate(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 更新郵件範本
     * PUT /api/email-templates/{id}
     */
    @PutMapping("/email-templates/{id}")
    public ResponseEntity<EmailTemplateDTO> updateTemplate(
            @PathVariable Long id,
            @Valid @RequestBody EmailTemplateDTO dto) {
        log.info("更新郵件範本: id={}", id);
        EmailTemplateDTO updated = emailService.updateTemplate(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * 取得郵件範本
     * GET /api/email-templates/{id}
     */
    @GetMapping("/email-templates/{id}")
    public ResponseEntity<EmailTemplateDTO> getTemplate(@PathVariable Long id) {
        EmailTemplateDTO template = emailService.getTemplate(id);
        return ResponseEntity.ok(template);
    }

    /**
     * 取得所有郵件範本
     * GET /api/email-templates
     */
    @GetMapping("/email-templates")
    public ResponseEntity<List<EmailTemplateDTO>> getAllTemplates() {
        List<EmailTemplateDTO> templates = emailService.getAllTemplates();
        return ResponseEntity.ok(templates);
    }

    /**
     * 刪除郵件範本
     * DELETE /api/email-templates/{id}
     */
    @DeleteMapping("/email-templates/{id}")
    public ResponseEntity<Map<String, String>> deleteTemplate(@PathVariable Long id) {
        log.info("刪除郵件範本: id={}", id);
        emailService.deleteTemplate(id);
        return ResponseEntity.ok(Map.of("message", "範本已刪除", "id", id.toString()));
    }

    // ==================== 活動 API ====================

    /**
     * 建立郵件活動
     * POST /api/email-campaigns
     */
    @PostMapping("/email-campaigns")
    public ResponseEntity<EmailCampaignDTO> createCampaign(@Valid @RequestBody EmailCampaignDTO dto) {
        log.info("建立郵件活動: examId={}, name={}", dto.getExamId(), dto.getName());
        EmailCampaignDTO created = emailService.createCampaign(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * 更新郵件活動
     * PUT /api/email-campaigns/{id}
     */
    @PutMapping("/email-campaigns/{id}")
    public ResponseEntity<EmailCampaignDTO> updateCampaign(
            @PathVariable Long id,
            @Valid @RequestBody EmailCampaignDTO dto) {
        log.info("更新郵件活動: id={}", id);
        EmailCampaignDTO updated = emailService.updateCampaign(id, dto);
        return ResponseEntity.ok(updated);
    }

    /**
     * 取得郵件活動
     * GET /api/email-campaigns/{id}
     */
    @GetMapping("/email-campaigns/{id}")
    public ResponseEntity<EmailCampaignDTO> getCampaign(@PathVariable Long id) {
        EmailCampaignDTO campaign = emailService.getCampaign(id);
        return ResponseEntity.ok(campaign);
    }

    /**
     * 取得所有郵件活動
     * GET /api/email-campaigns
     */
    @GetMapping("/email-campaigns")
    public ResponseEntity<List<EmailCampaignDTO>> getAllCampaigns() {
        List<EmailCampaignDTO> campaigns = emailService.getAllCampaigns();
        return ResponseEntity.ok(campaigns);
    }

    /**
     * 取得測驗的郵件活動列表
     * GET /api/exams/{examId}/email-campaigns
     */
    @GetMapping("/exams/{examId}/email-campaigns")
    public ResponseEntity<List<EmailCampaignDTO>> getCampaignsByExamId(@PathVariable Long examId) {
        List<EmailCampaignDTO> campaigns = emailService.getCampaignsByExamId(examId);
        return ResponseEntity.ok(campaigns);
    }

    /**
     * 刪除郵件活動
     * DELETE /api/email-campaigns/{id}
     */
    @DeleteMapping("/email-campaigns/{id}")
    public ResponseEntity<Map<String, String>> deleteCampaign(@PathVariable Long id) {
        log.info("刪除郵件活動: id={}", id);
        emailService.deleteCampaign(id);
        return ResponseEntity.ok(Map.of("message", "活動已刪除", "id", id.toString()));
    }

    /**
     * 新增測驗學員為收件人
     * POST /api/email-campaigns/{id}/add-exam-students
     */
    @PostMapping("/email-campaigns/{id}/add-exam-students")
    public ResponseEntity<EmailCampaignDTO> addExamStudentsAsRecipients(@PathVariable Long id) {
        log.info("新增測驗學員為收件人: campaignId={}", id);
        EmailCampaignDTO updated = emailService.addExamStudentsAsRecipients(id);
        return ResponseEntity.ok(updated);
    }

    /**
     * 發送郵件活動
     * POST /api/email-campaigns/{id}/send
     */
    @PostMapping("/email-campaigns/{id}/send")
    public ResponseEntity<EmailCampaignDTO> sendCampaign(@PathVariable Long id) {
        log.info("發送郵件活動: id={}", id);
        EmailCampaignDTO campaign = emailService.sendCampaign(id);
        return ResponseEntity.ok(campaign);
    }

    /**
     * 取得發送狀態
     * GET /api/email-campaigns/{id}/status
     */
    @GetMapping("/email-campaigns/{id}/status")
    public ResponseEntity<EmailCampaignDTO> getCampaignStatus(@PathVariable Long id) {
        EmailCampaignDTO status = emailService.getCampaignStatus(id);
        return ResponseEntity.ok(status);
    }
}
