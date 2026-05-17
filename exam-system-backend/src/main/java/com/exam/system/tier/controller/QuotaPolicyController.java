package com.exam.system.tier.controller;

import com.exam.system.tier.dto.QuotaPolicyDTO;
import com.exam.system.tier.entity.QuotaPolicy;
import com.exam.system.tier.repository.QuotaPolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 配額政策管理 — ADMIN 可調整數字不需發版
 */
@RestController
@RequestMapping("/api/admin/quota-policies")
@RequiredArgsConstructor
public class QuotaPolicyController {

    private final QuotaPolicyRepository policyRepository;

    /**
     * 列出所有配額政策（FREE + PAID 共 14 筆）
     */
    @GetMapping
    @Transactional(readOnly = true)
    public List<QuotaPolicyDTO> list() {
        return policyRepository.findAll().stream().map(this::toDto).toList();
    }

    /**
     * 調整某筆配額（只能改 limitValue；tier/dimension/resetPeriod 不可改）
     *
     * @param id  配額政策 ID
     * @param req 僅使用 limitValue 欄位
     */
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<QuotaPolicyDTO> update(@PathVariable Long id, @RequestBody QuotaPolicyDTO req) {
        QuotaPolicy policy = policyRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Policy not found: " + id));
        // limitValue 必須為非負整數，否則回傳 400
        if (req.getLimitValue() == null || req.getLimitValue() < 0) {
            return ResponseEntity.badRequest().build();
        }
        policy.setLimitValue(req.getLimitValue());
        return ResponseEntity.ok(toDto(policyRepository.save(policy)));
    }

    /**
     * 將 QuotaPolicy 實體轉換為 DTO
     */
    private QuotaPolicyDTO toDto(QuotaPolicy p) {
        return QuotaPolicyDTO.builder()
                .id(p.getId()).tier(p.getTier()).dimension(p.getDimension())
                .limitValue(p.getLimitValue()).resetPeriod(p.getResetPeriod()).build();
    }
}
