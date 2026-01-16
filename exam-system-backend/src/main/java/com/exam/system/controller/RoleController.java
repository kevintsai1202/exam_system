package com.exam.system.controller;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 角色管理控制器
 */
@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {

    private final UserRepository userRepository;

    /**
     * 取得當前用戶角色
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkRole(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.ok(Map.of(
                    "authenticated", false));
        }

        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "role", user.getRole().name(),
                "isInstructor", user.getRole() == UserRole.INSTRUCTOR || user.getRole() == UserRole.ADMIN,
                "isAdmin", user.getRole() == UserRole.ADMIN));
    }

    /**
     * 升級用戶為講師（需 ADMIN 權限）
     */
    @PostMapping("/upgrade/{userId}")
    public ResponseEntity<?> upgradeToInstructor(
            @PathVariable Long userId,
            @AuthenticationPrincipal User admin) {

        if (admin == null || admin.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "只有管理員可以升級用戶權限"));
        }

        return userRepository.findById(userId)
                .map(user -> {
                    user.setRole(UserRole.INSTRUCTOR);
                    userRepository.save(user);
                    return ResponseEntity.ok(Map.of(
                            "success", true,
                            "message", "用戶已升級為講師",
                            "user", Map.of(
                                    "id", user.getId(),
                                    "email", user.getEmail(),
                                    "role", user.getRole().name())));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * 取得所有用戶（需 ADMIN 權限）
     */
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal User admin) {
        if (admin == null || admin.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(403).body(Map.of(
                    "success", false,
                    "message", "沒有權限"));
        }

        var users = userRepository.findAll().stream()
                .map(user -> Map.of(
                        "id", user.getId(),
                        "email", user.getEmail(),
                        "name", user.getName(),
                        "role", user.getRole().name()))
                .toList();

        return ResponseEntity.ok(users);
    }
}
