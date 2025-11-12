package com.exam.system.controller;

import com.exam.system.dto.ExamDTO;
import com.exam.system.dto.QuestionDTO;
import com.exam.system.dto.StudentDTO;
import com.exam.system.service.ExamService;
import com.exam.system.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 測驗控制器
 * 處理測驗相關的 REST API 請求
 */
@Slf4j
@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;
    private final StudentService studentService;

    /**
     * 建立測驗
     * POST /api/exams
     */
    @PostMapping
    public ResponseEntity<ExamDTO> createExam(@Valid @RequestBody ExamDTO examDTO) {
        log.info("Creating exam: {}", examDTO.getTitle());
        ExamDTO createdExam = examService.createExam(examDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdExam);
    }

    /**
     * 取得所有測驗
     * GET /api/exams
     */
    @GetMapping
    public ResponseEntity<List<ExamDTO>> getAllExams() {
        log.info("Getting all exams");
        List<ExamDTO> exams = examService.getAllExams();
        return ResponseEntity.ok(exams);
    }

    /**
     * 取得測驗資訊
     * GET /api/exams/{examId}
     */
    @GetMapping("/{examId}")
    public ResponseEntity<ExamDTO> getExam(@PathVariable Long examId) {
        log.info("Getting exam: {}", examId);
        ExamDTO exam = examService.getExam(examId);
        return ResponseEntity.ok(exam);
    }

    /**
     * 啟動測驗
     * PUT /api/exams/{examId}/start
     */
    @PutMapping("/{examId}/start")
    public ResponseEntity<ExamDTO> startExam(
            @PathVariable Long examId,
            @RequestParam(required = false, defaultValue = "http://localhost:5173") String baseUrl) {
        log.info("Starting exam: {}", examId);
        ExamDTO exam = examService.startExam(examId, baseUrl);
        return ResponseEntity.ok(exam);
    }

    /**
     * 開始題目
     * PUT /api/exams/{examId}/questions/{questionIndex}/start
     */
    @PutMapping("/{examId}/questions/{questionIndex}/start")
    public ResponseEntity<Map<String, Object>> startQuestion(
            @PathVariable Long examId,
            @PathVariable Integer questionIndex,
            @RequestHeader("Instructor-Session-Id") String instructorSessionId) {
        log.info("Starting question {} for exam: {} by instructor session: {}", questionIndex, examId, instructorSessionId);
        examService.startQuestion(examId, questionIndex, instructorSessionId);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "題目已開始");
        response.put("questionIndex", questionIndex);

        return ResponseEntity.ok(response);
    }

    /**
     * 結束測驗
     * PUT /api/exams/{examId}/end
     */
    @PutMapping("/{examId}/end")
    public ResponseEntity<Map<String, String>> endExam(
            @PathVariable Long examId,
            @RequestHeader("Instructor-Session-Id") String instructorSessionId) {
        log.info("Ending exam: {} by instructor session: {}", examId, instructorSessionId);
        examService.endExam(examId, instructorSessionId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "測驗已結束");

        return ResponseEntity.ok(response);
    }

    /**
     * 取得測驗題目列表
     * GET /api/exams/{examId}/questions
     */
    @GetMapping("/{examId}/questions")
    public ResponseEntity<Map<String, Object>> getExamQuestions(@PathVariable Long examId) {
        log.info("Getting questions for exam: {}", examId);
        List<QuestionDTO> questions = examService.getExamQuestions(examId);

        Map<String, Object> response = new HashMap<>();
        response.put("examId", examId);
        response.put("totalQuestions", questions.size());
        response.put("questions", questions);

        return ResponseEntity.ok(response);
    }

    /**
     * 複製測驗
     * POST /api/exams/{examId}/duplicate
     */
    @PostMapping("/{examId}/duplicate")
    public ResponseEntity<ExamDTO> duplicateExam(@PathVariable Long examId) {
        log.info("Duplicating exam: {}", examId);
        ExamDTO newExam = examService.duplicateExam(examId);
        return ResponseEntity.ok(newExam);
    }

    /**
     * 更新測驗
     * PUT /api/exams/{examId}
     */
    @PutMapping("/{examId}")
    public ResponseEntity<ExamDTO> updateExam(
            @PathVariable Long examId,
            @Valid @RequestBody ExamDTO examDTO) {
        log.info("Updating exam: {}", examId);
        ExamDTO updatedExam = examService.updateExam(examId, examDTO);
        return ResponseEntity.ok(updatedExam);
    }

    /**
     * 取得測驗的所有學員
     * GET /api/exams/{examId}/students
     */
    @GetMapping("/{examId}/students")
    public ResponseEntity<Map<String, Object>> getExamStudents(@PathVariable Long examId) {
        log.info("Getting students for exam: {}", examId);
        List<StudentDTO> students = studentService.getExamStudents(examId);

        Map<String, Object> response = new HashMap<>();
        response.put("examId", examId);
        response.put("totalStudents", students.size());
        response.put("students", students);

        return ResponseEntity.ok(response);
    }

    /**
     * 清除測驗的 Session
     * DELETE /api/exams/{examId}/session
     */
    @DeleteMapping("/{examId}/session")
    public ResponseEntity<Map<String, String>> clearExamSession(@PathVariable Long examId) {
        log.info("Clearing session for exam: {}", examId);
        examService.clearExamSession(examId);

        Map<String, String> response = new HashMap<>();
        response.put("message", "Session 已清除");

        return ResponseEntity.ok(response);
    }

}