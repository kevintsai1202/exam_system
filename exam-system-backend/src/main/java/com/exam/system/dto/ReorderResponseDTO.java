package com.exam.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 順序調整回應 DTO
 * 用於回傳順序調整的結果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderResponseDTO {

    /**
     * 回應訊息
     */
    private String message;

    /**
     * 關聯的 ID（測驗 ID 或題目 ID）
     */
    private Long referenceId;

    /**
     * 新的順序（ID 列表）
     */
    private List<Long> newOrder;

}
