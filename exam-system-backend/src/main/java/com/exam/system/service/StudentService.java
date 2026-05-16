package com.exam.system.service;

import com.exam.system.dto.StudentDTO;
import com.exam.system.dto.WebSocketMessage;
import com.exam.system.entity.*;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.*;
import com.exam.system.websocket.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 學員服務
 * 處理學員相關的業務邏輯
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

        private final StudentRepository studentRepository;
        private final ExamRepository examRepository;
        private final WebSocketService webSocketService;
        private final ExamSurveyFieldConfigRepository examSurveyFieldConfigRepository;
        private final LocationService locationService;
        private final StudentProfileRepository studentProfileRepository;
        private final InstructorStudentRelationRepository instructorStudentRelationRepository;
        private final CurrentUserProvider currentUserProvider;

        /**
         * 學員加入測驗
         *
         * @param studentDTO 學員 DTO（包含 accessCode）
         * @return 包含 sessionId 的學員 DTO
         */
        @Transactional
        public StudentDTO joinExam(StudentDTO studentDTO) {
                log.info("Student {} joining exam with accessCode: {}", studentDTO.getName(),
                                studentDTO.getAccessCode());

                // 根據 accessCode 查找測驗
                Exam exam = examRepository.findByAccessCode(studentDTO.getAccessCode())
                                .orElseThrow(() -> new BusinessException("INVALID_ACCESS_CODE", "無效的測驗代碼"));

                // 驗證測驗狀態（只能在 STARTED 狀態加入）
                if (exam.getStatus() == ExamStatus.ENDED) {
                        throw new BusinessException("EXAM_ENDED", "測驗已結束");
                }
                if (exam.getStatus() != ExamStatus.STARTED) {
                        throw new BusinessException("EXAM_NOT_STARTED", "測驗尚未開始");
                }

                // 驗證必填調查欄位
                List<ExamSurveyFieldConfig> requiredConfigs = examSurveyFieldConfigRepository
                                .findByExamIdOrderByDisplayOrderAsc(exam.getId())
                                .stream()
                                .filter(ExamSurveyFieldConfig::getIsRequired)
                                .collect(Collectors.toList());

                for (ExamSurveyFieldConfig config : requiredConfigs) {
                        String fieldKey = config.getSurveyField().getFieldKey();
                        String fieldName = config.getSurveyField().getFieldName();

                        // 檢查 occupation 欄位（向下兼容）
                        if ("occupation".equals(fieldKey)) {
                                if (studentDTO.getOccupation() == null || studentDTO.getOccupation().trim().isEmpty()) {
                                        throw new BusinessException("REQUIRED_FIELD_MISSING",
                                                        String.format("必填欄位「%s」不能為空", fieldName));
                                }
                        } else {
                                // 檢查 surveyData 中的其他欄位
                                if (studentDTO.getSurveyData() == null ||
                                                studentDTO.getSurveyData().get(fieldKey) == null ||
                                                studentDTO.getSurveyData().get(fieldKey).trim().isEmpty()) {
                                        throw new BusinessException("REQUIRED_FIELD_MISSING",
                                                        String.format("必填欄位「%s」不能為空", fieldName));
                                }
                        }
                }

                // 驗證並標準化地點代碼（地點必填）
                if (studentDTO.getLocation() == null || studentDTO.getLocation().trim().isEmpty()) {
                        throw new BusinessException("REQUIRED_FIELD_MISSING", "必填欄位「地區」不能為空");
                }
                String normalizedLocation = studentDTO.getLocation().trim().toUpperCase();
                if (!locationService.isValidLocation(normalizedLocation)) {
                        throw new BusinessException("INVALID_LOCATION", "地區代碼無效");
                }
                studentDTO.setLocation(normalizedLocation);

                // 檢查學員是否已存在（重新連線處理）
                Optional<Student> existingStudentOpt;
                if (studentDTO.getEmail() != null && !studentDTO.getEmail().trim().isEmpty()) {
                        existingStudentOpt = studentRepository.findByExamIdAndEmail(exam.getId(),
                                        studentDTO.getEmail());
                } else {
                        existingStudentOpt = studentRepository.findByExamIdAndName(exam.getId(), studentDTO.getName());
                }

                if (existingStudentOpt.isPresent()) {
                        Student existingStudent = existingStudentOpt.get();
                        if (!normalizedLocation.equals(existingStudent.getLocation())) {
                                existingStudent.setLocation(normalizedLocation);
                                existingStudent = studentRepository.save(existingStudent);
                                log.info("Updated student location: {} -> {}",
                                                existingStudent.getName(), normalizedLocation);
                        }
                        log.info("Student already exists, resuming session: {} (sessionId: {})",
                                        existingStudent.getName(), existingStudent.getSessionId());

                        // 如果當前有正在進行的題目，推送給重新連線的學員
                        if (exam.getCurrentQuestionStartedAt() != null && exam.getLastPushedQuestionIndex() != null
                                        && exam.getLastPushedQuestionIndex() >= 0) {
                                sendCurrentQuestionToStudent(existingStudent.getSessionId(), exam);
                        }

                        return convertToDTO(existingStudent, exam);
                }

                // 生成唯一的 sessionId
                String sessionId = UUID.randomUUID().toString();

                // UPSERT StudentProfile（先於 Student 建立，以符合 profile_id NOT NULL 約束）
                // 有 email → 以 normalized email 為 key；否則產生唯一佔位符
                String profileEmail = (studentDTO.getEmail() != null && !studentDTO.getEmail().trim().isEmpty())
                                ? studentDTO.getEmail().trim().toLowerCase(Locale.ROOT)
                                : "noemail-" + UUID.randomUUID() + "@no-email.local";

                StudentProfile profile = studentProfileRepository.findByEmail(profileEmail)
                                .map(existing -> {
                                        existing.setName(studentDTO.getName());
                                        if (studentDTO.getAvatarIcon() != null) {
                                                existing.setAvatarIcon(studentDTO.getAvatarIcon());
                                        }
                                        return studentProfileRepository.save(existing);
                                })
                                .orElseGet(() -> studentProfileRepository.save(StudentProfile.builder()
                                                .email(profileEmail)
                                                .name(studentDTO.getName())
                                                .isGmailVerified(false)
                                                .avatarIcon(studentDTO.getAvatarIcon())
                                                .build()));

                // 建立學員實體（含 profile，以符合 NOT NULL 約束）
                Student student = Student.builder()
                                .exam(exam)
                                .sessionId(sessionId)
                                .name(studentDTO.getName())
                                .email(studentDTO.getEmail())
                                .occupation(studentDTO.getOccupation())
                                .surveyData(studentDTO.getSurveyData())
                                .location(normalizedLocation)
                                .avatarIcon(studentDTO.getAvatarIcon())
                                .totalScore(0)
                                .profile(profile)
                                .build();

                student = studentRepository.save(student);

                // UPSERT InstructorStudentRelation（僅在 exam 已指定 owner 時執行）
                if (exam.getOwner() != null) {
                        User instructor = exam.getOwner();
                        LocalDateTime now = LocalDateTime.now();
                        instructorStudentRelationRepository
                                        .findByInstructorIdAndProfileId(instructor.getId(), profile.getId())
                                        .ifPresentOrElse(
                                                        rel -> {
                                                                rel.setLastInteractionAt(now);
                                                                rel.setExamCount(rel.getExamCount() + 1);
                                                                instructorStudentRelationRepository.save(rel);
                                                        },
                                                        () -> instructorStudentRelationRepository
                                                                        .save(InstructorStudentRelation.builder()
                                                                                        .instructor(instructor)
                                                                                        .profile(profile)
                                                                                        .firstInteractionAt(now)
                                                                                        .lastInteractionAt(now)
                                                                                        .examCount(1)
                                                                                        .build()));
                }

                log.info("Student joined successfully: {} (sessionId: {})", student.getName(), sessionId);

                // 透過 WebSocket 通知講師有新學員加入
                Map<String, Object> studentData = new HashMap<>();
                studentData.put("id", student.getId());
                studentData.put("name", student.getName());
                studentData.put("avatarIcon", student.getAvatarIcon());
                studentData.put("totalScore", student.getTotalScore());
                studentData.put("correctAnswersCount", 0); // 新加入的學員答對題數為 0
                studentData.put("totalStudents", studentRepository.countByExamId(exam.getId()));

                webSocketService.broadcastStudentJoined(exam.getId(), WebSocketMessage.studentJoined(studentData));

                // 如果當前有正在進行的題目，推送給新加入的學員
                // 使用 lastPushedQuestionIndex 而不是 currentQuestionIndex，因為 currentQuestionIndex
                // 指向下一題
                if (exam.getCurrentQuestionStartedAt() != null && exam.getLastPushedQuestionIndex() != null
                                && exam.getLastPushedQuestionIndex() >= 0) {
                        sendCurrentQuestionToStudent(student.getSessionId(), exam);
                }

                return convertToDTO(student, exam);
        }

        /**
         * 推送當前題目給指定學員
         *
         * @param sessionId 學員 Session ID
         * @param exam      測驗實體
         */
        private void sendCurrentQuestionToStudent(String sessionId, Exam exam) {
                try {
                        // 使用 lastPushedQuestionIndex 獲取當前正在答題的題目
                        var question = exam.getQuestions().get(exam.getLastPushedQuestionIndex());

                        // 優先使用儲存的 UTC 到期時間，避免時區問題
                        Instant expiresAt = exam.getCurrentQuestionExpiresAt() != null
                                        ? exam.getCurrentQuestionExpiresAt()
                                        : exam.getCurrentQuestionStartedAt().atZone(java.time.ZoneOffset.UTC)
                                                        .toInstant().plusSeconds(exam.getQuestionTimeLimit());

                        Map<String, Object> questionData = new HashMap<>();
                        questionData.put("questionId", question.getId());
                        questionData.put("questionIndex", exam.getLastPushedQuestionIndex());
                        questionData.put("questionText", question.getQuestionText());
                        questionData.put("expiresAt", expiresAt.toString());

                        // 選項列表（不包含正確答案）
                        List<Map<String, Object>> optionsList = question.getOptions().stream()
                                        .map(opt -> {
                                                Map<String, Object> optMap = new HashMap<>();
                                                optMap.put("id", opt.getId());
                                                optMap.put("optionOrder", opt.getOptionOrder());
                                                optMap.put("optionText", opt.getOptionText());
                                                return optMap;
                                        })
                                        .collect(Collectors.toList());
                        questionData.put("options", optionsList);

                        // 發送給特定學員（使用個人訂閱主題）
                        String destination = String.format("/topic/exam/%d/question/%s",
                                        exam.getId(), sessionId);
                        webSocketService.broadcast(destination, WebSocketMessage.questionStarted(questionData));

                        log.info("Sent current question to newly joined student at {}", destination);
                } catch (Exception e) {
                        log.error("Failed to send current question to student: {}", sessionId, e);
                }
        }

        /**
         * 根據 sessionId 取得學員資訊
         *
         * @param sessionId Session ID
         * @return 學員 DTO
         */
        @Transactional(readOnly = true)
        public StudentDTO getStudentBySessionId(String sessionId) {
                Student student = findStudentBySessionId(sessionId);
                return convertToDTO(student, student.getExam());
        }

        /**
         * 取得測驗的所有學員
         *
         * @param examId 測驗 ID
         * @return 學員列表
         */
        @Transactional(readOnly = true)
        public List<StudentDTO> getExamStudents(Long examId) {
                List<Student> students = studentRepository.findByExamId(examId);
                return students.stream()
                                .map(student -> convertToDTO(student, student.getExam()))
                                .collect(Collectors.toList());
        }

        // ==================== 私有輔助方法 ====================

        /**
         * 根據 sessionId 查找學員，不存在則拋出異常
         */
        Student findStudentBySessionId(String sessionId) {
                return studentRepository.findBySessionId(sessionId)
                                .orElseThrow(() -> new ResourceNotFoundException("Student", "sessionId", sessionId));
        }

        /**
         * 將 Student 實體轉換為 DTO
         */
        private StudentDTO convertToDTO(Student student, Exam exam) {
                // 計算答對題數
                long correctAnswersCount = student.getAnswers().stream()
                                .filter(answer -> answer.getIsCorrect() != null && answer.getIsCorrect())
                                .count();

                StudentDTO.StudentDTOBuilder builder = StudentDTO.builder()
                                .id(student.getId())
                                .sessionId(student.getSessionId())
                                .examId(exam.getId())
                                .name(student.getName())
                                .email(student.getEmail())
                                .occupation(student.getOccupation())
                                .surveyData(student.getSurveyData())
                                .location(student.getLocation())
                                .avatarIcon(student.getAvatarIcon())
                                .totalScore(student.getTotalScore())
                                .correctAnswersCount((int) correctAnswersCount)
                                .joinedAt(student.getJoinedAt())
                                .examStatus(exam.getStatus().name());

                // 如果有正在進行的題目，包含當前題目資訊
                // 使用 lastPushedQuestionIndex 而不是 currentQuestionIndex，因為 currentQuestionIndex
                // 指向下一題
                if (exam.getCurrentQuestionStartedAt() != null && exam.getLastPushedQuestionIndex() != null
                                && exam.getLastPushedQuestionIndex() >= 0
                                && exam.getLastPushedQuestionIndex() < exam.getQuestions().size()) {
                        var question = exam.getQuestions().get(exam.getLastPushedQuestionIndex());
                        // 優先使用儲存的 UTC 到期時間，避免時區問題
                        Instant expiresAt = exam.getCurrentQuestionExpiresAt() != null
                                        ? exam.getCurrentQuestionExpiresAt()
                                        : exam.getCurrentQuestionStartedAt().atZone(java.time.ZoneOffset.UTC)
                                                        .toInstant().plusSeconds(exam.getQuestionTimeLimit());

                        // 建立選項列表（不包含正確答案）
                        List<StudentDTO.QuestionOptionInfo> optionsList = question.getOptions().stream()
                                        .map(opt -> StudentDTO.QuestionOptionInfo.builder()
                                                        .id(opt.getId())
                                                        .optionOrder(opt.getOptionOrder())
                                                        .optionText(opt.getOptionText())
                                                        .build())
                                        .collect(Collectors.toList());

                        // 建立當前題目資訊
                        StudentDTO.CurrentQuestionInfo currentQuestion = StudentDTO.CurrentQuestionInfo.builder()
                                        .questionId(question.getId())
                                        .questionIndex(exam.getLastPushedQuestionIndex())
                                        .questionText(question.getQuestionText())
                                        .options(optionsList)
                                        .expiresAt(expiresAt)
                                        .build();

                        builder.currentQuestion(currentQuestion);
                }

                return builder.build();
        }

        // ==================== Gmail 相關方法 ====================

        /**
         * 根據 Gmail 查詢學員（返回最近的一筆）
         *
         * @param googleEmail Gmail 信箱
         * @return 學員 DTO（Optional）
         */
        @Transactional(readOnly = true)
        public Optional<StudentDTO> getStudentByGmail(String googleEmail) {
                return studentRepository.findFirstByGoogleEmailOrderByJoinedAtDesc(googleEmail)
                                .map(student -> convertToDTO(student, student.getExam()));
        }

        /**
         * 根據 Gmail 和測驗 ID 查詢學員（用於斷線重連特定測驗）
         *
         * @param googleEmail Gmail 信箱
         * @param examId      測驗 ID
         * @return 學員 DTO（Optional）
         */
        @Transactional(readOnly = true)
        public Optional<StudentDTO> getStudentByGmailAndExam(String googleEmail, Long examId) {
                return studentRepository.findByGoogleEmailAndExamId(googleEmail, examId)
                                .map(student -> convertToDTO(student, student.getExam()));
        }

        /**
         * 根據 Email 和測驗 ID 查詢學員（用於已登入學員直接恢復既有 session）
         *
         * @param email  學員 Email
         * @param examId 測驗 ID
         * @return 學員 DTO（Optional）
         */
        @Transactional(readOnly = true)
        public Optional<StudentDTO> getStudentByEmailAndExam(String email, Long examId) {
                return studentRepository.findByExamIdAndEmailIgnoreCase(examId, email)
                                .map(student -> convertToDTO(student, student.getExam()));
        }

        /**
         * 綁定 Gmail 到現有學員
         *
         * @param sessionId   學員 Session ID
         * @param googleId    Google 帳號 ID
         * @param googleEmail Gmail 信箱
         * @return 更新後的學員 DTO
         */
        @Transactional
        public StudentDTO bindGmail(String sessionId, String googleId, String googleEmail) {
                Student student = findStudentBySessionId(sessionId);

                student.setGoogleId(googleId);
                student.setGoogleEmail(googleEmail);
                student.setIsGmailVerified(true);

                student = studentRepository.save(student);

                log.info("Gmail {} bound to student {} (sessionId: {})",
                                googleEmail, student.getName(), sessionId);

                return convertToDTO(student, student.getExam());
        }

        // ==================== 講師學員管理方法 ====================

        /**
         * 取得當前講師的所有學員列表（跨測驗）
         * ADMIN 取全部；INSTRUCTOR 只取與自己互動的學員
         *
         * @return 學員摘要列表（profileId、name、email、examCount、lastInteractionAt）
         */
        @Transactional(readOnly = true)
        public List<Map<String, Object>> getInstructorStudents() {
                User current = currentUserProvider.requireCurrentUser();

                List<InstructorStudentRelation> relations;
                if (current.getRole() == UserRole.ADMIN) {
                        // ADMIN 查所有講師的關聯，以方便全覽
                        relations = instructorStudentRelationRepository.findAll();
                } else {
                        relations = instructorStudentRelationRepository
                                        .findByInstructorIdOrderByLastInteractionDesc(current.getId());
                }

                return relations.stream()
                                .map(rel -> {
                                        StudentProfile profile = rel.getProfile();
                                        Map<String, Object> entry = new java.util.LinkedHashMap<>();
                                        entry.put("profileId", profile.getId());
                                        entry.put("name", profile.getName());
                                        // noemail placeholder 對前端無意義，回傳 null
                                        String email = profile.getEmail();
                                        entry.put("email", email != null && email.contains("@no-email.local") ? null : email);
                                        entry.put("avatarIcon", profile.getAvatarIcon());
                                        entry.put("isGmailVerified", profile.getIsGmailVerified());
                                        entry.put("examCount", rel.getExamCount());
                                        entry.put("firstInteractionAt", rel.getFirstInteractionAt());
                                        entry.put("lastInteractionAt", rel.getLastInteractionAt());
                                        if (current.getRole() == UserRole.ADMIN) {
                                                User instructor = rel.getInstructor();
                                                entry.put("instructorId", instructor.getId());
                                                entry.put("instructorName", instructor.getName());
                                        }
                                        return entry;
                                })
                                .collect(Collectors.toList());
        }

}
