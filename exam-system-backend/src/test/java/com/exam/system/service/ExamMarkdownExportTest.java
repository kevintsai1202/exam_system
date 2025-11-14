package com.exam.system.service;

import com.exam.system.entity.*;
import com.exam.system.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 測驗 Markdown 匯出功能測試
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ExamMarkdownExportTest {

    @Autowired
    private ExamService examService;

    @Autowired
    private ExamRepository examRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Autowired
    private QuestionOptionRepository questionOptionRepository;

    private Long testExamId;

    /**
     * 建立測試資料
     */
    @BeforeEach
    void setUp() {
        // 建立測驗
        Exam exam = Exam.builder()
                .title("Java 基礎測驗")
                .description("測試 Java 基本知識")
                .questionTimeLimit(30)
                .status(ExamStatus.CREATED)
                .accessCode("TEST01")
                .currentQuestionIndex(0)
                .build();
        exam = examRepository.save(exam);
        testExamId = exam.getId();

        // 建立第一題
        Question question1 = Question.builder()
                .exam(exam)
                .questionOrder(1)
                .questionText("Java 是什麼類型的程式語言？")
                .singleStatChartType(ChartType.BAR)
                .cumulativeChartType(ChartType.PIE)
                .correctOptionId(0L)
                .build();
        question1 = questionRepository.save(question1);

        QuestionOption q1o1 = QuestionOption.builder()
                .question(question1)
                .optionOrder(1)
                .optionText("編譯型語言")
                .build();
        q1o1 = questionOptionRepository.save(q1o1);

        QuestionOption q1o2 = QuestionOption.builder()
                .question(question1)
                .optionOrder(2)
                .optionText("直譯型語言")
                .build();
        questionOptionRepository.save(q1o2);

        QuestionOption q1o3 = QuestionOption.builder()
                .question(question1)
                .optionOrder(3)
                .optionText("混合型語言")
                .build();
        questionOptionRepository.save(q1o3);

        QuestionOption q1o4 = QuestionOption.builder()
                .question(question1)
                .optionOrder(4)
                .optionText("腳本語言")
                .build();
        questionOptionRepository.save(q1o4);

        // 設定正確答案（混合型語言）
        question1.setCorrectOptionId(q1o1.getId());
        questionRepository.save(question1);

        // 建立第二題
        Question question2 = Question.builder()
                .exam(exam)
                .questionOrder(2)
                .questionText("JVM 的全名是什麼？")
                .singleStatChartType(ChartType.PIE)
                .cumulativeChartType(ChartType.BAR)
                .correctOptionId(0L)
                .build();
        question2 = questionRepository.save(question2);

        QuestionOption q2o1 = QuestionOption.builder()
                .question(question2)
                .optionOrder(1)
                .optionText("Java Virtual Machine")
                .build();
        q2o1 = questionOptionRepository.save(q2o1);

        QuestionOption q2o2 = QuestionOption.builder()
                .question(question2)
                .optionOrder(2)
                .optionText("Java Variable Manager")
                .build();
        questionOptionRepository.save(q2o2);

        QuestionOption q2o3 = QuestionOption.builder()
                .question(question2)
                .optionOrder(3)
                .optionText("Java Version Manager")
                .build();
        questionOptionRepository.save(q2o3);

        // 設定正確答案（Java Virtual Machine）
        question2.setCorrectOptionId(q2o1.getId());
        questionRepository.save(question2);
    }

    /**
     * 測試匯出講師版（含答案）
     */
    @Test
    void testExportWithAnswers() {
        // 執行匯出
        String markdown = examService.exportToMarkdown(testExamId, true, true, true, true);

        // 驗證內容
        assertThat(markdown).isNotNull();
        assertThat(markdown).contains("# Java 基礎測驗");
        assertThat(markdown).contains("**描述**: 測試 Java 基本知識");
        assertThat(markdown).contains("**題數**: 2 題");
        assertThat(markdown).contains("**每題時間**: 30 秒");
        assertThat(markdown).contains("**測驗代碼**: TEST01");
        assertThat(markdown).contains("**版本**: 講師版（含答案）");

        // 驗證第一題
        assertThat(markdown).contains("## 第 1 題");
        assertThat(markdown).contains("Java 是什麼類型的程式語言？");
        assertThat(markdown).contains("A. 編譯型語言");
        assertThat(markdown).contains("**正確答案**: A");

        // 驗證第二題
        assertThat(markdown).contains("## 第 2 題");
        assertThat(markdown).contains("JVM 的全名是什麼？");
        assertThat(markdown).contains("A. Java Virtual Machine");
        assertThat(markdown).contains("**正確答案**: A");

        // 驗證有分隔線
        assertThat(markdown).contains("---");
    }

    /**
     * 測試匯出學員版（無答案）
     */
    @Test
    void testExportWithoutAnswers() {
        // 執行匯出
        String markdown = examService.exportToMarkdown(testExamId, false, true, true, true);

        // 驗證內容
        assertThat(markdown).isNotNull();
        assertThat(markdown).contains("# Java 基礎測驗");
        assertThat(markdown).contains("**版本**: 學員版");

        // 驗證題目存在
        assertThat(markdown).contains("## 第 1 題");
        assertThat(markdown).contains("Java 是什麼類型的程式語言？");

        // 驗證不包含答案
        assertThat(markdown).doesNotContain("**正確答案**");
        assertThat(markdown).doesNotContain("**✓**");
    }

    /**
     * 測試不顯示題號
     */
    @Test
    void testExportWithoutQuestionNumbers() {
        // 執行匯出
        String markdown = examService.exportToMarkdown(testExamId, true, false, true, true);

        // 驗證不包含「第 X 題」
        assertThat(markdown).doesNotContain("第 1 題");
        assertThat(markdown).doesNotContain("第 2 題");

        // 但仍有題目標題（空白標題）
        assertThat(markdown).contains("## ");
    }

    /**
     * 測試不顯示選項編號
     */
    @Test
    void testExportWithoutOptionLabels() {
        // 執行匯出
        String markdown = examService.exportToMarkdown(testExamId, true, true, false, true);

        // 驗證包含選項內容
        assertThat(markdown).contains("編譯型語言");

        // 驗證不包含「A. 」等選項編號（但可能有 A 在答案處）
        assertThat(markdown).doesNotContain("A. 編譯型語言");
        assertThat(markdown).doesNotContain("B. 直譯型語言");
    }

    /**
     * 測試不顯示測驗資訊
     */
    @Test
    void testExportWithoutExamInfo() {
        // 執行匯出
        String markdown = examService.exportToMarkdown(testExamId, true, true, true, false);

        // 驗證不包含測驗標題和資訊
        assertThat(markdown).doesNotContain("# Java 基礎測驗");
        assertThat(markdown).doesNotContain("**描述**");
        assertThat(markdown).doesNotContain("**題數**");
        assertThat(markdown).doesNotContain("**版本**");

        // 但仍包含題目
        assertThat(markdown).contains("## 第 1 題");
        assertThat(markdown).contains("Java 是什麼類型的程式語言？");
    }

    /**
     * 測試完整選項列表
     */
    @Test
    void testAllOptionsAreExported() {
        // 執行匯出
        String markdown = examService.exportToMarkdown(testExamId, true, true, true, true);

        // 驗證第一題的所有選項都有匯出
        assertThat(markdown).contains("A. 編譯型語言");
        assertThat(markdown).contains("B. 直譯型語言");
        assertThat(markdown).contains("C. 混合型語言");
        assertThat(markdown).contains("D. 腳本語言");

        // 驗證第二題的所有選項
        assertThat(markdown).contains("A. Java Virtual Machine");
        assertThat(markdown).contains("B. Java Variable Manager");
        assertThat(markdown).contains("C. Java Version Manager");
    }

}
