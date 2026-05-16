package com.exam.system.repository;

import com.exam.system.entity.Exam;
import com.exam.system.entity.ExamStatus;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ExamRepository 講師擁有者過濾查詢測試
 * 驗證 Phase 8 新增的 owner-scoped 查詢方法是否能正確區分不同擁有者的測驗
 */
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ExamRepositoryOwnerFilterTest {

    @Autowired
    TestEntityManager em;

    @Autowired
    ExamRepository examRepository;

    /** 第一位測試講師 */
    User instructor1;

    /** 第二位測試講師 */
    User instructor2;

    /**
     * 每個測試前建立兩位講師，並為他們建立三筆測驗（instructor1 兩筆、instructor2 一筆）
     * 註：access_code 欄位限制為 VARCHAR(6)，因此使用短代碼避免長度溢位
     */
    @BeforeEach
    void setup() {
        instructor1 = em.persistAndFlush(User.builder()
            .email("ownertest-t1@test.com").name("T1").role(UserRole.INSTRUCTOR).build());
        instructor2 = em.persistAndFlush(User.builder()
            .email("ownertest-t2@test.com").name("T2").role(UserRole.INSTRUCTOR).build());

        em.persistAndFlush(buildExam("OWNERTEST-A", "OTA001", instructor1));
        em.persistAndFlush(buildExam("OWNERTEST-B", "OTB001", instructor1));
        em.persistAndFlush(buildExam("OWNERTEST-C", "OTC001", instructor2));
    }

    /**
     * 驗證 findByOwnerIdOrderByCreatedAtDesc 只回傳指定擁有者的測驗
     */
    @Test
    void findByOwnerIdOrderByCreatedAtDesc_returnsOnlyOwnerExams() {
        List<Exam> result = examRepository.findByOwnerIdOrderByCreatedAtDesc(instructor1.getId());
        assertThat(result).extracting(Exam::getTitle)
            .containsExactlyInAnyOrder("OWNERTEST-A", "OWNERTEST-B");
    }

    /**
     * 驗證 findByIdAndOwnerId 在 owner 匹配時回傳測驗
     */
    @Test
    void findByIdAndOwnerId_returnsExamWhenMatch() {
        Exam examA = examRepository.findAll().stream()
            .filter(e -> "OWNERTEST-A".equals(e.getTitle())).findFirst().orElseThrow();
        Optional<Exam> result = examRepository.findByIdAndOwnerId(examA.getId(), instructor1.getId());
        assertThat(result).isPresent();
    }

    /**
     * 驗證 findByIdAndOwnerId 在 owner 不匹配時回傳空
     */
    @Test
    void findByIdAndOwnerId_returnsEmptyWhenOtherOwner() {
        Exam examC = examRepository.findAll().stream()
            .filter(e -> "OWNERTEST-C".equals(e.getTitle())).findFirst().orElseThrow();
        Optional<Exam> result = examRepository.findByIdAndOwnerId(examC.getId(), instructor1.getId());
        assertThat(result).isEmpty();
    }

    /**
     * 驗證 existsByIdAndOwnerId 能正確區分 owner
     */
    @Test
    void existsByIdAndOwnerId_trueWhenMatch() {
        Exam examA = examRepository.findAll().stream()
            .filter(e -> "OWNERTEST-A".equals(e.getTitle())).findFirst().orElseThrow();
        assertThat(examRepository.existsByIdAndOwnerId(examA.getId(), instructor1.getId())).isTrue();
        assertThat(examRepository.existsByIdAndOwnerId(examA.getId(), instructor2.getId())).isFalse();
    }

    /**
     * 建立測試用測驗實體
     * @param title 測驗標題
     * @param accessCode 加入碼（須小於等於 6 字元）
     * @param owner 測驗擁有者
     */
    private Exam buildExam(String title, String accessCode, User owner) {
        return Exam.builder()
            .title(title)
            .questionTimeLimit(30)
            .status(ExamStatus.CREATED)
            .currentQuestionIndex(0)
            .accessCode(accessCode)
            .owner(owner)
            .build();
    }
}
