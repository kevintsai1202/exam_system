package com.exam.system.service;

import com.exam.system.dto.StudentDTO;
import com.exam.system.dto.WebSocketMessage;
import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import com.exam.system.entity.Student;
import com.exam.system.exception.BusinessException;
import com.exam.system.exception.ResourceNotFoundException;
import com.exam.system.repository.ExamRepository;
import com.exam.system.repository.StudentRepository;
import com.exam.system.websocket.WebSocketService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
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

    /**
     * 學員加入測驗
     *
     * @param studentDTO 學員 DTO（包含 accessCode）
     * @return 包含 sessionId 的學員 DTO
     */
    @Transactional
    public StudentDTO joinExam(StudentDTO studentDTO) {
        log.info("Student {} joining exam with accessCode: {}", studentDTO.getName(), studentDTO.getAccessCode());

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

        // 生成唯一的 sessionId
        String sessionId = UUID.randomUUID().toString();

        // 建立學員實體
        Student student = Student.builder()
                .exam(exam)
                .sessionId(sessionId)
                .name(studentDTO.getName())
                .email(studentDTO.getEmail())
                .occupation(studentDTO.getOccupation())
                .avatarIcon(studentDTO.getAvatarIcon())
                .totalScore(0)
                .build();

        student = studentRepository.save(student);

        log.info("Student joined successfully: {} (sessionId: {})", student.getName(), sessionId);

        // 透過 WebSocket 通知講師有新學員加入
        Map<String, Object> studentData = new HashMap<>();
        studentData.put("id", student.getId());
        studentData.put("name", student.getName());
        studentData.put("avatarIcon", student.getAvatarIcon());
        studentData.put("totalScore", student.getTotalScore());
        studentData.put("totalStudents", studentRepository.countByExamId(exam.getId()));

        webSocketService.broadcastStudentJoined(exam.getId(), WebSocketMessage.studentJoined(studentData));

        return convertToDTO(student, exam);
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
        return StudentDTO.builder()
                .id(student.getId())
                .sessionId(student.getSessionId())
                .examId(exam.getId())
                .name(student.getName())
                .email(student.getEmail())
                .occupation(student.getOccupation())
                .avatarIcon(student.getAvatarIcon())
                .totalScore(student.getTotalScore())
                .joinedAt(student.getJoinedAt())
                .examStatus(exam.getStatus().name())
                .build();
    }

}