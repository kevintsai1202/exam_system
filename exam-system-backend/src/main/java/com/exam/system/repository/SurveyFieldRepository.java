package com.exam.system.repository;

import com.exam.system.entity.SurveyField;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 調查欄位資料訪問介面
 */
@Repository
public interface SurveyFieldRepository extends JpaRepository<SurveyField, Long> {

    /**
     * 根據欄位鍵值查詢
     *
     * @param fieldKey 欄位鍵值
     * @return 調查欄位實體（Optional）
     */
    Optional<SurveyField> findByFieldKey(String fieldKey);

    /**
     * 查詢所有啟用的調查欄位
     *
     * @param isActive 是否啟用
     * @return 調查欄位列表
     */
    List<SurveyField> findByIsActiveOrderByDisplayOrderAsc(Boolean isActive);

    /**
     * 根據欄位鍵值列表查詢
     *
     * @param fieldKeys 欄位鍵值列表
     * @return 調查欄位列表
     */
    List<SurveyField> findByFieldKeyIn(List<String> fieldKeys);

    /**
     * 檢查欄位鍵值是否存在
     *
     * @param fieldKey 欄位鍵值
     * @return true 如果存在
     */
    boolean existsByFieldKey(String fieldKey);

}
