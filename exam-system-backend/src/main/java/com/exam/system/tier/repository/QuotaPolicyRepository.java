package com.exam.system.tier.repository;

import com.exam.system.entity.UserTier;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 配額政策 Repository
 */
@Repository
public interface QuotaPolicyRepository extends JpaRepository<QuotaPolicy, Long> {

    Optional<QuotaPolicy> findByTierAndDimension(UserTier tier, QuotaDimension dimension);

    List<QuotaPolicy> findByTier(UserTier tier);
}
