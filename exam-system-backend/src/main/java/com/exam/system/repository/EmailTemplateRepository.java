package com.exam.system.repository;

import com.exam.system.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 郵件範本 Repository
 */
@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Long> {

    /**
     * 根據名稱查詢範本
     */
    Optional<EmailTemplate> findByName(String name);

    /**
     * 根據名稱模糊查詢範本
     */
    List<EmailTemplate> findByNameContainingIgnoreCase(String name);

    /**
     * 查詢所有範本，按建立時間降序
     */
    List<EmailTemplate> findAllByOrderByCreatedAtDesc();
}
