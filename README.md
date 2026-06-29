# 아파트 실거래가 조회 (realEstateCheck)

국토교통부 실거래가 정보 공공데이터 OpenAPI 를 활용하여, 지역(시·도 → 시·군·구)과
계약 년월을 선택해 해당 지역의 아파트 매매 실거래가를 조회하는 Spring Boot 기반 웹 서비스입니다.

## 주요 기능

- 17개 시·도 전국 시·군·구 단위 지역 선택 (법정동코드 앞 5자리 기준)
- 계약 년월 선택 (기본값: 현재월의 2개월 전 — 신고 자료 공개 시점 고려)
- 실시간 현재 날짜·시간 표시
- 거래 카드 UI 로 단지명 / 거래금액(억·만원) / 전용면적 / 층수 / 건축년도 / 계약일 / 거래유형 표시
- 직거래·해제 거래는 별도 뱃지로 강조

## 기술 스택

| 영역 | 사용 기술 |
|------|-----------|
| Backend | Spring Boot 4.1, Java 17, `java.net.http.HttpClient`, `javax.xml.parsers.DocumentBuilder` |
| Frontend | Vanilla HTML / CSS / JavaScript (외부 라이브러리 없음) |
| Build | Maven (`mvnw` 포함) |
| 데이터 | 국토교통부 실거래가 정보 — 한국부동산원 운영 |

## 사용 API

- **API 명**: 아파트 매매 실거래가 자료 (`getRTMSDataSvcAptTrade`)
- **엔드포인트**: `https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade`
- **응답 포맷**: XML
- **인증**: Service Key (URL Encoded)
- 상세 사양은 루트의 `아파트 매매 실거래가 자료 기술문서.pdf` 참고

## 디렉토리 구조

```
realEstateCheck/
├── pom.xml
├── README.md
├── request01.md                          # 요구사항 정의서
├── 아파트 매매 실거래가 자료 기술문서.pdf
└── src/main/
    ├── java/com/doridoriai/realestatecheck/
    │   ├── RealEstateCheckApplication.java
    │   ├── controller/AptTradeController.java   # GET /api/apt-trades
    │   ├── service/AptTradeService.java         # 외부 API 호출 + XML 파싱
    │   └── dto/
    │       ├── AptTradeItem.java
    │       └── AptTradeResponse.java
    └── resources/
        ├── application.properties               # API 인증키 / 베이스 URL
        └── static/
            ├── index.html
            ├── css/style.css
            ├── js/app.js
            └── data/regions.json                # 시·도 / 시·군·구 + LAWD 코드
```

## 실행 방법

### 1. 요구 사항
- JDK 17 이상

### 2. 인증키 설정
`src/main/resources/application.properties`

```properties
public-data.api.base-url=https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade
public-data.api.service-key=발급받은_인증키
```

> 본 저장소에는 개발용 인증키가 포함되어 있습니다. 운영 시에는 자신의 인증키로 교체하세요.
> 공공데이터포털(<https://www.data.go.kr>) 에서 "아파트 매매 실거래가 자료" 활용신청 후 발급됩니다.

### 3. 빌드 / 실행

```bash
# 컴파일
./mvnw -DskipTests compile

# 실행
./mvnw spring-boot:run
```

기본 포트: `http://localhost:8082`

## 화면 사용 흐름

1. 상단 우측에서 현재 날짜·시간 확인
2. **시 · 도** 선택 → **시 · 군 · 구** 셀렉트 박스 활성화
3. **시 · 군 · 구** 선택
4. **계약 년월** 선택 (기본값: 2개월 전, 최대값: 현재월)
5. **조회하기** 클릭 → 카드 목록으로 거래 자료 표시

## API 명세

### `GET /api/apt-trades`

| 파라미터 | 필수 | 타입 | 설명 |
|----------|------|------|------|
| `lawdCd` | O | string(5) | 법정동코드 앞 5자리 (예: `11680` 강남구) |
| `dealYmd` | O | string(6) | 계약 년월 YYYYMM (예: `202504`) |
| `pageNo` | - | int | 페이지 번호 (기본 1) |
| `numOfRows` | - | int | 페이지당 결과 수 (기본 50) |

#### 응답 예시 (요약)
```json
{
  "resultCode": "000",
  "resultMsg": "OK",
  "totalCount": 128,
  "pageNo": 1,
  "numOfRows": 3,
  "items": [
    {
      "sggCd": "11680",
      "umdNm": "압구정동",
      "aptNm": "한양3",
      "jibun": "489",
      "excluUseAr": "161.9",
      "dealYear": "2025",
      "dealMonth": "4",
      "dealDay": "1",
      "dealAmount": "700,000",
      "floor": "9",
      "buildYear": "1978",
      "dealingGbn": "중개거래",
      "estateAgentSggNm": "서울 강남구",
      "aptDong": "32",
      "cdealType": "",
      "cdealDay": ""
    }
  ]
}
```

- `dealAmount` 단위는 **만원** (콤마 포함 문자열)
- `cdealType == "O"` 이면 해제된 거래

## 주요 응답 필드 설명

| 필드 | 설명 |
|------|------|
| `sggCd` | 지역코드 (법정동코드 앞 5자리) |
| `umdNm` | 법정동(읍·면·동) |
| `aptNm` | 단지명 |
| `excluUseAr` | 전용면적(㎡) |
| `dealAmount` | 거래금액(만원) |
| `floor` / `buildYear` | 층수 / 건축년도 |
| `dealingGbn` | 거래유형 (중개거래 / 직거래) |
| `cdealType` / `cdealDay` | 해제여부 / 해제사유발생일 |

## 디자인 노트

- 다크 보라·블루·핑크 톤의 다층 그라데이션 배경
- 글래스모피즘 카드 (반투명 + backdrop-filter)
- 거래금액·로고는 그라데이션 텍스트로 강조
- 모바일·태블릿 대응 반응형 레이아웃

## 향후 개선 아이디어

- 가격대 · 면적 · 거래유형 필터
- 단지명 검색
- 페이지네이션
- 거래 추이 차트(월별)
- 빌라·오피스텔 등 다른 실거래가 API 연동

## 참고

- 공공데이터포털: <https://www.data.go.kr>
- 행정표준코드관리시스템 (법정동코드): <https://www.code.go.kr>
- 운영기관: 한국부동산원
