package com.exam.system.tier.repository;

import com.exam.system.entity.User;
import com.exam.system.tier.entity.TierChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 升降級稽核 log Repository
 */
@Repository
public interface TierChangeLogRepository extends JpaRepository<TierChangeLog, Long> {

    List<TierChangeLog> findByOwnerOrderByChangedAtDesc(User owner);
}
