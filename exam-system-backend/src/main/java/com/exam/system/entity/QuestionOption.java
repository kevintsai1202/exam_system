package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * 題目選項實體
 * 代表單選題的一個選項
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "question_option")
public class QuestionOption {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 所屬題目
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /**
     * 選項順序（從 1 開始）
     */
    @Column(nullable = false)
    private Integer optionOrder;

    /**
     * 選項內容
     */
    @Column(nullable = false, length = 200)
    private String optionText;

}