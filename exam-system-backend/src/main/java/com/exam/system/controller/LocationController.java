package com.exam.system.controller;

import com.exam.system.dto.LocationStatisticsDTO;
import com.exam.system.service.LocationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 位置統計控制器
 */
@RestController
@RequestMapping("/api/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    /**
     * 取得台灣縣市名稱對照表
     */
    @GetMapping("/taiwan")
    public ResponseEntity<Map<String, String>> getTaiwanLocations() {
        return ResponseEntity.ok(locationService.getLocationNames());
    }

    /**
     * 取得指定測驗的位置統計
     */
    @GetMapping("/statistics/{examId}")
    public ResponseEntity<LocationStatisticsDTO> getLocationStatistics(
            @PathVariable Long examId) {
        return ResponseEntity.ok(locationService.getLocationStatistics(examId));
    }
}
