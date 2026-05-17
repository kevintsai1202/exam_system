package com.exam.system.service;

import com.exam.system.entity.Exam;
import com.exam.system.entity.Survey;
import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.exception.AuthException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OwnershipGuardTest {

    @Mock CurrentUserProvider currentUserProvider;
    @InjectMocks OwnershipGuard guard;

    User instructor1, instructor2, admin;
    Exam examOwnedBy1;

    @BeforeEach
    void setup() {
        instructor1 = User.builder().id(1L).role(UserRole.INSTRUCTOR).build();
        instructor2 = User.builder().id(2L).role(UserRole.INSTRUCTOR).build();
        admin       = User.builder().id(99L).role(UserRole.ADMIN).build();
        examOwnedBy1 = new Exam();
        examOwnedBy1.setId(100L);
        examOwnedBy1.setOwner(instructor1);
    }

    @Test
    void isOwnerOrAdmin_trueForOwner() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor1);
        assertThat(guard.isOwnerOrAdmin(examOwnedBy1)).isTrue();
    }

    @Test
    void isOwnerOrAdmin_falseForOtherInstructor() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor2);
        assertThat(guard.isOwnerOrAdmin(examOwnedBy1)).isFalse();
    }

    @Test
    void isOwnerOrAdmin_trueForAdmin() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(admin);
        assertThat(guard.isOwnerOrAdmin(examOwnedBy1)).isTrue();
    }

    @Test
    void assertOwnerOrAdmin_throwsForOtherInstructor() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor2);
        assertThatThrownBy(() -> guard.assertOwnerOrAdmin(examOwnedBy1))
            .isInstanceOf(AuthException.class)
            .hasMessageContaining("無權限");
    }

    @Test
    void assertOwnerOrAdmin_passesForAdmin() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(admin);
        assertThatNoException().isThrownBy(() -> guard.assertOwnerOrAdmin(examOwnedBy1));
    }

    @Test
    void assertOwnerOrAdmin_Survey_delegatesToExam() {
        when(currentUserProvider.requireCurrentUser()).thenReturn(instructor2);
        Survey s = new Survey();
        s.setExam(examOwnedBy1);
        assertThatThrownBy(() -> guard.assertOwnerOrAdmin(s))
            .isInstanceOf(AuthException.class);
    }
}
