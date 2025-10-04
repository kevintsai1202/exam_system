package com.exam.system.repository;

import com.exam.system.TestDataBuilder;
import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import com.exam.system.entity.Question;
import com.exam.system.entity.Student;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ExamRepository 測試類別
 * 測試測驗資料訪問層的功能
 */
@DataJpaTest
@ActiveProfiles("test")
@DisplayName("ExamRepository 測試")
class ExamRepositoryTest {

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private StudentRepository studentRepository;

    private Exam testExam;

    @BeforeEach
    void setUp() {
        // 清空資料庫
        examRepository.deleteAll();

        // 建立測試資料
        testExam = TestDataBuilder.createExam();
        testExam = examRepository.save(testExam);
    }

    @Test
    @DisplayName("測試儲存測驗")
    void testSaveExam() {
        // Given
        Exam exam = TestDataBuilder.createExam();
        exam.setAccessCode("NEW001");
        exam.setTitle("新測驗");

        // When
        Exam saved = examRepository.save(exam);

        // Then
        assertThat(saved.getId()).isNotNull();
        assertThat(saved.getTitle()).isEqualTo("新測驗");
        assertThat(saved.getAccessCode()).isEqualTo("NEW001");
    }

    @Test
    @DisplayName("測試根據 ID 查詢測驗")
    void testFindById() {
        // When
        Optional<Exam> found = examRepository.findById(testExam.getId());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo(testExam.getTitle());
    }

    @Test
    @DisplayName("測試根據 accessCode 查詢測驗")
    void testFindByAccessCode() {
        // When
        Optional<Exam> found = examRepository.findByAccessCode("TEST01");

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getId()).isEqualTo(testExam.getId());
        assertThat(found.get().getAccessCode()).isEqualTo("TEST01");
    }

    @Test
    @DisplayName("測試查詢不存在的 accessCode")
    void testFindByAccessCode_NotFound() {
        // When
        Optional<Exam> found = examRepository.findByAccessCode("NOTEXIST");

        // Then
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("測試檢查 accessCode 是否存在")
    void testExistsByAccessCode() {
        // When & Then
        assertThat(examRepository.existsByAccessCode("TEST01")).isTrue();
        assertThat(examRepository.existsByAccessCode("NOTEXIST")).isFalse();
    }

    @Test
    @DisplayName("測試根據狀態查詢測驗")
    void testFindByStatus() {
        // Given
        Exam exam1 = TestDataBuilder.createExam();
        exam1.setAccessCode("CODE1");
        exam1.setStatus(ExamStatus.STARTED);
        examRepository.save(exam1);

        Exam exam2 = TestDataBuilder.createExam();
        exam2.setAccessCode("CODE2");
        exam2.setStatus(ExamStatus.STARTED);
        examRepository.save(exam2);

        Exam exam3 = TestDataBuilder.createExam();
        exam3.setAccessCode("CODE3");
        exam3.setStatus(ExamStatus.ENDED);
        examRepository.save(exam3);

        // When
        List<Exam> startedExams = examRepository.findByStatus(ExamStatus.STARTED);
        List<Exam> endedExams = examRepository.findByStatus(ExamStatus.ENDED);
        List<Exam> createdExams = examRepository.findByStatus(ExamStatus.CREATED);

        // Then
        assertThat(startedExams).hasSize(2);
        assertThat(endedExams).hasSize(1);
        assertThat(createdExams).hasSize(1); // testExam
    }

    @Test
    @DisplayName("測試查詢測驗並預先載入題目")
    void testFindByIdWithQuestions() {
        // Given - 為測驗新增題目（使用 Exam 的 addQuestion 方法確保雙向關聯）
        Question q1 = TestDataBuilder.createQuestion(testExam, 1);
        Question q2 = TestDataBuilder.createQuestion(testExam, 2);
        testExam.addQuestion(q1);
        testExam.addQuestion(q2);
        examRepository.save(testExam); // 因為有 CascadeType.ALL，題目會一起儲存

        // When
        Optional<Exam> found = examRepository.findByIdWithQuestions(testExam.getId());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getQuestions()).hasSize(2);
        assertThat(found.get().getQuestions()).extracting("questionOrder")
                .containsExactlyInAnyOrder(1, 2);
    }

    @Test
    @DisplayName("測試查詢測驗並預先載入學員")
    void testFindByIdWithStudents() {
        // Given - 為測驗新增學員（使用 Exam 的 addStudent 方法確保雙向關聯）
        Student s1 = TestDataBuilder.createStudent(testExam);
        s1.setName("學員1");
        s1.setSessionId("session-1");

        Student s2 = TestDataBuilder.createStudent(testExam);
        s2.setName("學員2");
        s2.setSessionId("session-2");

        testExam.addStudent(s1);
        testExam.addStudent(s2);
        examRepository.save(testExam); // 因為有 CascadeType.ALL，學員會一起儲存

        // When
        Optional<Exam> found = examRepository.findByIdWithStudents(testExam.getId());

        // Then
        assertThat(found).isPresent();
        assertThat(found.get().getStudents()).hasSize(2);
        assertThat(found.get().getStudents()).extracting("name")
                .containsExactlyInAnyOrder("學員1", "學員2");
    }

    @Test
    @DisplayName("測試更新測驗")
    void testUpdateExam() {
        // Given
        testExam.setStatus(ExamStatus.STARTED);
        testExam.setCurrentQuestionIndex(1);

        // When
        Exam updated = examRepository.save(testExam);

        // Then
        assertThat(updated.getStatus()).isEqualTo(ExamStatus.STARTED);
        assertThat(updated.getCurrentQuestionIndex()).isEqualTo(1);
    }

    @Test
    @DisplayName("測試刪除測驗")
    void testDeleteExam() {
        // Given
        Long examId = testExam.getId();

        // When
        examRepository.delete(testExam);

        // Then
        Optional<Exam> found = examRepository.findById(examId);
        assertThat(found).isEmpty();
    }

    @Test
    @DisplayName("測試查詢所有測驗")
    void testFindAll() {
        // Given
        Exam exam1 = TestDataBuilder.createExam();
        exam1.setAccessCode("CODE1");
        examRepository.save(exam1);

        Exam exam2 = TestDataBuilder.createExam();
        exam2.setAccessCode("CODE2");
        examRepository.save(exam2);

        // When
        List<Exam> allExams = examRepository.findAll();

        // Then
        assertThat(allExams).hasSize(3); // testExam + exam1 + exam2
    }

    @Test
    @DisplayName("測試統計測驗數量")
    void testCount() {
        // Given
        Exam exam1 = TestDataBuilder.createExam();
        exam1.setAccessCode("CODE1");
        examRepository.save(exam1);

        Exam exam2 = TestDataBuilder.createExam();
        exam2.setAccessCode("CODE2");
        examRepository.save(exam2);

        // When
        long count = examRepository.count();

        // Then
        assertThat(count).isEqualTo(3); // testExam + 2 new exams
    }
}
