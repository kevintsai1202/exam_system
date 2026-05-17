package com.exam.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * 即時互動測驗統計系統 - 主應用程式
 *
 * @author Exam System Team
 * @version 1.0.0
 */
@SpringBootApplication
@EnableScheduling
public class ExamSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(ExamSystemApplication.class, args);
    }

}