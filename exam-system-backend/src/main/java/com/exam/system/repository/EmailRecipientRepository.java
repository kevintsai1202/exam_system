package com.exam.system.repository;

import com.exam.system.entity.EmailRecipient;
import com.exam.system.entity.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 郵件收件人 Repository
 */
@Repository
public interface EmailRecipientRepository extends JpaRepository<EmailRecipient, Long> {

    /**
     * 根據活動 ID 查詢收件人列表
     */
    List<EmailRecipient> findByCampaignId(Long campaignId);

    /**
     * 根據活動 ID 和狀態查詢收件人
     */
    List<EmailRecipient> findByCampaignIdAndStatus(Long campaignId, DeliveryStatus status);

    /**
     * 統計活動的收件人數量
     */
    long countByCampaignId(Long campaignId);

    /**
     * 統計活動已發送的收件人數量
     */
    long countByCampaignIdAndStatus(Long campaignId, DeliveryStatus status);

    /**
     * 刪除活動的所有收件人
     */
    void deleteByCampaignId(Long campaignId);
}
