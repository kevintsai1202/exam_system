package com.exam.system.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 測驗實體
 * 代表一個完整的測驗，包含多個題目
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "exam")
public class Exam {

    /**
     * 主鍵 ID
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 測驗標題
     */
    @Column(nullable = false, length = 100)
    private String title;

    /**
     * 測驗描述
     */
    @Column(length = 500)
    private String description;

    /**
     * 每題倒數時間（秒）
     */
    @Column(nullable = false)
    private Integer questionTimeLimit;

    /**
     * 測驗狀態
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExamStatus status;

    /**
     * 當前題目索引（從 0 開始）
     */
    @Column(nullable = false)
    private Integer currentQuestionIndex;

    /**
     * 加入碼（用於生成 QR Code）
     */
    @Column(nullable = false, unique = true, length = 6)
    private String accessCode;

    /**
     * 建立時間
     */
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 開始時間
     */
    private LocalDateTime startedAt;

    /**
     * 結束時間
     */
    private LocalDateTime endedAt;

    /**
     * 當前題目開始時間（用於答題時間驗證）
     */
    private LocalDateTime currentQuestionStartedAt;

    /**
     * 啟用的調查欄位鍵值清單（JSON 格式儲存）
     * 例如: ["occupation", "age_range", "gender"]
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    private List<String> surveyFieldKeys;

    /**
     * 測驗包含的題目列表
     */
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("questionOrder ASC")
    @Builder.Default
    private List<Question> questions = new ArrayList<>();

    /**
     * 參與測驗的學員列表
     */
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Student> students = new ArrayList<>();

    /**
     * 實體建立前的回調，設定建立時間和預設值
     */
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.status == null) {
            this.status = ExamStatus.CREATED;
        }
        if (this.currentQuestionIndex == null) {
            this.currentQuestionIndex = 0;
        }
    }

    /**
     * 啟動測驗
     */
    public void start() {
        this.status = ExamStatus.STARTED;
        this.startedAt = LocalDateTime.now();
    }

    /**
     * 結束測驗
     */
    public void end() {
        this.status = ExamStatus.ENDED;
        this.endedAt = LocalDateTime.now();
    }

    /**
     * 前往下一題
     */
    public void goToNextQuestion() {
        if (this.currentQuestionIndex < this.questions.size() - 1) {
            this.currentQuestionIndex++;
        }
    }

    /**
     * 新增題目
     */
    public void addQuestion(Question question) {
        questions.add(question);
        question.setExam(this);
    }

    /**
     * 移除題目
     */
    public void removeQuestion(Question question) {
        questions.remove(question);
        question.setExam(null);
    }

    /**
     * 新增學員
     */
    public void addStudent(Student student) {
        students.add(student);
        student.setExam(this);
    }

    /**
     * 移除學員
     */
    public void removeStudent(Student student) {
        students.remove(student);
        student.setExam(null);
    }

}