# Trello 통합 및 대시보드 개선 작업 보고서 (2026-03-18)

본 문서는 오늘 진행된 트렐로 보드 통합 작업의 과정, 발생한 기술적 이슈, 그리고 이를 해결한 최종 솔루션을 정리한 기술 리포트입니다. 향후 유지보수 및 추가 기능 구현 시 참고하시기 바랍니다.

## 1. 주요 요청 사항 (User Requests)
- **1단계**: 대시보드 우측에 슬라이딩 방식의 서브 패널을 추가하고, 그 안에 트렐로 워크스페이스(iframe)를 삽입.
- **2단계**: iframe 보안 문제 해결을 위해 트렐로 API를 이용한 '네이티브 칸반 보드' 구현.
- **3단계**: 보드 연동 안정성 확보를 위해 서브 패널을 제거하고, 70% 크기의 팝업창 바로가기 방식으로 전환.
- **4단계**: 주간 일정(Weekly View) 모달의 세로 크기 20% 축소 및 내부 상단에 보드 바로가기 버튼 추가.

---

## 2. 기술적 이슈 및 해결 과정 (Issues & Solutions)

### 이슈 1: 트렐로 iframe의 보안 및 권한 문제
- **상황**: `Trello board does not exist, or is not public` 에러 발생. 보드를 공개(Public)로 설정해도 동일 증상.
- **원인**: 
  - 트렐로의 `X-Frame-Options: DENY` 정책으로 인해 타 사이트에서 iframe 임베딩이 엄격히 제한됨.
  - 브라우저의 `SameSite` 쿠키 정책으로 인해 iframe 내부에서 트렐로 로그인 정보가 전달되지 않음.
- **시도한 솔루션**: API를 통한 데이터 직접 호출 및 UI 렌더링 (네이티브 보드).

### 이슈 2: 네이티브 API 보드의 한계
- **상황**: API로 데이터를 가져와 직접 그렸으나, 카드 내의 긴 텍스트, 복잡한 라벨, 체크리스트 상세 내용 등을 모두 구현하기에는 UI가 불안정하고 유지보수가 어려움.
- **솔루션**: **Top-level Popup (`window.open`) 방식 채택**.
  - **왜 선택했나?**: 팝업창은 별도의 브라우저 컨텍스트로 열리기 때문에 iframe의 보안 제약(X-Frame-Options)을 받지 않으며, 사용자의 기존 트렐로 세션(쿠키)을 완벽하게 공유하여 별도 로그인 없이 즉시 이용 가능함.

### 이슈 3: 리팩토링 중 JSX/CSS 중첩 오류
- **상황**: 서브 패널을 제거하고 코드를 정리하는 과정에서 태그(`div`)가 잘못 닫히거나 중복되어 대시보드 전체 UI가 깨지는 현상 발생.
- **솔루션**: 
  - `page.tsx`의 전체 DOM 구조를 재검토하여 불필요한 `Snap-scroll` 컨테이너와 잔여 `section` 태그를 정리.
  - 리팩토링 후 브라우저 서브에이전트를 통해 실제 렌더링 상태를 캡처하여 검증.

---

## 3. 최종 구현 아키텍처 (Final Architecture)

### 팝업 제어 로직 (`app/page.tsx`)
```javascript
const openTrelloPopup = (url: string) => {
  const width = window.screen.width * 0.7; // 전체 화면의 70%
  const height = window.screen.height * 0.7;
  const left = (window.screen.width - width) / 2;
  const top = (window.screen.height - height) / 2;
  
  window.open(url, '_blank', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`);
};
```

### UI 구성 요소
- **메인 대시보드**: 4개 핵심 보드(동천동, 기타, 준비, 법인) 바로가기 버튼 제공.
- **주간 일정 모달**: `h-[72vh]` (화면의 약 70%) 크기로 조정되어 정보 집중도 향상 및 보드 바로가기 버튼 중복 배치.

---

## 4. 향후 작업 시 참고 사항
- **API 키 관리**: `.env.local`의 `TRELLO_API_KEY`와 `TRELLO_API_TOKEN`은 현재 체크리스트(Schedule) 데이터를 불러오는 데 사용 중입니다.
- **Vercel 배포**: 모든 수정 사항은 `git push origin main` 후 Vercel에서 자동으로 빌드 및 배포됩니다.
- **팝업 차단**: 브라우저 설정에서 해당 사이트의 팝업 허용이 필요할 수 있습니다. (사용자 안내 필요)

---
**보고서 작성 완료 (Antigravity AI)**
