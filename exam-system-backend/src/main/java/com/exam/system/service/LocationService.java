package com.exam.system.service;

import com.exam.system.dto.LocationStatisticsDTO;
import com.exam.system.entity.Student;
import com.exam.system.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 位置統計服務
 */
@Service
@RequiredArgsConstructor
public class LocationService {

    private final StudentRepository studentRepository;

    /**
     * 台灣縣市代碼與名稱對照表
     */
    private static final Map<String, String> TAIWAN_LOCATIONS = new LinkedHashMap<>() {
        {
            // 北部
            put("TPE", "台北市");
            put("NTP", "新北市");
            put("KEL", "基隆市");
            put("TYN", "桃園市");
            put("HSC", "新竹市");
            put("HSH", "新竹縣");
            put("YLN", "宜蘭縣");
            // 中部
            put("TXG", "台中市");
            put("CHW", "彰化縣");
            put("NTO", "南投縣");
            put("YUN", "雲林縣");
            put("MIA", "苗栗縣");
            // 南部
            put("TNN", "台南市");
            put("KHH", "高雄市");
            put("CYI", "嘉義市");
            put("CYQ", "嘉義縣");
            put("PIF", "屏東縣");
            // 東部
            put("HUN", "花蓮縣");
            put("TTT", "台東縣");
            // 離島
            put("PEN", "澎湖縣");
            put("KIN", "金門縣");
            put("LNN", "連江縣");
        }
    };

    /**
     * 取得位置名稱對照表
     */
    public Map<String, String> getLocationNames() {
        return new LinkedHashMap<>(TAIWAN_LOCATIONS);
    }

    /**
     * 取得指定測驗的位置統計
     */
    public LocationStatisticsDTO getLocationStatistics(Long examId) {
        List<Student> students = studentRepository.findByExamId(examId);

        Map<String, Integer> locationCounts = new HashMap<>();
        int totalWithLocation = 0;

        for (Student student : students) {
            String location = student.getLocation();
            if (location != null && !location.isEmpty()) {
                locationCounts.merge(location, 1, Integer::sum);
                totalWithLocation++;
            }
        }

        return LocationStatisticsDTO.builder()
                .totalCount(totalWithLocation)
                .locationCounts(locationCounts)
                .locationNames(getLocationNames())
                .build();
    }

    /**
     * 驗證位置代碼是否有效
     */
    public boolean isValidLocation(String locationCode) {
        return locationCode == null || locationCode.isEmpty() ||
                TAIWAN_LOCATIONS.containsKey(locationCode);
    }

    /**
     * 取得位置名稱
     */
    public String getLocationName(String locationCode) {
        return TAIWAN_LOCATIONS.getOrDefault(locationCode, "未知");
    }
}
