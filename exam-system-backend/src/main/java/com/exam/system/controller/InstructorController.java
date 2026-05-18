package com.exam.system.controller;

import com.exam.system.service.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 講師管理控制器
 * 提供講師或 ADMIN 查詢跨測驗學員關係的端點
 */
@Slf4j
@RestController
@RequestMapping("/api/instructor")
@RequiredArgsConstructor
public class InstructorController {

    private final StudentService studentService;

    /**
     * 取得當前講師的所有學員列表（跨測驗）
     * ADMIN 可取得所有講師的學員關係清單
     * GET /api/instructor/students
     */
    @GetMapping("/students")
    public ResponseEntity<List<Map<String, Object>>> getMyStudents() {
        log.info("取得講師學員列表");
        List<Map<String, Object>> students = studentService.getInstructorStudents();
        return ResponseEntity.ok(students);
    }
}
