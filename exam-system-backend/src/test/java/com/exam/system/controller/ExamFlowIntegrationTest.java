package com.exam.system.controller;

import com.exam.system.dto.*;
import com.exam.system.entity.ChartType;
import com.exam.system.entity.ExamStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * 測驗完整流程整合測試
 * 測試從建立測驗到結束測驗的完整業務流程
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("測驗完整流程整合測試")
class ExamFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    /**
     * 測試場景 1：講師建立測驗的完整流程
     *
     * 步驟：
     * 1. 講師建立測驗（包含3道題目，每題4個選項）
     * 2. 驗證測驗建立成功
     * 3. 驗證測驗初始狀態為 CREATED
     * 4. 驗證 accessCode 已生成
     * 5. 查詢測驗詳情
     */
    @Test
    @DisplayName("場景1：講師建立測驗流程")
    void testScenario1_InstructorCreatesExam() throws Exception {
        // === 步驟 1：建立測驗 ===
        ExamDTO examDTO = createSampleExamDTO();

        MvcResult createResult = mockMvc.perform(post("/api/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(examDTO)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Spring Boot 測驗"))
                .andExpect(jsonPath("$.accessCode").exists())
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andExpect(jsonPath("$.totalQuestions").value(3))
                .andReturn();

        String responseBody = createResult.getResponse().getContentAsString();
        ExamDTO createdExam = objectMapper.readValue(responseBody, ExamDTO.class);

        assertThat(createdExam.getId()).isNotNull();
        assertThat(createdExam.getAccessCode()).isNotNull();
        assertThat(createdExam.getAccessCode()).hasSize(6);

        // === 步驟 2：查詢測驗詳情 ===
        mockMvc.perform(get("/api/exams/" + createdExam.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(createdExam.getId()))
                .andExpect(jsonPath("$.title").value("Spring Boot 測驗"))
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andExpect(jsonPath("$.totalQuestions").value(3))
                .andExpect(jsonPath("$.totalStudents").value(0));

        // === 步驟 3：查詢測驗的題目列表 ===
        mockMvc.perform(get("/api/exams/" + createdExam.getId() + "/questions"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].questionText").value("什麼是 Spring Boot？"))
                .andExpect(jsonPath("$[0].options.length()").value(4))
                .andExpect(jsonPath("$[1].questionText").value("Spring Boot 的主要優勢是？"))
                .andExpect(jsonPath("$[2].questionText").value("如何啟動 Spring Boot 應用？"));
    }

    /**
     * 測試場景 2：講師啟動測驗並生成 QR Code
     *
     * 步驟：
     * 1. 建立測驗
     * 2. 啟動測驗
     * 3. 驗證狀態變更為 STARTED
     * 4. 驗證 QR Code 已生成
     * 5. 驗證 startedAt 時間已記錄
     */
    @Test
    @DisplayName("場景2：講師啟動測驗並生成QR Code")
    void testScenario2_InstructorStartsExam() throws Exception {
        // === 準備：建立測驗 ===
        ExamDTO examDTO = createSampleExamDTO();
        MvcResult createResult = mockMvc.perform(post("/api/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(examDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        ExamDTO createdExam = objectMapper.readValue(
                createResult.getResponse().getContentAsString(), ExamDTO.class);

        // === 步驟 1：啟動測驗 ===
        mockMvc.perform(post("/api/exams/" + createdExam.getId() + "/start")
                        .param("baseUrl", "http://localhost:5173"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("STARTED"))
                .andExpect(jsonPath("$.startedAt").exists())
                .andExpect(jsonPath("$.qrCodeUrl").exists())
                .andExpect(jsonPath("$.qrCodeBase64").exists())
                .andExpect(jsonPath("$.qrCodeUrl").value("http://localhost:5173/student/join?code=" + createdExam.getAccessCode()));

        // === 步驟 2：驗證測驗狀態已更新 ===
        mockMvc.perform(get("/api/exams/" + createdExam.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("STARTED"))
                .andExpect(jsonPath("$.startedAt").exists());

        // === 步驟 3：嘗試再次啟動（應該失敗）===
        mockMvc.perform(post("/api/exams/" + createdExam.getId() + "/start")
                        .param("baseUrl", "http://localhost:5173"))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("測驗已經啟動或結束"));
    }

    /**
     * 測試場景 3：學員使用 accessCode 加入測驗
     *
     * 步驟：
     * 1. 建立並啟動測驗
     * 2. 多個學員加入測驗
     * 3. 驗證學員資訊正確
     * 4. 驗證每個學員獲得唯一的 sessionId
     * 5. 查詢測驗的學員列表
     */
    @Test
    @DisplayName("場景3：多個學員加入測驗")
    void testScenario3_StudentsJoinExam() throws Exception {
        // === 準備：建立並啟動測驗 ===
        ExamDTO createdExam = createAndStartExam();
        String accessCode = createdExam.getAccessCode();

        // === 步驟 1：學員1加入測驗 ===
        StudentDTO student1 = new StudentDTO();
        student1.setAccessCode(accessCode);
        student1.setName("張三");
        student1.setEmail("zhang@example.com");
        student1.setAvatarIcon("cat");

        MvcResult joinResult1 = mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student1)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.sessionId").exists())
                .andExpect(jsonPath("$.name").value("張三"))
                .andExpect(jsonPath("$.totalScore").value(0))
                .andExpect(jsonPath("$.examStatus").value("STARTED"))
                .andReturn();

        StudentDTO joinedStudent1 = objectMapper.readValue(
                joinResult1.getResponse().getContentAsString(), StudentDTO.class);

        // === 步驟 2：學員2加入測驗 ===
        StudentDTO student2 = new StudentDTO();
        student2.setAccessCode(accessCode);
        student2.setName("李四");
        student2.setEmail("li@example.com");
        student2.setAvatarIcon("dog");

        MvcResult joinResult2 = mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student2)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionId").exists())
                .andExpect(jsonPath("$.name").value("李四"))
                .andReturn();

        StudentDTO joinedStudent2 = objectMapper.readValue(
                joinResult2.getResponse().getContentAsString(), StudentDTO.class);

        // === 步驟 3：驗證每個學員有唯一的 sessionId ===
        assertThat(joinedStudent1.getSessionId()).isNotEqualTo(joinedStudent2.getSessionId());

        // === 步驟 4：學員3加入測驗 ===
        StudentDTO student3 = new StudentDTO();
        student3.setAccessCode(accessCode);
        student3.setName("王五");
        student3.setEmail("wang@example.com");
        student3.setAvatarIcon("bird");

        mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student3)))
                .andExpect(status().isCreated());

        // === 步驟 5：查詢測驗資訊，驗證學員數量 ===
        mockMvc.perform(get("/api/exams/" + createdExam.getId()))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStudents").value(3));

        // === 步驟 6：嘗試用錯誤的 accessCode 加入（應該失敗）===
        StudentDTO invalidStudent = new StudentDTO();
        invalidStudent.setAccessCode("WRONG1");
        invalidStudent.setName("錯誤");
        invalidStudent.setEmail("error@example.com");
        invalidStudent.setAvatarIcon("cat");

        mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidStudent)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("無效的測驗代碼"));
    }

    /**
     * 測試場景 4：完整的答題流程
     *
     * 步驟：
     * 1. 建立並啟動測驗
     * 2. 學員加入測驗
     * 3. 講師開始第一題
     * 4. 學員提交答案
     * 5. 驗證答案記錄和分數
     * 6. 講師開始第二題
     * 7. 學員再次作答
     * 8. 驗證累積分數
     */
    @Test
    @DisplayName("場景4：完整的答題流程")
    void testScenario4_CompleteAnswerFlow() throws Exception {
        // === 準備：建立並啟動測驗 ===
        ExamDTO createdExam = createAndStartExam();
        Long examId = createdExam.getId();
        String accessCode = createdExam.getAccessCode();

        // === 步驟 1：學員加入測驗 ===
        StudentDTO student = new StudentDTO();
        student.setAccessCode(accessCode);
        student.setName("測試學員");
        student.setEmail("test@example.com");
        student.setAvatarIcon("cat");

        MvcResult joinResult = mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student)))
                .andExpect(status().isCreated())
                .andReturn();

        StudentDTO joinedStudent = objectMapper.readValue(
                joinResult.getResponse().getContentAsString(), StudentDTO.class);
        String sessionId = joinedStudent.getSessionId();

        // === 步驟 2：講師開始第一題（questionIndex = 0）===
        mockMvc.perform(post("/api/exams/" + examId + "/questions/0/start"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("題目已開始"))
                .andExpect(jsonPath("$.questionIndex").value(0));

        // 取得第一題的題目資訊
        MvcResult questionsResult = mockMvc.perform(get("/api/exams/" + examId + "/questions"))
                .andExpect(status().isOk())
                .andReturn();

        List<QuestionDTO> questions = objectMapper.readValue(
                questionsResult.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, QuestionDTO.class));

        QuestionDTO firstQuestion = questions.get(0);
        Long firstQuestionId = firstQuestion.getId();
        Long correctOptionId = firstQuestion.getCorrectOptionId();

        // === 步驟 3：學員提交正確答案 ===
        AnswerDTO answerDTO = new AnswerDTO();
        answerDTO.setSessionId(sessionId);
        answerDTO.setQuestionId(firstQuestionId);
        answerDTO.setSelectedOptionId(correctOptionId);

        MvcResult answerResult = mockMvc.perform(post("/api/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(answerDTO)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.studentId").value(joinedStudent.getId()))
                .andExpect(jsonPath("$.questionId").value(firstQuestionId))
                .andExpect(jsonPath("$.selectedOptionId").value(correctOptionId))
                .andExpect(jsonPath("$.isCorrect").value(true))
                .andExpect(jsonPath("$.currentTotalScore").value(1))
                .andReturn();

        // === 步驟 4：驗證學員分數已更新 ===
        mockMvc.perform(get("/api/students/" + sessionId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId").value(sessionId))
                .andExpect(jsonPath("$.totalScore").value(1));

        // === 步驟 5：講師開始第二題 ===
        mockMvc.perform(post("/api/exams/" + examId + "/questions/1/start"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.questionIndex").value(1));

        QuestionDTO secondQuestion = questions.get(1);
        Long secondQuestionId = secondQuestion.getId();
        Long wrongOptionId = secondQuestion.getOptions().stream()
                .filter(opt -> !opt.getId().equals(secondQuestion.getCorrectOptionId()))
                .findFirst()
                .get()
                .getId();

        // === 步驟 6：學員提交錯誤答案 ===
        AnswerDTO wrongAnswerDTO = new AnswerDTO();
        wrongAnswerDTO.setSessionId(sessionId);
        wrongAnswerDTO.setQuestionId(secondQuestionId);
        wrongAnswerDTO.setSelectedOptionId(wrongOptionId);

        mockMvc.perform(post("/api/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongAnswerDTO)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isCorrect").value(false))
                .andExpect(jsonPath("$.currentTotalScore").value(1)); // 分數不變

        // === 步驟 7：驗證學員分數未增加 ===
        mockMvc.perform(get("/api/students/" + sessionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScore").value(1));

        // === 步驟 8：嘗試重複作答（應該失敗）===
        mockMvc.perform(post("/api/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(wrongAnswerDTO)))
                .andDo(print())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("ANSWER_ALREADY_EXISTS"))
                .andExpect(jsonPath("$.message").value("已經作答過此題"));

        // === 步驟 9：查詢學員答案記錄 ===
        mockMvc.perform(get("/api/answers/student/" + sessionId))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].isCorrect").value(true))
                .andExpect(jsonPath("$[1].isCorrect").value(false));
    }

    /**
     * 測試場景 5：結束測驗並查看排行榜
     *
     * 步驟：
     * 1. 建立並啟動測驗
     * 2. 多個學員加入測驗
     * 3. 講師開始第一題
     * 4. 學員們作答（不同正確率）
     * 5. 講師結束測驗
     * 6. 查詢排行榜
     * 7. 驗證排名正確
     */
    @Test
    @DisplayName("場景5：結束測驗並查看排行榜")
    void testScenario5_EndExamAndLeaderboard() throws Exception {
        // === 準備：建立並啟動測驗 ===
        ExamDTO createdExam = createAndStartExam();
        Long examId = createdExam.getId();
        String accessCode = createdExam.getAccessCode();

        // === 步驟 1：三個學員加入測驗 ===
        // 學員1
        StudentDTO student1 = new StudentDTO();
        student1.setAccessCode(accessCode);
        student1.setName("第一名");
        student1.setEmail("first@example.com");
        student1.setAvatarIcon("lion");

        MvcResult joinResult1 = mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student1)))
                .andExpect(status().isCreated())
                .andReturn();
        StudentDTO joinedStudent1 = objectMapper.readValue(
                joinResult1.getResponse().getContentAsString(), StudentDTO.class);

        // 學員2
        StudentDTO student2 = new StudentDTO();
        student2.setAccessCode(accessCode);
        student2.setName("第二名");
        student2.setEmail("second@example.com");
        student2.setAvatarIcon("tiger");

        MvcResult joinResult2 = mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student2)))
                .andExpect(status().isCreated())
                .andReturn();
        StudentDTO joinedStudent2 = objectMapper.readValue(
                joinResult2.getResponse().getContentAsString(), StudentDTO.class);

        // 學員3
        StudentDTO student3 = new StudentDTO();
        student3.setAccessCode(accessCode);
        student3.setName("第三名");
        student3.setEmail("third@example.com");
        student3.setAvatarIcon("cat");

        MvcResult joinResult3 = mockMvc.perform(post("/api/students/join")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(student3)))
                .andExpect(status().isCreated())
                .andReturn();
        StudentDTO joinedStudent3 = objectMapper.readValue(
                joinResult3.getResponse().getContentAsString(), StudentDTO.class);

        // === 步驟 2：取得題目資訊 ===
        MvcResult questionsResult = mockMvc.perform(get("/api/exams/" + examId + "/questions"))
                .andExpect(status().isOk())
                .andReturn();

        List<QuestionDTO> questions = objectMapper.readValue(
                questionsResult.getResponse().getContentAsString(),
                objectMapper.getTypeFactory().constructCollectionType(List.class, QuestionDTO.class));

        // === 步驟 3：講師開始並完成所有3題 ===
        // 第一題：所有人都答對
        mockMvc.perform(post("/api/exams/" + examId + "/questions/0/start"))
                .andExpect(status().isOk());

        QuestionDTO q1 = questions.get(0);
        submitAnswer(joinedStudent1.getSessionId(), q1.getId(), q1.getCorrectOptionId());
        submitAnswer(joinedStudent2.getSessionId(), q1.getId(), q1.getCorrectOptionId());
        submitAnswer(joinedStudent3.getSessionId(), q1.getId(), q1.getCorrectOptionId());

        // 第二題：學員1和學員2答對，學員3答錯
        mockMvc.perform(post("/api/exams/" + examId + "/questions/1/start"))
                .andExpect(status().isOk());

        QuestionDTO q2 = questions.get(1);
        Long wrongOptionQ2 = q2.getOptions().stream()
                .filter(opt -> !opt.getId().equals(q2.getCorrectOptionId()))
                .findFirst()
                .get()
                .getId();

        submitAnswer(joinedStudent1.getSessionId(), q2.getId(), q2.getCorrectOptionId());
        submitAnswer(joinedStudent2.getSessionId(), q2.getId(), q2.getCorrectOptionId());
        submitAnswer(joinedStudent3.getSessionId(), q2.getId(), wrongOptionQ2);

        // 第三題：只有學員1答對
        mockMvc.perform(post("/api/exams/" + examId + "/questions/2/start"))
                .andExpect(status().isOk());

        QuestionDTO q3 = questions.get(2);
        Long wrongOptionQ3 = q3.getOptions().stream()
                .filter(opt -> !opt.getId().equals(q3.getCorrectOptionId()))
                .findFirst()
                .get()
                .getId();

        submitAnswer(joinedStudent1.getSessionId(), q3.getId(), q3.getCorrectOptionId());
        submitAnswer(joinedStudent2.getSessionId(), q3.getId(), wrongOptionQ3);
        submitAnswer(joinedStudent3.getSessionId(), q3.getId(), wrongOptionQ3);

        // === 步驟 4：驗證各學員分數 ===
        // 學員1：3分（全對）
        mockMvc.perform(get("/api/students/" + joinedStudent1.getSessionId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScore").value(3));

        // 學員2：2分
        mockMvc.perform(get("/api/students/" + joinedStudent2.getSessionId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScore").value(2));

        // 學員3：1分
        mockMvc.perform(get("/api/students/" + joinedStudent3.getSessionId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalScore").value(1));

        // === 步驟 5：講師結束測驗 ===
        mockMvc.perform(post("/api/exams/" + examId + "/end"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("測驗已結束"));

        // === 步驟 6：驗證測驗狀態已更新為 ENDED ===
        mockMvc.perform(get("/api/exams/" + examId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ENDED"))
                .andExpect(jsonPath("$.endedAt").exists());

        // === 步驟 7：查詢排行榜 ===
        mockMvc.perform(get("/api/statistics/exams/" + examId + "/leaderboard"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.examId").value(examId))
                .andExpect(jsonPath("$.totalStudents").value(3))
                .andExpect(jsonPath("$.totalQuestions").value(3))
                .andExpect(jsonPath("$.leaderboard").isArray())
                .andExpect(jsonPath("$.leaderboard.length()").value(3))
                // 驗證排名順序
                .andExpect(jsonPath("$.leaderboard[0].rank").value(1))
                .andExpect(jsonPath("$.leaderboard[0].name").value("第一名"))
                .andExpect(jsonPath("$.leaderboard[0].totalScore").value(3))
                .andExpect(jsonPath("$.leaderboard[1].rank").value(2))
                .andExpect(jsonPath("$.leaderboard[1].name").value("第二名"))
                .andExpect(jsonPath("$.leaderboard[1].totalScore").value(2))
                .andExpect(jsonPath("$.leaderboard[2].rank").value(3))
                .andExpect(jsonPath("$.leaderboard[2].name").value("第三名"))
                .andExpect(jsonPath("$.leaderboard[2].totalScore").value(1));

        // === 步驟 8：測驗結束後不能再作答 ===
        AnswerDTO lateAnswer = new AnswerDTO();
        lateAnswer.setSessionId(joinedStudent1.getSessionId());
        lateAnswer.setQuestionId(q1.getId());
        lateAnswer.setSelectedOptionId(q1.getCorrectOptionId());

        mockMvc.perform(post("/api/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(lateAnswer)))
                .andDo(print())
                .andExpect(status().isBadRequest());
    }

    // ==================== 輔助方法 ====================

    /**
     * 提交答案的輔助方法
     */
    private void submitAnswer(String sessionId, Long questionId, Long optionId) throws Exception {
        AnswerDTO answerDTO = new AnswerDTO();
        answerDTO.setSessionId(sessionId);
        answerDTO.setQuestionId(questionId);
        answerDTO.setSelectedOptionId(optionId);

        mockMvc.perform(post("/api/answers")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(answerDTO)))
                .andExpect(status().isCreated());
    }

    /**
     * 建立範例測驗 DTO
     */
    private ExamDTO createSampleExamDTO() {
        ExamDTO examDTO = new ExamDTO();
        examDTO.setTitle("Spring Boot 測驗");
        examDTO.setDescription("測試你對 Spring Boot 的了解程度");
        examDTO.setQuestionTimeLimit(30);

        List<QuestionDTO> questions = new ArrayList<>();

        // 題目1
        QuestionDTO q1 = new QuestionDTO();
        q1.setQuestionOrder(1);
        q1.setQuestionText("什麼是 Spring Boot？");
        q1.setSingleStatChartType(ChartType.BAR);
        q1.setCumulativeChartType(ChartType.BAR);
        q1.setCorrectOptionOrder(1);

        List<QuestionOptionDTO> q1Options = new ArrayList<>();
        q1Options.add(createOption(1, "Java 開發框架"));
        q1Options.add(createOption(2, "資料庫"));
        q1Options.add(createOption(3, "前端框架"));
        q1Options.add(createOption(4, "作業系統"));
        q1.setOptions(q1Options);
        questions.add(q1);

        // 題目2
        QuestionDTO q2 = new QuestionDTO();
        q2.setQuestionOrder(2);
        q2.setQuestionText("Spring Boot 的主要優勢是？");
        q2.setSingleStatChartType(ChartType.PIE);
        q2.setCumulativeChartType(ChartType.BAR);
        q2.setCorrectOptionOrder(2);

        List<QuestionOptionDTO> q2Options = new ArrayList<>();
        q2Options.add(createOption(1, "執行速度快"));
        q2Options.add(createOption(2, "快速開發"));
        q2Options.add(createOption(3, "介面美觀"));
        q2Options.add(createOption(4, "價格便宜"));
        q2.setOptions(q2Options);
        questions.add(q2);

        // 題目3
        QuestionDTO q3 = new QuestionDTO();
        q3.setQuestionOrder(3);
        q3.setQuestionText("如何啟動 Spring Boot 應用？");
        q3.setSingleStatChartType(ChartType.BAR);
        q3.setCumulativeChartType(ChartType.PIE);
        q3.setCorrectOptionOrder(3);

        List<QuestionOptionDTO> q3Options = new ArrayList<>();
        q3Options.add(createOption(1, "點擊滑鼠"));
        q3Options.add(createOption(2, "重新開機"));
        q3Options.add(createOption(3, "執行 main 方法"));
        q3Options.add(createOption(4, "安裝軟體"));
        q3.setOptions(q3Options);
        questions.add(q3);

        examDTO.setQuestions(questions);
        return examDTO;
    }

    /**
     * 建立選項 DTO
     */
    private QuestionOptionDTO createOption(int order, String text) {
        QuestionOptionDTO option = new QuestionOptionDTO();
        option.setOptionOrder(order);
        option.setOptionText(text);
        return option;
    }

    /**
     * 建立並啟動測驗（輔助方法）
     */
    private ExamDTO createAndStartExam() throws Exception {
        // 建立測驗
        ExamDTO examDTO = createSampleExamDTO();
        MvcResult createResult = mockMvc.perform(post("/api/exams")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(examDTO)))
                .andExpect(status().isCreated())
                .andReturn();

        ExamDTO createdExam = objectMapper.readValue(
                createResult.getResponse().getContentAsString(), ExamDTO.class);

        // 啟動測驗
        MvcResult startResult = mockMvc.perform(post("/api/exams/" + createdExam.getId() + "/start")
                        .param("baseUrl", "http://localhost:5173"))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readValue(
                startResult.getResponse().getContentAsString(), ExamDTO.class);
    }
}
