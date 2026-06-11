# 부동산 실거래가 조회 서비스 요구사항 정의서

## 1. 개요

공공데이터포털의 "아파트 매매 실거래가 자료" OpenAPI 를 활용하여, 사용자가 지역을 선택하면
해당 지역의 최신 아파트 매매 실거래 정보를 조회·확인할 수 있는 웹 서비스를 구현한다.

- 기술 스택: Spring Boot 4.x (Java 17), HTML/CSS/JS (Vanilla)
- 데이터 출처: 국토교통부 실거래가 정보 (한국부동산원 운영)
- 참고 문서: 루트 디렉토리의 `아파트 매매 실거래가 자료 기술문서.pdf`

## 2. 사용 API 사양

| 항목 | 값 |
|------|-----|
| API 명 | 아파트 매매 실거래가 자료 (getRTMSDataSvcAptTrade) |
| 서비스 URL | `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade` |
| 인터페이스 | REST (GET) |
| 응답 포맷 | XML |
| 인증 방식 | Service Key (URL Encoded) |
| 인증키 | `5fd1de04e9d24ffefe3290c48fc7ba51273bf056c06cb8619c45f4787c95a581` |

### 2.1 요청 파라미터

| 파라미터 | 필수 | 설명 | 예시 |
|----------|------|------|------|
| serviceKey | O | 공공데이터포털 인증키 (URL 인코딩) | - |
| LAWD_CD | O | 법정동코드 앞 5자리 (시군구) | 11110 (서울 종로구) |
| DEAL_YMD | O | 계약년월 (YYYYMM) | 202506 |
| pageNo | - | 페이지번호 | 1 |
| numOfRows | - | 한 페이지 결과 수 | 10 |

### 2.2 주요 응답 필드

| 영문 | 국문 | 설명 |
|------|------|------|
| sggCd | 지역코드 | 법정동코드 앞 5자리 |
| umdNm | 법정동 | 읍·면·동 이름 |
| aptNm | 단지명 | 아파트 단지명 |
| jibun | 지번 | 지번 주소 |
| excluUseAr | 전용면적 | ㎡ 단위 |
| dealYear / dealMonth / dealDay | 계약 연/월/일 | - |
| dealAmount | 거래금액 (만원) | 콤마 포함 문자열 |
| floor | 층 | - |
| buildYear | 건축년도 | - |
| dealingGbn | 거래유형 | 중개거래 / 직거래 |
| estateAgentSggNm | 중개사소재지 | 시군구 단위 |
| cdealType / cdealDay | 해제여부 / 해제사유발생일 | - |

## 3. 기능 요구사항

### 3.1 화면 구성
1. **헤더 영역**
   - 서비스 제목 ("아파트 실거래가 조회")
   - 현재 날짜·시간 실시간 표시 (1초 간격 갱신)

2. **검색 영역**
   - 시·도 셀렉트 박스 (서울특별시, 부산광역시, 인천광역시 등 17개 시·도)
   - 시·군·구 셀렉트 박스 (시·도 선택에 따라 동적으로 변경)
   - 계약년월 선택 (기본값: 현재월의 1~2개월 전 — 최신 자료가 확정 공개되는 시점 고려)
   - 조회 버튼

3. **결과 영역**
   - 조회된 거래 건수 / 지역 / 기간 표시
   - 거래 목록 카드 (단지명, 법정동, 거래금액, 전용면적, 층, 계약일, 건축년도, 거래유형)
   - 데이터 없음 / 오류 안내 표시

### 3.2 디자인 가이드
- 심미적으로 어울리는 그라데이션 배경 (부드러운 보라/블루 톤)
- 카드형 레이아웃으로 가독성 확보
- 한국어 폰트 가독성 우선 (시스템 폰트 스택)
- 데스크탑/모바일 반응형

## 4. 백엔드 설계

### 4.1 패키지 구조
```
com.doridoriai.realestatecheck
├── RealEstateCheckApplication.java
├── controller
│   └── AptTradeController.java       // GET /api/apt-trades
├── service
│   └── AptTradeService.java          // 외부 API 호출 + XML 파싱
└── dto
    ├── AptTradeItem.java             // 거래 1건
    └── AptTradeResponse.java         // 응답 래퍼
```

### 4.2 엔드포인트
- `GET /api/apt-trades?lawdCd={5자리}&dealYmd={YYYYMM}&pageNo={n}&numOfRows={n}`
  - JSON 으로 변환된 거래 목록을 반환

### 4.3 설정
- `application.properties` 에 `public-data.api.service-key` 로 인증키 보관
