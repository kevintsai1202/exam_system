package com.exam.system.controller;

import com.exam.system.dto.AnswerDTO;
import com.exam.system.service.AnswerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 答案控制器
 * 處理答案相關的 REST API 請求
 */
@Slf4j
@RestController
@RequestMapping("/api/answers")
@RequiredArgsConstructor
public class AnswerController {

    private final AnswerService answerService;

    /**
     * 提交答案
     * POST /api/answers
     */
    @PostMapping
    public ResponseEntity<AnswerDTO> submitAnswer(@Valid @RequestBody AnswerDTO answerDTO) {
        log.info("Submitting answer: sessionId={}, questionId={}", answerDTO.getSessionId(), answerDTO.getQuestionId());
        AnswerDTO submittedAnswer = answerService.submitAnswer(answerDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(submittedAnswer);
    }

    /**
     * 取得學員的所有答案記錄
     * GET /api/students/{sessionId}/answers
     */
    @GetMapping("/student/{sessionId}")
    public ResponseEntity<List<AnswerDTO>> getStudentAnswers(@PathVariable String sessionId) {
        log.info("Getting answers for student: {}", sessionId);
        List<AnswerDTO> answers = answerService.getStudentAnswers(sessionId);
        return ResponseEntity.ok(answers);
    }

}