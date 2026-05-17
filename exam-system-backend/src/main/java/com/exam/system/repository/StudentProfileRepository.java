package com.exam.system.repository;

import com.exam.system.entity.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * 跨測驗學員主檔 Repository
 */
@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, Long> {

    /**
     * 以 email 查 profile（email 應為已正規化的 lowercase）
     */
    Optional<StudentProfile> findByEmail(String email);

    /**
     * 檢查 email 是否已存在
     */
    boolean existsByEmail(String email);
}
