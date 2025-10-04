package com.exam.system;

import com.exam.system.dto.*;
import com.exam.system.entity.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * 測試資料建構工具
 * 提供快速建立測試資料的方法
 */
public class TestDataBuilder {

    /**
     * 建立測試用的測驗實體
     */
    public static Exam createExam() {
        Exam exam = new Exam();
        exam.setTitle("測試測驗");
        exam.setDescription("這是一個測試測驗");
        exam.setQuestionTimeLimit(30);
        exam.setStatus(ExamStatus.CREATED);
        exam.setAccessCode("TEST01");
        exam.setCurrentQuestionIndex(0);
        exam.setCreatedAt(LocalDateTime.now());
        return exam;
    }

    /**
     * 建立測試用的題目實體
     */
    public static Question createQuestion(Exam exam, int order) {
        Question question = new Question();
        question.setExam(exam);
        question.setQuestionOrder(order);
        question.setQuestionText("測試題目 " + order);
        question.setCorrectOptionId(1L); // 預設正確答案為選項 1
        question.setSingleStatChartType(ChartType.BAR);
        question.setCumulativeChartType(ChartType.BAR);
        return question;
    }

    /**
     * 建立測試用的選項實體
     */
    public static QuestionOption createOption(Question question, int order, String text) {
        QuestionOption option = new QuestionOption();
        option.setQuestion(question);
        option.setOptionOrder(order);
        option.setOptionText(text);
        return option;
    }

    /**
     * 建立測試用的學員實體
     */
    public static Student createStudent(Exam exam) {
        Student student = new Student();
        student.setExam(exam);
        student.setSessionId(UUID.randomUUID().toString());
        student.setName("測試學員");
        student.setEmail("test@example.com");
        student.setAvatarIcon("cat");
        student.setTotalScore(0);
        student.setJoinedAt(LocalDateTime.now());
        return student;
    }

    /**
     * 建立測試用的答案實體
     */
    public static Answer createAnswer(Student student, Question question, Long selectedOptionId, boolean isCorrect) {
        Answer answer = new Answer();
        answer.setStudent(student);
        answer.setQuestion(question);
        answer.setSelectedOptionId(selectedOptionId);
        answer.setIsCorrect(isCorrect);
        answer.setAnsweredAt(LocalDateTime.now());
        return answer;
    }

    /**
     * 建立測試用的測驗 DTO
     */
    public static ExamDTO createExamDTO() {
        ExamDTO dto = new ExamDTO();
        dto.setTitle("測試測驗");
        dto.setDescription("這是一個測試測驗");
        dto.setQuestionTimeLimit(30);

        List<QuestionDTO> questions = new ArrayList<>();
        QuestionDTO questionDTO = createQuestionDTO(1);
        questions.add(questionDTO);
        dto.setQuestions(questions);

        return dto;
    }

    /**
     * 建立測試用的題目 DTO
     */
    public static QuestionDTO createQuestionDTO(int order) {
        QuestionDTO dto = new QuestionDTO();
        dto.setQuestionOrder(order);
        dto.setQuestionText("測試題目 " + order);
        dto.setSingleStatChartType(ChartType.BAR);
        dto.setCumulativeChartType(ChartType.BAR);

        List<QuestionOptionDTO> options = new ArrayList<>();
        options.add(createOptionDTO(1, "選項 A"));
        options.add(createOptionDTO(2, "選項 B"));
        options.add(createOptionDTO(3, "選項 C"));
        dto.setOptions(options);
        dto.setCorrectOptionOrder(1);

        return dto;
    }

    /**
     * 建立測試用的選項 DTO
     */
    public static QuestionOptionDTO createOptionDTO(int order, String text) {
        QuestionOptionDTO dto = new QuestionOptionDTO();
        dto.setOptionOrder(order);
        dto.setOptionText(text);
        return dto;
    }

    /**
     * 建立測試用的學員 DTO
     */
    public static StudentDTO createStudentDTO() {
        StudentDTO dto = new StudentDTO();
        dto.setAccessCode("TEST01");
        dto.setName("測試學員");
        dto.setEmail("test@example.com");
        dto.setAvatarIcon("cat");
        return dto;
    }

    /**
     * 建立測試用的答案 DTO
     */
    public static AnswerDTO createAnswerDTO(String sessionId, Long questionId, Long optionId) {
        AnswerDTO dto = new AnswerDTO();
        dto.setSessionId(sessionId);
        dto.setQuestionId(questionId);
        dto.setSelectedOptionId(optionId);
        return dto;
    }
}
