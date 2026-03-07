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
     * 地區代碼與名稱對照表
     */
    private static final Map<String, String> LOCATION_NAMES = new LinkedHashMap<>() {
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
            // 海外固定選項
            put("HKG", "香港");
            put("MAC", "澳門");
            put("CHN", "大陸");
            put("SGP", "新加坡");
            put("USA", "美國");
            put("OTHER", "其他");
        }
    };

    /**
     * 取得位置名稱對照表
     */
    public Map<String, String> getLocationNames() {
        return new LinkedHashMap<>(LOCATION_NAMES);
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

        Map<String, String> resolvedLocationNames = new LinkedHashMap<>(getLocationNames());
        locationCounts.keySet().forEach(code -> resolvedLocationNames.put(code, getLocationName(code)));

        return LocationStatisticsDTO.builder()
                .totalCount(totalWithLocation)
                .locationCounts(locationCounts)
                .locationNames(resolvedLocationNames)
                .build();
    }

    /**
     * 驗證位置代碼是否有效
     */
    public boolean isValidLocation(String locationCode) {
        if (locationCode == null || locationCode.isEmpty()) {
            return true;
        }

        if (LOCATION_NAMES.containsKey(locationCode)) {
            return true;
        }

        return isCustomOtherLocation(locationCode);
    }

    /**
     * 取得位置名稱
     */
    public String getLocationName(String locationCode) {
        if (isCustomOtherLocation(locationCode)) {
            return locationCode.substring("OTHER:".length()).trim();
        }

        return LOCATION_NAMES.getOrDefault(locationCode, "未知");
    }

    /**
     * 判斷是否為其他自訂地區
     */
    private boolean isCustomOtherLocation(String locationCode) {
        if (locationCode == null || !locationCode.startsWith("OTHER:")) {
            return false;
        }

        String customName = locationCode.substring("OTHER:".length()).trim();
        return !customName.isEmpty();
    }
}
