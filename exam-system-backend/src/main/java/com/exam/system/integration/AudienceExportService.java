package com.exam.system.integration;

import com.exam.system.entity.Answer;
import com.exam.system.entity.Student;
import com.exam.system.entity.StudentProfile;
import com.exam.system.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** 將 Exam 人物、測驗摘要與逐題結果轉成名單中心的增量匯出契約。 */
@Service
@RequiredArgsConstructor
public class AudienceExportService {

    private final StudentRepository studentRepository;

    /** 解析 cursor 並匯出最多 limit 筆活動；結果依 joinedAt、id 穩定排序。 */
    @Transactional(readOnly = true)
    public AudienceExportResponse export(String cursor, int limit) {
        Cursor parsed = Cursor.parse(cursor);
        List<Long> ids = studentRepository.findAudienceExportIds(
            parsed.joinedAt(), parsed.studentId(), PageRequest.of(0, limit));
        if (ids.isEmpty()) {
            return new AudienceExportResponse(cursor, List.of(), List.of());
        }
        Map<Long, Student> loaded = new LinkedHashMap<>();
        studentRepository.findAudienceExportDetails(ids)
            .forEach(student -> loaded.put(student.getId(), student));
        List<Student> students = ids.stream()
            .map(loaded::get)
            .filter(java.util.Objects::nonNull)
            .toList();

        Map<Long, AudienceExportResponse.Profile> profiles = new LinkedHashMap<>();
        List<AudienceExportResponse.Attempt> attempts = students.stream()
            .map(student -> {
                StudentProfile profile = student.getProfile();
                profiles.putIfAbsent(profile.getId(), toProfile(profile));
                return toAttempt(student);
            })
            .toList();
        Student last = students.getLast();
        String nextCursor = new Cursor(last.getJoinedAt(), last.getId()).encode();
        return new AudienceExportResponse(nextCursor, List.copyOf(profiles.values()), attempts);
    }

    /** 人物主檔轉換；沒有明確同意時間與版本時仍原樣回 null。 */
    private AudienceExportResponse.Profile toProfile(StudentProfile profile) {
        return new AudienceExportResponse.Profile(
            String.valueOf(profile.getId()),
            profile.getEmail(),
            profile.getName(),
            utc(profile.getCreatedAt()),
            profile.getAcquisitionSource() == null
                ? "exam"
                : profile.getAcquisitionSource().name().toLowerCase(Locale.ROOT),
            utc(profile.getFirstConsentAt()),
            profile.getConsentVersion());
    }

    /** 測驗活動轉換，answers 依時間與 ID 排序，確保 payload hash 重跑穩定。 */
    private AudienceExportResponse.Attempt toAttempt(Student student) {
        List<AudienceExportResponse.AttemptAnswer> answers = student.getAnswers().stream()
            .sorted(Comparator.comparing(Answer::getAnsweredAt).thenComparing(Answer::getId))
            .map(answer -> new AudienceExportResponse.AttemptAnswer(
                String.valueOf(answer.getQuestion().getId()),
                String.valueOf(answer.getSelectedOptionId()),
                Boolean.TRUE.equals(answer.getIsCorrect()),
                utc(answer.getAnsweredAt())))
            .toList();
        int correctCount = (int) answers.stream().filter(AudienceExportResponse.AttemptAnswer::correct).count();
        int questionCount = student.getExam().getQuestions().size();
        double scoreRate = questionCount == 0 ? 0d : (double) correctCount / questionCount;
        return new AudienceExportResponse.Attempt(
            String.valueOf(student.getId()),
            String.valueOf(student.getProfile().getId()),
            String.valueOf(student.getExam().getId()),
            student.getExam().getTitle(),
            utc(student.getJoinedAt()),
            student.getTotalScore() == null ? 0 : student.getTotalScore(),
            questionCount,
            answers.size(),
            correctCount,
            scoreRate,
            student.getSurveyData() == null ? Map.of() : student.getSurveyData(),
            answers);
    }

    /** Exam 的 LocalDateTime 以現行伺服器 UTC 慣例轉成有 offset 的 API 時間。 */
    private java.time.OffsetDateTime utc(LocalDateTime value) {
        return value == null ? null : value.atOffset(ZoneOffset.UTC);
    }

    /** joinedAt + studentId cursor，解決同一毫秒多筆活動的遺漏問題。 */
    private record Cursor(LocalDateTime joinedAt, long studentId) {

        /** 空 cursor 從最早資料開始；格式錯誤交由 Controller 回 400。 */
        static Cursor parse(String raw) {
            if (raw == null || raw.isBlank()) {
                return new Cursor(LocalDateTime.of(1970, 1, 1, 0, 0), 0L);
            }
            int separator = raw.lastIndexOf('|');
            if (separator <= 0 || separator == raw.length() - 1) {
                throw new IllegalArgumentException("cursor 格式錯誤");
            }
            return new Cursor(
                LocalDateTime.parse(raw.substring(0, separator)),
                Long.parseLong(raw.substring(separator + 1)));
        }

        /** 產生可直接回傳給下一次 since 的 cursor。 */
        String encode() {
            return joinedAt + "|" + studentId;
        }
    }
}
