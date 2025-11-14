package com.exam.system.controller;

import com.exam.system.dto.ExamDTO;
import com.exam.system.dto.ExamExportDTO;
import com.exam.system.dto.MarkdownExportRequestDTO;
import com.exam.system.dto.QuestionDTO;
import com.exam.system.dto.ReorderRequestDTO;
import com.exam.system.dto.ReorderResponseDTO;
import com.exam.system.dto.StudentDTO;
import com.exam.system.service.ExamService;
import com.exam.system.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
     * 透過 accessCode 取得測驗預覽資訊（學員加入時使用）
     * GET /api/exams/preview?accessCode={accessCode}
     */
    @GetMapping("/preview")
    public ResponseEntity<ExamDTO> getExamPreview(@RequestParam String accessCode) {
        log.info("Getting exam preview with accessCode: {}", accessCode);
        ExamDTO exam = examService.getExamByAccessCode(accessCode);
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

    /**
     * 調整題目順序
     * PUT /api/exams/{examId}/questions/reorder
     */
    @PutMapping("/{examId}/questions/reorder")
    public ResponseEntity<ReorderResponseDTO> reorderQuestions(
            @PathVariable Long examId,
            @Valid @RequestBody ReorderRequestDTO request) {
        log.info("Reordering questions for exam: {}", examId);
        examService.reorderQuestions(examId, request.getIds());

        ReorderResponseDTO response = ReorderResponseDTO.builder()
                .message("題目順序更新成功")
                .referenceId(examId)
                .newOrder(request.getIds())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 調整選項順序
     * PUT /api/exams/{examId}/questions/{questionId}/options/reorder
     */
    @PutMapping("/{examId}/questions/{questionId}/options/reorder")
    public ResponseEntity<ReorderResponseDTO> reorderOptions(
            @PathVariable Long examId,
            @PathVariable Long questionId,
            @Valid @RequestBody ReorderRequestDTO request) {
        log.info("Reordering options for question: {} in exam: {}", questionId, examId);
        examService.reorderOptions(questionId, request.getIds());

        ReorderResponseDTO response = ReorderResponseDTO.builder()
                .message("選項順序更新成功")
                .referenceId(questionId)
                .newOrder(request.getIds())
                .build();

        return ResponseEntity.ok(response);
    }

    /**
     * 匯出測驗為 Markdown 檔案
     * POST /api/exams/{examId}/export/markdown
     */
    @PostMapping("/{examId}/export/markdown")
    public ResponseEntity<String> exportToMarkdown(
            @PathVariable Long examId,
            @RequestBody(required = false) MarkdownExportRequestDTO request) {
        log.info("Exporting exam {} to Markdown", examId);

        // 處理請求參數（提供預設值）
        if (request == null) {
            request = MarkdownExportRequestDTO.builder().build();
        }

        Boolean includeAnswers = request.getIncludeAnswers() != null ? request.getIncludeAnswers() : true;
        Boolean showQuestionNumbers = request.getShowQuestionNumbers() != null ? request.getShowQuestionNumbers() : true;
        Boolean showOptionLabels = request.getShowOptionLabels() != null ? request.getShowOptionLabels() : true;
        Boolean showExamInfo = request.getShowExamInfo() != null ? request.getShowExamInfo() : true;

        // 調用服務層生成 Markdown
        String markdown = examService.exportToMarkdown(
                examId,
                includeAnswers,
                showQuestionNumbers,
                showOptionLabels,
                showExamInfo
        );

        // 取得測驗資訊以生成檔名
        ExamDTO exam = examService.getExam(examId);
        String filename = sanitizeFilename(exam.getTitle()) +
                          (includeAnswers ? "_講師版" : "_學員版") + ".md";

        // 設定 HTTP 標頭，觸發瀏覽器下載
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"));
        headers.setContentDispositionFormData("attachment", filename);
        headers.add("Content-Description", "Markdown File Transfer");

        return ResponseEntity.ok()
                .headers(headers)
                .body(markdown);
    }

    /**
     * 匯出測驗為 JSON 檔案
     * GET /api/exams/{examId}/export/json
     */
    @GetMapping("/{examId}/export/json")
    public ResponseEntity<ExamExportDTO> exportToJson(@PathVariable Long examId) {
        log.info("Exporting exam {} to JSON", examId);

        // 調用服務層匯出 JSON
        ExamExportDTO exportDTO = examService.exportToJson(examId);

        // 取得測驗資訊以生成檔名
        String filename = sanitizeFilename(exportDTO.getTitle()) + ".json";

        // 設定 HTTP 標頭，觸發瀏覽器下載
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setContentDispositionFormData("attachment", filename);
        headers.add("Content-Description", "JSON File Transfer");

        return ResponseEntity.ok()
                .headers(headers)
                .body(exportDTO);
    }

    /**
     * 從 JSON 匯入測驗
     * POST /api/exams/import
     */
    @PostMapping("/import")
    public ResponseEntity<ExamDTO> importFromJson(@Valid @RequestBody ExamExportDTO exportDTO) {
        log.info("Importing exam from JSON: {}", exportDTO.getTitle());
        ExamDTO createdExam = examService.importFromJson(exportDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdExam);
    }

    /**
     * 清理檔名，移除不合法字元
     */
    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "exam";
        }
        // 移除 Windows 不允許的檔名字元: \ / : * ? " < > |
        return filename.replaceAll("[\\\\/:*?\"<>|]", "_")
                      .trim();
    }

}