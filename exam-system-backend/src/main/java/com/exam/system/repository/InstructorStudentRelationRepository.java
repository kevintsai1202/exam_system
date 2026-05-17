package com.exam.system.repository;

import com.exam.system.entity.InstructorStudentRelation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 講師 ↔ 學員 關係 Repository
 */
@Repository
public interface InstructorStudentRelationRepository
        extends JpaRepository<InstructorStudentRelation, Long> {

    /**
     * 查特定講師對特定學員的關係（用於 UPSERT 判斷）
     */
    Optional<InstructorStudentRelation> findByInstructorIdAndProfileId(
            Long instructorId, Long profileId);

    /**
     * 查某講師擁有的所有學員關係（依最近互動時間排序）
     */
    @Query("SELECT r FROM InstructorStudentRelation r " +
           "WHERE r.instructor.id = :instructorId " +
           "ORDER BY r.lastInteractionAt DESC")
    List<InstructorStudentRelation> findByInstructorIdOrderByLastInteractionDesc(
            @Param("instructorId") Long instructorId);
}
