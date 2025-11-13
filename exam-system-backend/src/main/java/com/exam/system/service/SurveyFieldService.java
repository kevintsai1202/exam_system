package com.exam.system.service;

import com.exam.system.dto.SurveyFieldDTO;
import com.exam.system.entity.SurveyField;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.SurveyFieldRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 調查欄位服務
 * 處理調查欄位的 CRUD 操作
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SurveyFieldService {

    private final SurveyFieldRepository surveyFieldRepository;

    /**
     * 建立調查欄位
     *
     * @param dto 調查欄位 DTO
     * @return 建立的調查欄位 DTO
     */
    @Transactional
    public SurveyFieldDTO createSurveyField(SurveyFieldDTO dto) {
        log.info("Creating survey field: {}", dto.getFieldKey());

        // 檢查欄位鍵值是否已存在
        if (surveyFieldRepository.existsByFieldKey(dto.getFieldKey())) {
            throw new BusinessException("調查欄位鍵值已存在: " + dto.getFieldKey());
        }

        // 建立實體
        SurveyField surveyField = SurveyField.builder()
                .fieldKey(dto.getFieldKey())
                .fieldName(dto.getFieldName())
                .fieldType(dto.getFieldType())
                .options(dto.getOptions())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .displayOrder(dto.getDisplayOrder() != null ? dto.getDisplayOrder() : 0)
                .build();

        surveyField = surveyFieldRepository.save(surveyField);
        log.info("Survey field created: {}", surveyField.getId());

        return toDTO(surveyField);
    }

    /**
     * 更新調查欄位
     *
     * @param id 調查欄位 ID
     * @param dto 調查欄位 DTO
     * @return 更新後的調查欄位 DTO
     */
    @Transactional
    public SurveyFieldDTO updateSurveyField(Long id, SurveyFieldDTO dto) {
        log.info("Updating survey field: {}", id);

        SurveyField surveyField = surveyFieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SurveyField", id));

        // 更新欄位
        surveyField.setFieldName(dto.getFieldName());
        surveyField.setFieldType(dto.getFieldType());
        surveyField.setOptions(dto.getOptions());
        if (dto.getIsActive() != null) {
            surveyField.setIsActive(dto.getIsActive());
        }
        if (dto.getDisplayOrder() != null) {
            surveyField.setDisplayOrder(dto.getDisplayOrder());
        }

        surveyField = surveyFieldRepository.save(surveyField);
        log.info("Survey field updated: {}", id);

        return toDTO(surveyField);
    }

    /**
     * 刪除調查欄位
     *
     * @param id 調查欄位 ID
     */
    @Transactional
    public void deleteSurveyField(Long id) {
        log.info("Deleting survey field: {}", id);

        if (!surveyFieldRepository.existsById(id)) {
            throw new ResourceNotFoundException("SurveyField", id);
        }

        surveyFieldRepository.deleteById(id);
        log.info("Survey field deleted: {}", id);
    }

    /**
     * 取得單一調查欄位
     *
     * @param id 調查欄位 ID
     * @return 調查欄位 DTO
     */
    @Transactional(readOnly = true)
    public SurveyFieldDTO getSurveyField(Long id) {
        log.debug("Getting survey field: {}", id);

        SurveyField surveyField = surveyFieldRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("SurveyField", id));

        return toDTO(surveyField);
    }

    /**
     * 根據欄位鍵值取得調查欄位
     *
     * @param fieldKey 欄位鍵值
     * @return 調查欄位 DTO
     */
    @Transactional(readOnly = true)
    public SurveyFieldDTO getSurveyFieldByKey(String fieldKey) {
        log.debug("Getting survey field by key: {}", fieldKey);

        SurveyField surveyField = surveyFieldRepository.findByFieldKey(fieldKey)
                .orElseThrow(() -> new ResourceNotFoundException("SurveyField with key: " + fieldKey));

        return toDTO(surveyField);
    }

    /**
     * 取得所有調查欄位
     *
     * @return 調查欄位 DTO 列表
     */
    @Transactional(readOnly = true)
    public List<SurveyFieldDTO> getAllSurveyFields() {
        log.debug("Getting all survey fields");

        List<SurveyField> surveyFields = surveyFieldRepository.findAll();

        return surveyFields.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 取得所有啟用的調查欄位
     *
     * @return 調查欄位 DTO 列表
     */
    @Transactional(readOnly = true)
    public List<SurveyFieldDTO> getActiveSurveyFields() {
        log.debug("Getting active survey fields");

        List<SurveyField> surveyFields = surveyFieldRepository.findByIsActiveOrderByDisplayOrderAsc(true);

        return surveyFields.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 根據欄位鍵值列表取得調查欄位
     *
     * @param fieldKeys 欄位鍵值列表
     * @return 調查欄位 DTO 列表
     */
    @Transactional(readOnly = true)
    public List<SurveyFieldDTO> getSurveyFieldsByKeys(List<String> fieldKeys) {
        log.debug("Getting survey fields by keys: {}", fieldKeys);

        List<SurveyField> surveyFields = surveyFieldRepository.findByFieldKeyIn(fieldKeys);

        return surveyFields.stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * 將實體轉換為 DTO
     */
    private SurveyFieldDTO toDTO(SurveyField surveyField) {
        return SurveyFieldDTO.builder()
                .id(surveyField.getId())
                .fieldKey(surveyField.getFieldKey())
                .fieldName(surveyField.getFieldName())
                .fieldType(surveyField.getFieldType())
                .options(surveyField.getOptions())
                .isActive(surveyField.getIsActive())
                .displayOrder(surveyField.getDisplayOrder())
                .createdAt(surveyField.getCreatedAt())
                .updatedAt(surveyField.getUpdatedAt())
                .build();
    }

}
