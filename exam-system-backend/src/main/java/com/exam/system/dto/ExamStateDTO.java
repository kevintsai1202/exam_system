package com.exam.system.dto;

import java.time.LocalDateTime;

/**
 * 測驗即時狀態 DTO
 * 用於學員斷線重連時取得當前測驗狀態
 */
public class ExamStateDTO {

    private Long examId;
    private String examTitle;
    private String examStatus; // CREATED, STARTED, PAUSED, ENDED

    // 當前題目資訊
    private Long currentQuestionId;
    private Integer currentQuestionIndex;
    private Integer totalQuestions;

    // 計時資訊
    private Integer remainingSeconds; // 當前題目剩餘秒數
    private Integer questionTimeLimit; // 題目時間限制

    // 伺服器時間（用於校時）
    private LocalDateTime serverTime;

    // 學員作答狀態
    private Boolean hasAnswered; // 是否已作答當前題目
    private String selectedOptionId; // 已選選項 ID

    public ExamStateDTO() {
    }

    // Getters and Setters
    public Long getExamId() {
        return examId;
    }

    public void setExamId(Long examId) {
        this.examId = examId;
    }

    public String getExamTitle() {
        return examTitle;
    }

    public void setExamTitle(String examTitle) {
        this.examTitle = examTitle;
    }

    public String getExamStatus() {
        return examStatus;
    }

    public void setExamStatus(String examStatus) {
        this.examStatus = examStatus;
    }

    public Long getCurrentQuestionId() {
        return currentQuestionId;
    }

    public void setCurrentQuestionId(Long currentQuestionId) {
        this.currentQuestionId = currentQuestionId;
    }

    public Integer getCurrentQuestionIndex() {
        return currentQuestionIndex;
    }

    public void setCurrentQuestionIndex(Integer currentQuestionIndex) {
        this.currentQuestionIndex = currentQuestionIndex;
    }

    public Integer getTotalQuestions() {
        return totalQuestions;
    }

    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }

    public Integer getRemainingSeconds() {
        return remainingSeconds;
    }

    public void setRemainingSeconds(Integer remainingSeconds) {
        this.remainingSeconds = remainingSeconds;
    }

    public Integer getQuestionTimeLimit() {
        return questionTimeLimit;
    }

    public void setQuestionTimeLimit(Integer questionTimeLimit) {
        this.questionTimeLimit = questionTimeLimit;
    }

    public LocalDateTime getServerTime() {
        return serverTime;
    }

    public void setServerTime(LocalDateTime serverTime) {
        this.serverTime = serverTime;
    }

    public Boolean getHasAnswered() {
        return hasAnswered;
    }

    public void setHasAnswered(Boolean hasAnswered) {
        this.hasAnswered = hasAnswered;
    }

    public String getSelectedOptionId() {
        return selectedOptionId;
    }

    public void setSelectedOptionId(String selectedOptionId) {
        this.selectedOptionId = selectedOptionId;
    }
}
