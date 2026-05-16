package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 講師 ↔ 學員 關係表
 * 學員每次參加某講師的測驗時 UPSERT：新關係建立或既有關係 examCount++
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "instructor_student_relation",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_instructor_profile",
                columnNames = {"instructor_id", "profile_id"}),
        indexes = {
                @Index(name = "idx_isr_profile", columnList = "profile_id")
        })
public class InstructorStudentRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 講師（User.role = INSTRUCTOR 或 ADMIN） */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", nullable = false)
    private User instructor;

    /** 學員主檔 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private StudentProfile profile;

    /** 首次參賽此講師測驗的時間 */
    @Column(nullable = false, updatable = false)
    private LocalDateTime firstInteractionAt;

    /** 最近一次參賽 */
    @Column(nullable = false)
    private LocalDateTime lastInteractionAt;

    /** 累積參賽該講師測驗的場次 */
    @Builder.Default
    @Column(nullable = false)
    private Integer examCount = 0;
}
