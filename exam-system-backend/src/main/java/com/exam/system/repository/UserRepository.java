package com.exam.system.repository;

import com.exam.system.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
     * 根據 Google ID 查找用戶
     */
    Optional<User> findByGoogleId(String googleId);

    /**
     * 檢查 Email 是否已存在
     */
    boolean existsByEmail(String email);

    /**
     * 檢查 Google ID 是否已存在
     */
    boolean existsByGoogleId(String googleId);
}
