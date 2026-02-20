package com.exam.system.config;

import com.exam.system.entity.User;
import com.exam.system.entity.UserRole;
import com.exam.system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 系統預設資料初始化
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        String adminEmail = "admin@example.com";
        // 檢查是否已存在預設管理員
        if (!userRepository.existsByEmail(adminEmail)) {
            log.info("初始化預設管理員帳號...");
            User admin = User.builder()
                    .email(adminEmail)
                    .name("系統超級管理員")
                    .passwordHash(passwordEncoder.encode("admin123")) // 預設密碼 admin123
                    .role(UserRole.ADMIN)
                    .build();

            userRepository.save(admin);
            log.info("預設管理員建立完成，帳號: {}，密碼: admin123", adminEmail);
        } else {
            log.info("系統管理員帳號已存在，跳過初始化。");
        }
    }
}
