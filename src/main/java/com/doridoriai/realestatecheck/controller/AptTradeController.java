package com.doridoriai.realestatecheck.controller;

import com.doridoriai.realestatecheck.dto.AptTradeResponse;
import com.doridoriai.realestatecheck.service.AptTradeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/apt-trades")
public class AptTradeController {

    private final AptTradeService aptTradeService;

    public AptTradeController(AptTradeService aptTradeService) {
        this.aptTradeService = aptTradeService;
    }

    @GetMapping
    public ResponseEntity<?> getTrades(
            @RequestParam("lawdCd") String lawdCd,
            @RequestParam("dealYmd") String dealYmd,
            @RequestParam(value = "pageNo", defaultValue = "1") int pageNo,
            @RequestParam(value = "numOfRows", defaultValue = "50") int numOfRows
    ) {
        if (!lawdCd.matches("\\d{5}")) {
            return ResponseEntity.badRequest().body(Map.of("error", "lawdCd 는 5자리 숫자여야 합니다."));
        }
        if (!dealYmd.matches("\\d{6}")) {
            return ResponseEntity.badRequest().body(Map.of("error", "dealYmd 는 YYYYMM 형식의 6자리 숫자여야 합니다."));
        }

        try {
            AptTradeResponse response = aptTradeService.fetch(lawdCd, dealYmd, pageNo, numOfRows);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "외부 API 호출 중 오류가 발생했습니다.",
                    "message", e.getMessage() == null ? "" : e.getMessage()
            ));
        }
    }
}
