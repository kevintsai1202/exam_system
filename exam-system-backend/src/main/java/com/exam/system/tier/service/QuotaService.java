package com.exam.system.tier.service;

import com.exam.system.entity.User;
import com.exam.system.repository.UserRepository;
import com.exam.system.tier.dto.QuotaCheckResultDTO;
import com.exam.system.tier.dto.QuotaReservationDTO;
import com.exam.system.tier.dto.QuotaSnapshotDTO;
import com.exam.system.tier.entity.QuotaDimension;
import com.exam.system.tier.entity.QuotaPolicy;
import com.exam.system.tier.entity.QuotaResetPeriod;
import com.exam.system.tier.entity.QuotaUsage;
import com.exam.system.tier.exception.QuotaExceededException;
import com.exam.system.tier.repository.QuotaPolicyRepository;
import com.exam.system.tier.repository.QuotaUsageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * 配額服務 — 所有外發動作的中央守門員
 * check      → 非破壞性查詢，用於 UI 判斷按鈕 disabled 狀態
 * consume    → 同步扣抵，超額拋 QuotaExceededException
 * reserve    → 非同步預扣（立即計入用量），回傳憑證
 * confirm    → 確認預扣，退還 reserved - actual 的差額
 * rollback   → 取消預扣，全額退還
 * snapshot   → 講師配額完整快照，供儀表板展示
 */
@Service
@RequiredArgsConstructor
public class QuotaService {

    /** 配額政策 Repository */
    private final QuotaPolicyRepository policyRepository;
    /** 配額用量 Repository */
    private final QuotaUsageRepository usageRepository;
    /** 週期起始日計算器 */
    private final QuotaPeriodCalculator periodCalculator;
    /** 使用者 Repository（confirm/rollback 時以 ownerId 查詢 User） */
    private final UserRepository userRepository;

    /**
     * 非破壞性檢查 — 不寫入資料庫，僅回傳允許狀態與剩餘量
     *
     * @param owner     配額所有人（講師）
     * @param dimension 要檢查的配額維度
     * @param amount    本次請求量
     * @return 檢查結果 DTO
     */
    @Transactional(readOnly = true)
    public QuotaCheckResultDTO check(User owner, QuotaDimension dimension, int amount) {
        // 取得此 tier × dimension 的政策
        QuotaPolicy policy = policyRepository.findByTierAndDimension(owner.getTier(), dimension)
                .orElseThrow(() -> new IllegalStateException(
                        "No quota policy for tier=" + owner.getTier() + " dim=" + dimension));

        // limit = 0 代表此 tier 完全禁用此維度
        if (policy.getLimitValue() == 0) {
            return QuotaCheckResultDTO.builder()
                    .allowed(false).dimension(dimension)
                    .limit(0).used(0).remaining(0)
                    .reasonIfDenied("TIER_NOT_ALLOWED").build();
        }

        // 計算當期起始日並查詢已用量
        LocalDate periodStart = computePeriodStart(owner, policy);
        int used = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(owner, dimension, periodStart)
                .map(QuotaUsage::getUsedValue).orElse(0);

        boolean allowed = used + amount <= policy.getLimitValue();
        return QuotaCheckResultDTO.builder()
                .allowed(allowed).dimension(dimension)
                .limit(policy.getLimitValue()).used(used)
                .remaining(policy.getLimitValue() - used)
                .reasonIfDenied(allowed ? null : "PERIOD_LIMIT_REACHED").build();
    }

    /**
     * 同步扣抵配額 — 超額拋 QuotaExceededException
     *
     * @param owner     配額所有人（講師）
     * @param dimension 要扣抵的配額維度
     * @param amount    本次扣抵量
     * @param reason    扣抵原因（供日誌追蹤）
     * @throws QuotaExceededException 超過上限時拋出
     */
    @Transactional
    public void consume(User owner, QuotaDimension dimension, int amount, String reason) {
        // 取得政策
        QuotaPolicy policy = policyRepository.findByTierAndDimension(owner.getTier(), dimension)
                .orElseThrow(() -> new IllegalStateException(
                        "No quota policy for tier=" + owner.getTier() + " dim=" + dimension));

        // 計算當期起始日
        LocalDate periodStart = computePeriodStart(owner, policy);

        // 查詢或初始化 QuotaUsage 記錄
        QuotaUsage usage = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(owner, dimension, periodStart)
                .orElseGet(() -> QuotaUsage.builder()
                        .owner(owner).dimension(dimension)
                        .periodStartDate(periodStart).usedValue(0).build());

        int newUsed = usage.getUsedValue() + amount;

        // limit > 0 才做上限檢查（NEVER 重置的維度若 limit=0 代表禁用，已在 check 攔截）
        if (policy.getLimitValue() > 0 && newUsed > policy.getLimitValue()) {
            throw new QuotaExceededException(dimension, policy.getLimitValue(), usage.getUsedValue());
        }

        // 寫入用量
        usage.setUsedValue(newUsed);
        usage.setLastUpdatedAt(LocalDateTime.now());
        usageRepository.save(usage);
    }

    /**
     * 非同步預扣 — 立即計入用量，回傳憑證供後續 confirm/rollback
     * 行為等同 consume，但額外封裝成 QuotaReservationDTO 供呼叫端持有
     *
     * @param owner     配額所有人（講師）
     * @param dimension 要預扣的配額維度
     * @param amount    預扣量
     * @return 預扣憑證
     * @throws QuotaExceededException 超過上限時拋出
     */
    @Transactional
    public QuotaReservationDTO reserve(User owner, QuotaDimension dimension, int amount) {
        // 先執行 consume（超額直接拋例外，不建立憑證）
        consume(owner, dimension, amount, "RESERVE");

        // 建立並回傳預扣憑證
        QuotaPolicy policy = policyRepository.findByTierAndDimension(owner.getTier(), dimension).orElseThrow();
        return QuotaReservationDTO.builder()
                .ownerId(owner.getId()).dimension(dimension)
                .periodStartDate(computePeriodStart(owner, policy))
                .reservedAmount(amount).build();
    }

    /**
     * 確認預扣 — 以實際用量取代預扣量，退還差額
     * 若 actualAmount < reservedAmount，退還多扣的部分
     *
     * @param reservation 預扣憑證
     * @param actualAmount 實際消耗量（不得超過 reservedAmount）
     */
    @Transactional
    public void confirm(QuotaReservationDTO reservation, int actualAmount) {
        // 計算應退還量（差額），大於 0 才需要退還
        int refund = reservation.getReservedAmount() - actualAmount;
        if (refund > 0) {
            adjustUsage(reservation, -refund);
        }
    }

    /**
     * 取消預扣 — 全額退還預扣量，恢復配額
     *
     * @param reservation 預扣憑證
     */
    @Transactional
    public void rollback(QuotaReservationDTO reservation) {
        adjustUsage(reservation, -reservation.getReservedAmount());
    }

    /**
     * 講師配額完整快照 — 供後台儀表板展示
     *
     * @param owner 配額所有人（講師）
     * @return 快照 DTO，包含當期區間、剩餘重置天數、各維度用量
     */
    @Transactional(readOnly = true)
    public QuotaSnapshotDTO snapshot(User owner) {
        // 取得此 tier 所有維度的政策
        List<QuotaPolicy> policies = policyRepository.findByTier(owner.getTier());

        // 計算錨點日期：優先用 tierSubscribedAt，否則 createdAt
        LocalDate anchor = owner.getTierSubscribedAt() != null
                ? owner.getTierSubscribedAt().toLocalDate()
                : owner.getCreatedAt().toLocalDate();

        // 計算 MONTHLY 維度的當期起始/結束日
        LocalDate monthlyStart = periodCalculator.computePeriodStart(anchor, LocalDate.now(), QuotaResetPeriod.MONTHLY);
        LocalDate monthlyEnd = monthlyStart.plusMonths(1);
        long daysUntilReset = ChronoUnit.DAYS.between(LocalDate.now(), monthlyEnd);

        // 組裝各維度的 QuotaItem
        List<QuotaSnapshotDTO.QuotaItem> items = policies.stream().map(p -> {
            LocalDate periodStart = periodCalculator.computePeriodStart(anchor, LocalDate.now(), p.getResetPeriod());
            int used = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(owner, p.getDimension(), periodStart)
                    .map(QuotaUsage::getUsedValue).orElse(0);
            return QuotaSnapshotDTO.QuotaItem.builder()
                    .dimension(p.getDimension().name())
                    .limit(p.getLimitValue()).used(used)
                    .remaining(p.getLimitValue() - used)
                    .resetPeriod(p.getResetPeriod().name())
                    .build();
        }).toList();

        return QuotaSnapshotDTO.builder()
                .tier(owner.getTier())
                .periodStart(monthlyStart).periodEnd(monthlyEnd)
                .daysUntilReset(Math.max(0, daysUntilReset))
                .items(items).build();
    }

    /**
     * 計算指定 owner 於指定 policy 下的當期起始日
     *
     * @param owner  配額所有人
     * @param policy 配額政策（含 resetPeriod）
     * @return 當期起始日
     */
    private LocalDate computePeriodStart(User owner, QuotaPolicy policy) {
        // 錨點：优先 tierSubscribedAt，否則 createdAt
        LocalDate anchor = owner.getTierSubscribedAt() != null
                ? owner.getTierSubscribedAt().toLocalDate()
                : owner.getCreatedAt().toLocalDate();
        return periodCalculator.computePeriodStart(anchor, LocalDate.now(), policy.getResetPeriod());
    }

    /**
     * 調整 QuotaUsage 用量（正值增加，負值減少）
     * 用量不會低於 0
     *
     * @param reservation 預扣憑證（含 ownerId、dimension、periodStartDate）
     * @param delta       調整量（負數代表退還）
     */
    private void adjustUsage(QuotaReservationDTO reservation, int delta) {
        // 以 ownerId 重新載入 User（JPA 實體）
        User owner = userRepository.findById(reservation.getOwnerId())
                .orElseThrow(() -> new IllegalStateException("User not found: " + reservation.getOwnerId()));

        QuotaUsage usage = usageRepository.findByOwnerAndDimensionAndPeriodStartDate(
                owner, reservation.getDimension(), reservation.getPeriodStartDate())
                .orElseThrow(() -> new IllegalStateException(
                        "Reservation usage record not found for owner=" + reservation.getOwnerId()
                        + " dim=" + reservation.getDimension()
                        + " period=" + reservation.getPeriodStartDate()));

        // 退還後不得低於 0
        int newUsed = Math.max(0, usage.getUsedValue() + delta);
        usage.setUsedValue(newUsed);
        usage.setLastUpdatedAt(LocalDateTime.now());
        usageRepository.save(usage);
    }
}
