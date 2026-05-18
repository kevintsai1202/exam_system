package com.exam.system.repository;

import com.exam.system.entity.User;
import com.exam.system.entity.UserTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 用戶資料存取層
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * 根據 Email 查找用戶
     */
    Optional<User> findByEmail(String email);

    /**
     * 根據 Email（忽略大小寫）查找用戶
     */
    Optional<User> findByEmailIgnoreCase(String email);

    /**
     * 根據 Google ID 查找用戶
     */
    Optional<User> findByGoogleId(String googleId);

    /**
     * 檢查 Email 是否已存在
     */
    boolean existsByEmail(String email);

    /**
     * 檢查 Email 是否已存在（忽略大小寫）
     */
    boolean existsByEmailIgnoreCase(String email);

    /**
     * 檢查 Google ID 是否已存在
     */
    boolean existsByGoogleId(String googleId);

    /**
     * 查詢所有 PAID tier 且已過期的用戶（排程自動降級用）
     *
     * @param tier  用戶分級（傳入 UserTier.PAID）
     * @param now   當前時間，tierExpiresAt 早於此時間者視為過期
     * @return 過期的 PAID 用戶清單
     */
    List<User> findByTierAndTierExpiresAtBefore(UserTier tier, LocalDateTime now);
}
