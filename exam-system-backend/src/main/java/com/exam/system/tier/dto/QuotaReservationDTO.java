package com.exam.system.tier.dto;

import com.exam.system.tier.entity.QuotaDimension;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * 預扣憑證 — Service 內部使用，呼叫端持有以便 confirm/rollback
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuotaReservationDTO {
    private Long ownerId;
    private QuotaDimension dimension;
    private LocalDate periodStartDate;
    private int reservedAmount;
}
