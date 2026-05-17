package com.exam.system.tier.repository;

import com.exam.system.entity.User;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * 配額用量 Repository
 */
@Repository
public interface QuotaUsageRepository extends JpaRepository<QuotaUsage, Long> {

    Optional<QuotaUsage> findByOwnerAndDimensionAndPeriodStartDate(
            User owner, QuotaDimension dimension, LocalDate periodStartDate);

    List<QuotaUsage> findByOwner(User owner);
}
