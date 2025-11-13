package com.exam.system.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 順序調整請求 DTO
 * 用於調整題目或選項的順序
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReorderRequestDTO {

    /**
     * ID 列表（題目 ID 或選項 ID）
     * 陣列順序即為新的排序順序
     */
    @NotNull(message = "ID 列表不能為空")
    @Size(min = 1, message = "至少需要一個 ID")
    private List<Long> ids;

}
