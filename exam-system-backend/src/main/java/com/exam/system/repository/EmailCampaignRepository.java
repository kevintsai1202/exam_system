package com.exam.system.repository;

import com.exam.system.entity.EmailCampaign;
import com.exam.system.entity.CampaignStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 郵件活動 Repository
 */
@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {

    /**
     * 根據測驗 ID 查詢活動列表
     */
    List<EmailCampaign> findByExamIdOrderByCreatedAtDesc(Long examId);

    /**
     * 根據狀態查詢活動
     */
    List<EmailCampaign> findByStatus(CampaignStatus status);

    /**
     * 查詢已排程且到達發送時間的活動
     */
    @Query("SELECT c FROM EmailCampaign c WHERE c.status = 'SCHEDULED' AND c.scheduledAt <= :now")
    List<EmailCampaign> findScheduledCampaignsReadyToSend(@Param("now") LocalDateTime now);

    /**
     * 查詢活動並載入收件人
     */
    @Query("SELECT c FROM EmailCampaign c LEFT JOIN FETCH c.recipients WHERE c.id = :id")
    Optional<EmailCampaign> findByIdWithRecipients(@Param("id") Long id);

    /**
     * 依 exam owner 取得活動列表（講師隔離用）
     */
    @Query("SELECT c FROM EmailCampaign c WHERE c.exam.owner.id = :ownerId ORDER BY c.createdAt DESC")
    List<EmailCampaign> findByExamOwnerIdOrderByCreatedAtDesc(@Param("ownerId") Long ownerId);

    /**
     * 統計測驗的活動數量
     */
    long countByExamId(Long examId);

    /**
     * 查詢所有活動，按建立時間降序
     */
    List<EmailCampaign> findAllByOrderByCreatedAtDesc();
}
