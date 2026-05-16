package com.exam.system.service;

import com.exam.system.dto.EmailTemplateDTO;
import com.exam.system.dto.EmailCampaignDTO;
import com.exam.system.dto.EmailCampaignDTO.EmailRecipientDTO;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 郵件服務
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final EmailTemplateRepository templateRepository;
    private final EmailCampaignRepository campaignRepository;
    private final EmailRecipientRepository recipientRepository;
    private final ExamRepository examRepository;
    private final SurveyRepository surveyRepository;
    private final StudentRepository studentRepository;
    private final JavaMailSender mailSender;
    private final OwnershipGuard ownershipGuard;
    private final CurrentUserProvider currentUserProvider;

    @Value("${spring.mail.username:noreply@example.com}")
    private String fromEmail;

    // ==================== 範本管理 ====================

    /**
     * 建立郵件範本
     */
    @Transactional
    public EmailTemplateDTO createTemplate(EmailTemplateDTO dto) {
        log.info("建立郵件範本: name={}", dto.getName());

        EmailTemplate template = EmailTemplate.builder()
                .name(dto.getName())
                .subject(dto.getSubject())
                .htmlContent(dto.getHtmlContent())
                .plainTextContent(dto.getPlainTextContent())
                .build();

        return toTemplateDTO(templateRepository.save(template));
    }

    /**
     * 更新郵件範本
     */
    @Transactional
    public EmailTemplateDTO updateTemplate(Long id, EmailTemplateDTO dto) {
        log.info("更新郵件範本: id={}", id);

        EmailTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailTemplate", id));

        template.setName(dto.getName());
        template.setSubject(dto.getSubject());
        template.setHtmlContent(dto.getHtmlContent());
        template.setPlainTextContent(dto.getPlainTextContent());

        return toTemplateDTO(templateRepository.save(template));
    }

    /**
     * 取得郵件範本
     */
    @Transactional(readOnly = true)
    public EmailTemplateDTO getTemplate(Long id) {
        EmailTemplate template = templateRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailTemplate", id));
        return toTemplateDTO(template);
    }

    /**
     * 取得所有郵件範本
     */
    @Transactional(readOnly = true)
    public List<EmailTemplateDTO> getAllTemplates() {
        return templateRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toTemplateDTO)
                .collect(Collectors.toList());
    }

    /**
     * 刪除郵件範本
     */
    @Transactional
    public void deleteTemplate(Long id) {
        log.info("刪除郵件範本: id={}", id);

        if (!templateRepository.existsById(id)) {
            throw new ResourceNotFoundException("EmailTemplate", id);
        }

        templateRepository.deleteById(id);
    }

    // ==================== 活動管理 ====================

    /**
     * 建立郵件活動
     */
    @Transactional
    public EmailCampaignDTO createCampaign(EmailCampaignDTO dto) {
        log.info("建立郵件活動: examId={}, name={}", dto.getExamId(), dto.getName());

        Exam exam = examRepository.findById(dto.getExamId())
                .orElseThrow(() -> new ResourceNotFoundException("Exam", dto.getExamId()));
        ownershipGuard.assertOwnerOrAdmin(exam);

        EmailCampaign campaign = EmailCampaign.builder()
                .exam(exam)
                .name(dto.getName())
                .subject(dto.getSubject())
                .htmlContent(dto.getHtmlContent())
                .status(CampaignStatus.DRAFT)
                .scheduledAt(dto.getScheduledAt())
                .build();

        // 關聯問券
        if (dto.getSurveyId() != null) {
            Survey survey = surveyRepository.findById(dto.getSurveyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Survey", dto.getSurveyId()));
            campaign.setSurvey(survey);
        }

        // 關聯範本
        if (dto.getTemplateId() != null) {
            EmailTemplate template = templateRepository.findById(dto.getTemplateId())
                    .orElseThrow(() -> new ResourceNotFoundException("EmailTemplate", dto.getTemplateId()));
            campaign.setTemplate(template);
        }

        EmailCampaign savedCampaign = campaignRepository.save(campaign);

        // 如果有收件人列表，建立收件人
        if (dto.getRecipients() != null && !dto.getRecipients().isEmpty()) {
            for (EmailRecipientDTO recipientDTO : dto.getRecipients()) {
                createRecipient(savedCampaign, recipientDTO);
            }
        }

        return toCampaignDTO(campaignRepository.findByIdWithRecipients(savedCampaign.getId()).orElse(savedCampaign));
    }

    /**
     * 更新郵件活動
     */
    @Transactional
    public EmailCampaignDTO updateCampaign(Long id, EmailCampaignDTO dto) {
        log.info("更新郵件活動: id={}", id);

        EmailCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailCampaign", id));
        ownershipGuard.assertOwnerOrAdmin(campaign);

        if (campaign.getStatus() != CampaignStatus.DRAFT) {
            throw new BusinessException("只有草稿狀態的活動才能編輯");
        }

        campaign.setName(dto.getName());
        campaign.setSubject(dto.getSubject());
        campaign.setHtmlContent(dto.getHtmlContent());
        campaign.setScheduledAt(dto.getScheduledAt());

        // 更新關聯
        if (dto.getSurveyId() != null) {
            Survey survey = surveyRepository.findById(dto.getSurveyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Survey", dto.getSurveyId()));
            campaign.setSurvey(survey);
        } else {
            campaign.setSurvey(null);
        }

        return toCampaignDTO(campaignRepository.save(campaign));
    }

    /**
     * 取得郵件活動
     */
    @Transactional(readOnly = true)
    public EmailCampaignDTO getCampaign(Long id) {
        EmailCampaign campaign = campaignRepository.findByIdWithRecipients(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailCampaign", id));
        ownershipGuard.assertOwnerOrAdmin(campaign);
        return toCampaignDTO(campaign);
    }

    /**
     * 取得測驗的郵件活動列表（限 owner 或 ADMIN）
     */
    @Transactional(readOnly = true)
    public List<EmailCampaignDTO> getCampaignsByExamId(Long examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", examId));
        ownershipGuard.assertOwnerOrAdmin(exam);
        return campaignRepository.findByExamIdOrderByCreatedAtDesc(examId).stream()
                .map(this::toCampaignDTO)
                .collect(Collectors.toList());
    }

    /**
     * 取得郵件活動列表
     * ADMIN 取全部；INSTRUCTOR 只取自己 exam 下的活動
     */
    @Transactional(readOnly = true)
    public List<EmailCampaignDTO> getAllCampaigns() {
        User current = currentUserProvider.requireCurrentUser();
        List<EmailCampaign> campaigns;
        if (current.getRole() == UserRole.ADMIN) {
            campaigns = campaignRepository.findAllByOrderByCreatedAtDesc();
        } else {
            campaigns = campaignRepository.findByExamOwnerIdOrderByCreatedAtDesc(current.getId());
        }
        return campaigns.stream().map(this::toCampaignDTO).collect(Collectors.toList());
    }

    /**
     * 刪除郵件活動（限 owner 或 ADMIN）
     */
    @Transactional
    public void deleteCampaign(Long id) {
        log.info("刪除郵件活動: id={}", id);

        EmailCampaign campaign = campaignRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailCampaign", id));
        ownershipGuard.assertOwnerOrAdmin(campaign);

        if (campaign.getStatus() == CampaignStatus.SENDING) {
            throw new BusinessException("發送中的活動無法刪除");
        }

        campaignRepository.delete(campaign);
    }

    /**
     * 新增測驗學員為收件人
     */
    @Transactional
    public EmailCampaignDTO addExamStudentsAsRecipients(Long campaignId) {
        log.info("新增測驗學員為收件人: campaignId={}", campaignId);

        EmailCampaign campaign = campaignRepository.findById(campaignId)
                .orElseThrow(() -> new ResourceNotFoundException("EmailCampaign", campaignId));
        ownershipGuard.assertOwnerOrAdmin(campaign);

        if (campaign.getStatus() != CampaignStatus.DRAFT) {
            throw new BusinessException("只有草稿狀態的活動才能新增收件人");
        }

        // 取得測驗的所有學員
        List<Student> students = studentRepository.findByExamId(campaign.getExam().getId());

        for (Student student : students) {
            // 檢查是否已存在
            boolean exists = campaign.getRecipients().stream()
                    .anyMatch(r -> r.getStudent() != null && r.getStudent().getId().equals(student.getId()));

            if (!exists && student.getEmail() != null && !student.getEmail().isEmpty()) {
                EmailRecipient recipient = EmailRecipient.builder()
                        .campaign(campaign)
                        .student(student)
                        .email(student.getEmail())
                        .name(student.getName())
                        .status(DeliveryStatus.PENDING)
                        .build();
                campaign.addRecipient(recipient);
            }
        }

        campaign.setTotalRecipients(campaign.getRecipients().size());
        return toCampaignDTO(campaignRepository.save(campaign));
    }

    /**
     * 發送郵件活動
     */
    @Transactional
    public EmailCampaignDTO sendCampaign(Long id) {
        log.info("開始發送郵件活動: id={}", id);

        EmailCampaign campaign = campaignRepository.findByIdWithRecipients(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailCampaign", id));

        if (campaign.getStatus() != CampaignStatus.DRAFT && campaign.getStatus() != CampaignStatus.SCHEDULED) {
            throw new BusinessException("只有草稿或已排程的活動才能發送");
        }

        if (campaign.getRecipients().isEmpty()) {
            throw new BusinessException("活動沒有收件人");
        }

        campaign.startSending();
        campaignRepository.save(campaign);

        // 非同步發送郵件
        sendEmailsAsync(campaign);

        return toCampaignDTO(campaign);
    }

    /**
     * 取得發送狀態
     */
    @Transactional(readOnly = true)
    public EmailCampaignDTO getCampaignStatus(Long id) {
        EmailCampaign campaign = campaignRepository.findByIdWithRecipients(id)
                .orElseThrow(() -> new ResourceNotFoundException("EmailCampaign", id));
        return toCampaignDTO(campaign);
    }

    // ==================== 郵件發送 ====================

    /**
     * 非同步發送郵件
     */
    @Async
    public void sendEmailsAsync(EmailCampaign campaign) {
        log.info("開始非同步發送郵件: campaignId={}, 收件人數={}", campaign.getId(), campaign.getRecipients().size());

        for (EmailRecipient recipient : campaign.getRecipients()) {
            try {
                sendEmail(recipient.getEmail(), recipient.getName(), campaign.getSubject(), campaign.getHtmlContent());
                recipient.markSent();
                campaign.incrementSentCount();
                log.debug("郵件發送成功: email={}", recipient.getEmail());
            } catch (Exception e) {
                recipient.markFailed(e.getMessage());
                campaign.incrementFailedCount();
                log.error("郵件發送失敗: email={}, error={}", recipient.getEmail(), e.getMessage());
            }
            recipientRepository.save(recipient);
        }

        campaign.completeSending();
        campaignRepository.save(campaign);
        log.info("郵件活動發送完成: campaignId={}, 成功={}, 失敗={}",
                campaign.getId(), campaign.getSentCount(), campaign.getFailedCount());
    }

    /**
     * 發送單封郵件
     */
    private void sendEmail(String to, String name, String subject, String htmlContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(to);
        helper.setSubject(subject);

        // 替換收件人姓名變數
        String personalizedContent = htmlContent;
        if (name != null) {
            personalizedContent = personalizedContent.replace("{{name}}", name);
        }

        helper.setText(personalizedContent, true); // true 表示 HTML 格式

        mailSender.send(message);
    }

    // ==================== 私有方法 ====================

    private void createRecipient(EmailCampaign campaign, EmailRecipientDTO dto) {
        EmailRecipient recipient = EmailRecipient.builder()
                .campaign(campaign)
                .email(dto.getEmail())
                .name(dto.getName())
                .status(DeliveryStatus.PENDING)
                .build();

        if (dto.getStudentId() != null) {
            Student student = studentRepository.findById(dto.getStudentId()).orElse(null);
            recipient.setStudent(student);
        }

        campaign.addRecipient(recipient);
        campaign.setTotalRecipients(campaign.getRecipients().size());
    }

    // ==================== DTO 轉換方法 ====================

    private EmailTemplateDTO toTemplateDTO(EmailTemplate template) {
        return EmailTemplateDTO.builder()
                .id(template.getId())
                .name(template.getName())
                .subject(template.getSubject())
                .htmlContent(template.getHtmlContent())
                .plainTextContent(template.getPlainTextContent())
                .createdAt(template.getCreatedAt())
                .updatedAt(template.getUpdatedAt())
                .build();
    }

    private EmailCampaignDTO toCampaignDTO(EmailCampaign campaign) {
        EmailCampaignDTO dto = EmailCampaignDTO.builder()
                .id(campaign.getId())
                .examId(campaign.getExam().getId())
                .examTitle(campaign.getExam().getTitle())
                .name(campaign.getName())
                .subject(campaign.getSubject())
                .htmlContent(campaign.getHtmlContent())
                .status(campaign.getStatus())
                .scheduledAt(campaign.getScheduledAt())
                .sentAt(campaign.getSentAt())
                .totalRecipients(campaign.getTotalRecipients())
                .sentCount(campaign.getSentCount())
                .failedCount(campaign.getFailedCount())
                .createdAt(campaign.getCreatedAt())
                .updatedAt(campaign.getUpdatedAt())
                .build();

        if (campaign.getSurvey() != null) {
            dto.setSurveyId(campaign.getSurvey().getId());
            dto.setSurveyTitle(campaign.getSurvey().getTitle());
        }

        if (campaign.getTemplate() != null) {
            dto.setTemplateId(campaign.getTemplate().getId());
            dto.setTemplateName(campaign.getTemplate().getName());
        }

        if (campaign.getRecipients() != null) {
            dto.setRecipients(campaign.getRecipients().stream()
                    .map(this::toRecipientDTO)
                    .collect(Collectors.toList()));
        }

        return dto;
    }

    private EmailRecipientDTO toRecipientDTO(EmailRecipient recipient) {
        EmailRecipientDTO dto = EmailRecipientDTO.builder()
                .id(recipient.getId())
                .email(recipient.getEmail())
                .name(recipient.getName())
                .status(recipient.getStatus())
                .sentAt(recipient.getSentAt())
                .errorMessage(recipient.getErrorMessage())
                .build();

        if (recipient.getStudent() != null) {
            dto.setStudentId(recipient.getStudent().getId());
        }

        return dto;
    }
}
