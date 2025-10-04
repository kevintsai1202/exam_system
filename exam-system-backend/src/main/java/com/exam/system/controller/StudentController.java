package com.exam.system.controller;

import com.exam.system.dto.StudentDTO;
import com.exam.system.service.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 學員控制器
 * 處理學員相關的 REST API 請求
 */
@Slf4j
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {

    private final StudentService studentService;

    /**
     * 學員加入測驗
     * POST /api/students/join
     */
    @PostMapping("/join")
    public ResponseEntity<StudentDTO> joinExam(@Valid @RequestBody StudentDTO studentDTO) {
        log.info("Student {} joining exam with accessCode: {}", studentDTO.getName(), studentDTO.getAccessCode());
        StudentDTO joinedStudent = studentService.joinExam(studentDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(joinedStudent);
    }

    /**
     * 取得學員資訊（透過 sessionId）
     * GET /api/students/{sessionId}
     */
    @GetMapping("/{sessionId}")
    public ResponseEntity<StudentDTO> getStudent(@PathVariable String sessionId) {
        log.info("Getting student by sessionId: {}", sessionId);
        StudentDTO student = studentService.getStudentBySessionId(sessionId);
        return ResponseEntity.ok(student);
    }

    /**
     * 取得測驗的所有學員
     * GET /api/exams/{examId}/students
     */
    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<StudentDTO>> getExamStudents(@PathVariable Long examId) {
        log.info("Getting students for exam: {}", examId);
        List<StudentDTO> students = studentService.getExamStudents(examId);
        return ResponseEntity.ok(students);
    }

}