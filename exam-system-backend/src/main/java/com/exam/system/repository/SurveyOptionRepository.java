package com.exam.system.repository;

import com.exam.system.entity.SurveyOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 問券選項 Repository
 */
@Repository
public interface SurveyOptionRepository extends JpaRepository<SurveyOption, Long> {

    /**
     * 根據題目 ID 查詢選項列表
     */
    List<SurveyOption> findByQuestionIdOrderByOptionOrderAsc(Long questionId);

    /**
     * 刪除題目的所有選項
     */
    void deleteByQuestionId(Long questionId);
}
