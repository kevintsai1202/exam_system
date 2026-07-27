package com.exam.system.integration;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/** 名單中心增量同步使用的唯讀匯出格式。 */
public record AudienceExportResponse(
        String nextCursor,
        List<Profile> profiles,
        List<Attempt> attempts) {

    /** Exam 穩定人物主檔。 */
    public record Profile(
            String externalProfileId,
            String email,
            String name,
            OffsetDateTime createdAt,
            String acquisitionSource,
            OffsetDateTime firstConsentAt,
            String consentVersion) {}

    /** 單次測驗活動；同一人物可擁有多筆。 */
    public record Attempt(
            String externalAttemptId,
            String externalProfileId,
            String externalExamId,
            String examTitle,
            OffsetDateTime joinedAt,
            int totalScore,
            int questionCount,
            int answeredCount,
            int correctCount,
            double scoreRate,
            Map<String, String> surveyData,
            List<AttemptAnswer> answers) {}

    /** 單題作答結果；題目內容不輸出，避免題庫文字被整批外洩。 */
    public record AttemptAnswer(
            String questionId,
            String selectedOptionId,
            boolean correct,
            OffsetDateTime answeredAt) {}
}
