package com.exam.system.tier.service;

import com.exam.system.tier.entity.QuotaResetPeriod;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

class QuotaPeriodCalculatorTest {

    private final QuotaPeriodCalculator calc = new QuotaPeriodCalculator();

    @Test
    @DisplayName("MONTHLY: 同月份內，period_start = anchor")
    void monthly_withinFirstMonth() {
        LocalDate anchor = LocalDate.of(2026, 5, 17);
        LocalDate today  = LocalDate.of(2026, 6, 16);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 5, 17));
    }

    @Test
    @DisplayName("MONTHLY: 跨月後 period_start = anchor + N months")
    void monthly_acrossMonths() {
        LocalDate anchor = LocalDate.of(2026, 5, 17);
        LocalDate today  = LocalDate.of(2026, 6, 20);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 6, 17));
    }

    @Test
    @DisplayName("MONTHLY: 月底日 1/31 → 2 月 clamping 到 2/28（平年）")
    void monthly_lastDayClampingFebruary() {
        LocalDate anchor = LocalDate.of(2026, 1, 31);
        LocalDate today  = LocalDate.of(2026, 2, 28);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 1, 31));
    }

    @Test
    @DisplayName("MONTHLY: 月底日 1/31 → 3/31 跨期")
    void monthly_lastDayClampingMarch() {
        LocalDate anchor = LocalDate.of(2026, 1, 31);
        LocalDate today  = LocalDate.of(2026, 3, 31);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.MONTHLY);

        assertThat(periodStart).isEqualTo(LocalDate.of(2026, 3, 31));
    }

    @Test
    @DisplayName("NEVER: period_start 永遠等於 anchor，不論今天")
    void never_periodAlwaysEqualsAnchor() {
        LocalDate anchor = LocalDate.of(2025, 1, 10);
        LocalDate today  = LocalDate.of(2026, 12, 31);

        LocalDate periodStart = calc.computePeriodStart(anchor, today, QuotaResetPeriod.NEVER);

        assertThat(periodStart).isEqualTo(LocalDate.of(2025, 1, 10));
    }
}
