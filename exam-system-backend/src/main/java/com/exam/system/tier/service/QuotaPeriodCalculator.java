package com.exam.system.tier.service;

import com.exam.system.tier.entity.QuotaResetPeriod;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

/**
 * 配額週期計算器 — 純函式無狀態
 * 給定錨點與今天，回傳該講師當期的 period_start_date。
 *
 * 計算邏輯：
 * - MONTHLY：以錨點為基準，計算距今完整月數 N，回傳 anchor + N months。
 *   Java LocalDate.plusMonths() 內建 last-day clamping，例如 1/31 + 1 month → 2/28（平年）。
 * - NEVER：永久累計，直接回傳錨點，不做任何日期偏移。
 */
@Component
public class QuotaPeriodCalculator {

    /**
     * 計算當期起始日
     *
     * @param anchorDate  講師 tier_subscribed_at 的日期部分（週期重置基準點）
     * @param today       當日（測試可注入任意日期，生產端傳入 LocalDate.now()）
     * @param resetPeriod MONTHLY 跟著錨點走；NEVER 永遠回錨點
     * @return 當期起始日
     */
    public LocalDate computePeriodStart(LocalDate anchorDate, LocalDate today, QuotaResetPeriod resetPeriod) {
        // NEVER 模式：永遠回傳錨點，配額從不重置
        if (resetPeriod == QuotaResetPeriod.NEVER) {
            return anchorDate;
        }

        // MONTHLY 模式：計算從錨點到今日已過了幾個完整月
        // ChronoUnit.MONTHS.between 會自動向下取整（floor），確保不超過 today
        long monthsElapsed = ChronoUnit.MONTHS.between(anchorDate, today);

        // 以錨點加上完整月數，得到當期起始日
        // plusMonths 內建 last-day clamping：1/31 + 1 month → 2/28
        return anchorDate.plusMonths(monthsElapsed);
    }
}
