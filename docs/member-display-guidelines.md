# 회원 관리 및 탈퇴 회원 처리 가이드

마지막 확인일: 2026-06-24

이 문서는 현재 소스 기준으로 확인한 회원 로그인, My Page, My Settings, 회원 탈퇴, 관리자 화면의 탈퇴 회원 표시 규칙을 정리한다. 앞으로 회원 관련 기능을 수정하거나 새 화면을 만들 때 기존 정책과 구현 방향을 일관되게 유지하는 것을 목표로 한다.

## 확인된 작업 요약

- 공개 페이지 상단 로그인 영역은 `AuthControl`의 단일 버튼 구조로 정리되어 있다.
- 로그인 전에는 단일 로그인 버튼이 Google OAuth 진입점으로 이동한다.
- 로그인 후에는 상단에 Settings, Logout 등 여러 버튼을 직접 노출하지 않고, 단일 `My Page` 버튼을 통해 `/me` 화면으로 이동한다.
- `My Page`는 내 수업, 메시지, 설정으로 들어가는 허브 화면이며 로그아웃 버튼도 이 화면 안에 있다.
- `My Settings`, `My Classes`, `Messages` 회원 하위 화면의 뒤로가기 버튼은 직접 메인으로 보내는 방식이 아니라 `handleMemberSubpageBack`을 통해 이전 경로가 `/me`이면 브라우저 히스토리 뒤로가기를 우선 사용하고, 아니면 `/me` 또는 `/`로 라우팅한다.
- `My Settings` 하단에는 작은 `탈퇴하기` 버튼이 있고, 확인 모달을 거쳐 `DELETE /api/members/me`를 호출한다.
- 회원 탈퇴는 `member` 행을 실제 삭제하지 않고 상태와 외부 식별자를 변경하는 방식이다.
- 탈퇴 시 `provider`, `provider_id`, `email`, `status`, `withdrawn_at`이 변경되고, `display_name`, `nickname`, `id`, 기존 연결 기록은 유지된다.
- 관리자 화면의 회원명 표시는 `MemberNameLabel`을 통해 `WITHDRAWN` 상태일 때 빨간색 `(Del)` 배지를 붙이는 재사용 컴포넌트 방식으로 구현되어 있다.

## 관련 파일 목록

프론트엔드:

- `src/App.jsx`: 공개 페이지, 로그인 버튼, My Page, My Settings, 내 수업, 메시지 화면, 회원 탈퇴 UI 흐름
- `src/api/auth.js`: 일반 회원 인증, 설정, 탈퇴, 내 메시지, 내 수업 API 클라이언트
- `src/AdminApp.jsx`: 관리자 회원 메시지 화면과 `MemberNameLabel` 사용
- `src/EventManagementPanel.jsx`: 관리자 이벤트/강습 수강생 목록과 강사 대시보드 수강생 목록에서 `MemberNameLabel` 사용
- `src/MemberNameLabel.jsx`: 탈퇴 회원 `(Del)` 표시 공용 컴포넌트와 표시명 선택 유틸
- `src/api/admin.js`: 관리자 이벤트/회원 메시지 API 클라이언트

백엔드:

- `backend/src/main/java/com/lindyhopseoul/backend/auth/AuthController.java`
- `backend/src/main/java/com/lindyhopseoul/backend/auth/AuthMeResponse.java`
- `backend/src/main/java/com/lindyhopseoul/backend/auth/CurrentMemberService.java`
- `backend/src/main/java/com/lindyhopseoul/backend/auth/GoogleOAuth2MemberService.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/Member.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/MemberAccountController.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/MemberAccountService.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/MemberProvider.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/MemberStatus.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/MemberSettingsController.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/MemberSettingsService.java`
- `backend/src/main/java/com/lindyhopseoul/backend/member/MemberSettingsResponse.java`
- `backend/src/main/java/com/lindyhopseoul/backend/eventmanagement/EventApplication.java`
- `backend/src/main/java/com/lindyhopseoul/backend/eventmanagement/EventApplicationResponse.java`
- `backend/src/main/java/com/lindyhopseoul/backend/eventmanagement/EventApplicationService.java`
- `backend/src/main/java/com/lindyhopseoul/backend/eventmanagement/EventManagementService.java`
- `backend/src/main/java/com/lindyhopseoul/backend/eventmanagement/LessonResponse.java`
- `backend/src/main/java/com/lindyhopseoul/backend/membermessage/AdminMessageThreadMemberResponse.java`
- `backend/src/main/java/com/lindyhopseoul/backend/membermessage/AdminMessageThreadSummaryResponse.java`
- `backend/src/main/java/com/lindyhopseoul/backend/membermessage/MemberMessageResponse.java`
- `backend/src/main/java/com/lindyhopseoul/backend/membermessage/MemberMessageService.java`

테스트:

- `backend/src/test/java/com/lindyhopseoul/backend/member/MemberAccountServiceTest.java`
- `backend/src/test/java/com/lindyhopseoul/backend/member/MemberSettingsServiceTest.java`
- `backend/src/test/java/com/lindyhopseoul/backend/eventmanagement/EventApplicationServiceTest.java`
- `backend/src/test/java/com/lindyhopseoul/backend/membermessage/MemberMessageServiceTest.java`

## 로그인 및 My Page 화면 구조

확인된 내용:

- `PublicApp`은 시작 시 `authApi.me()`로 `GET /api/auth/me`를 호출해 현재 로그인 상태를 확인한다.
- 로그인 버튼 클릭 시 `authApi.googleLoginUrl()`가 만든 `${VITE_API_BASE_URL}/oauth2/authorization/google`로 브라우저를 이동시킨다.
- OAuth 성공 후 `/oauth/success` 경로가 감지되면 `window.history.replaceState({}, "", "/")`로 공개 메인 경로로 정리한다.
- `AuthControl`은 고정 위치의 단일 버튼이다. 로그인 전에는 로그인, 로그인 후에는 `My Page` 버튼으로 동작한다.
- 로그인 후 상단에 Settings, Logout, Messages, My Classes 같은 여러 버튼을 직접 노출하지 않는다.
- `/me`는 `MyPage`가 렌더링되고, 내부 메뉴 버튼으로 `/my-classes`, `/messages`, `/settings`에 진입한다.
- `/me`의 뒤로가기 라벨은 한국어 `메인으로`, 영어 `Home`이며 `handleMainOpen`을 호출해 메인(`/`)으로 이동한다.
- `/settings`, `/messages`, `/my-classes`의 뒤로가기 라벨은 한국어 `뒤로가기`, 영어 `Back`이며 `handleMemberSubpageBack`을 호출한다.
- `handleMemberSubpageBack`은 이전 경로가 `/me`이고 브라우저 히스토리가 있으면 `window.history.back()`을 사용한다. 직접 진입 등으로 이전 경로가 없으면 로그인 상태에 따라 `/me` 또는 `/`로 이동한다.

관련 주요 컴포넌트와 라우팅:

- `AuthControl`: 로그인 전/후 상단 단일 버튼
- `MyPage`: 회원 허브 화면, 내 수업/메시지/설정/로그아웃 진입점
- `MemberSettingsPage`: 회원 설정 및 탈퇴 진입점
- `MyClassesPage`: 로그인 회원의 신청 내역
- `MemberMessagesPage`: 로그인 회원의 운영진 문의 메시지
- `PublicApp`의 `currentPath` 분기: `/settings`, `/messages`, `/my-classes`, `/me`, 그 외 공개 메인

## My Settings 및 탈퇴 진입 흐름

확인된 내용:

- `MemberSettingsPage`는 `authApi.getSettings()`로 `GET /api/members/me/settings`를 호출한다.
- 설정 저장은 `authApi.updateSettings()`로 `PATCH /api/members/me/settings`를 호출한다.
- 화면에는 읽기 전용 이메일, 읽기 전용 Google 표시명, 수정 가능한 닉네임, 선호 언어 선택이 있다.
- 설정 폼 하단 구분선 아래에 작은 `탈퇴하기` 버튼이 있다.
- `탈퇴하기` 버튼은 즉시 API를 호출하지 않고 확인 모달을 연다.
- 확인 모달에서 다시 `탈퇴하기`를 누르면 `authApi.withdraw()`가 `DELETE /api/members/me`를 호출한다.
- 탈퇴 성공 후 `handleWithdrawComplete`가 인증 상태와 게스트 언어, 신청 상태 캐시를 초기화하고 메인(`/`)으로 이동시킨다. 상단에는 탈퇴 완료 안내가 잠시 표시된다.

사용자 흐름:

1. 로그인 후 상단 `My Page` 버튼 클릭
2. `/me`에서 `Settings` 메뉴 클릭
3. `/settings` 화면 하단의 작은 `탈퇴하기` 클릭
4. 확인 모달에서 탈퇴 확정
5. `DELETE /api/members/me`
6. 서버에서 회원 상태 변경 후 로그아웃 처리
7. 클라이언트 인증 상태 초기화 및 메인 이동

## 회원 탈퇴 처리 정책

확인된 내용:

- 탈퇴 API는 `MemberAccountController`의 `DELETE /api/members/me`이다.
- 컨트롤러는 `CurrentMemberService.requireCurrentMemberId(request)`로 현재 활성 회원 ID를 확인한 뒤 `MemberAccountService.withdraw(memberId)`를 호출한다.
- 서비스는 `memberRepository.findById(memberId).filter(Member::isActive)`로 활성 회원만 탈퇴 처리한다.
- 탈퇴 처리는 `Member.withdraw(Instant withdrawnAt)`에서 수행된다.
- `memberRepository.delete(...)`를 호출하지 않으므로 실제 행 삭제가 아니다.
- 트랜잭션 안에서 엔티티 필드를 변경하고 JPA dirty checking으로 DB UPDATE가 발생하는 구조이다.
- 탈퇴 후 컨트롤러는 `SecurityContextLogoutHandler.logout(...)`으로 세션을 로그아웃 처리한다.
- `CurrentMemberService.findCurrentMember`는 세션의 회원 ID로 조회한 뒤 `Member::isActive`를 통과한 회원만 반환한다. 따라서 탈퇴 회원은 남은 세션 ID가 있어도 일반 회원 API에서 인증 회원으로 취급되지 않는다.

탈퇴 시 변경되는 필드:

| 필드 | 탈퇴 후 값 | 비고 |
| --- | --- | --- |
| `provider` | `MemberProvider.WITHDRAWN` | 기존 `GOOGLE`에서 변경 |
| `provider_id` | `withdrawn_<memberId>` | 외부 Google `sub` 제거, unique constraint 유지 목적 |
| `email` | `withdrawn_member_<memberId>@swingpop.local` | 원 이메일 제거 |
| `status` | `MemberStatus.WITHDRAWN` | 탈퇴 회원 구분 상태값 |
| `withdrawn_at` | 탈퇴 시각 | 전달값이 없으면 현재 시각 |
| `role` | `MemberRole.USER` | 탈퇴 시 USER로 고정 |
| `updated_at` | 엔티티 갱신 시각 | `@PreUpdate`로 갱신 |

탈퇴 시 유지되는 필드:

| 필드 | 유지 여부 | 비고 |
| --- | --- | --- |
| `id` | 유지 | 기존 기록의 FK 연결 유지 |
| `display_name` | 유지 | 운영/기록 목적의 이름 유지 |
| `nickname` | 유지 | 운영/기록 목적의 표시명 유지 |
| `preferred_language` | 유지 | 명시적으로 변경하지 않음 |
| `created_at` | 유지 | 생성 시각 보존 |
| `last_login_at` | 유지 | 명시적으로 변경하지 않음 |

기록 유지 구조:

- `EVENT_APPLICATION.MEMBER_ID`는 `member.id`를 참조하고, 탈퇴 시 회원 ID가 유지되므로 기존 수강 신청 기록과 연결이 유지된다.
- `MemberMessageThread`와 `MemberMessage`도 회원 엔티티를 참조하므로 기존 메시지 기록이 유지된다.
- `EventApplication.applicantName`은 신청 당시 저장된 문자열이다. 로그인 회원 신청 시 현재 회원의 닉네임, 표시명, 이메일 앞부분 순으로 생성되며, 탈퇴 후에도 기존 신청 기록의 이름 문자열은 그대로 남는다.

주의할 점:

- 원 이메일과 원 Google `sub`는 탈퇴 후 회원 row에서 복구할 수 없도록 대체 문자열로 바뀐다.
- `display_name`과 `nickname`은 개인정보 마스킹 대상이 아니라 운영 기록 목적상 유지하는 현재 정책으로 확인된다.
- `AuthMeResponse`와 `MemberSettingsResponse`에는 일반 회원 화면에 필요한 값만 내려가며 `status`는 포함하지 않는다.

## 관리자 페이지 탈퇴 회원 표시

확인된 내용:

- `src/MemberNameLabel.jsx`가 탈퇴 회원 표시의 공용 진입점이다.
- `isWithdrawnMemberStatus(status)`는 상태 문자열을 대문자로 바꿔 `WITHDRAWN`과 비교한다.
- `MemberNameLabel`은 `status`, `member.status`, `member.memberStatus` 중 전달된 상태를 사용한다.
- 상태가 `WITHDRAWN`이면 표시명 옆에 빨간색 `text-red-600`의 작은 `(Del)` 배지를 붙인다.
- 표시명 우선순위는 `nickname`, `memberNickname`, `displayName`, `memberDisplayName`, `applicantName`, `email`, `memberEmail`, fallback 순이다.

현재 적용된 관리자 화면:

- `AdminApp.jsx`의 회원 메시지 목록과 상세 화면
  - 목록에서는 `thread.memberStatus`가 포함된 thread 객체를 `MemberNameLabel`에 전달한다.
  - 상세 회원 정보에서는 `detail.member.status`를 사용한다.
  - 회원이 보낸 메시지의 sender 표시에도 상세 회원 상태를 전달한다.
- `EventManagementPanel.jsx`의 `ParticipantList`
  - 수강생 이름은 `participant.applicantName`으로 표시하고, `participant.memberStatus`가 `WITHDRAWN`이면 `(Del)`을 붙인다.
  - 이 `ParticipantList`는 이벤트/강습 관리 화면과 강사 대시보드의 수강생 목록에서 재사용된다.

백엔드 응답에서 확인된 상태 전달:

- `EventApplicationResponse.memberStatus`: 신청이 회원과 연결되어 있으면 `member.getStatus()`를 내려준다. 게스트 신청이면 `null`이다.
- `LessonResponse.participants`: `EventApplicationResponse` 목록을 포함한다.
- `EventManagementService.participantsByLessonId(...)`: 신청 목록을 `EventApplicationResponse::from`으로 변환한다.
- `AdminMessageThreadSummaryResponse.memberStatus`: 메시지 목록용 탈퇴 상태
- `AdminMessageThreadMemberResponse.status`: 메시지 상세 회원 정보용 탈퇴 상태

재사용성 판단:

- 현재 방식은 공용 컴포넌트 기반이라 다른 관리자 화면에도 재사용 가능하다.
- 새 관리자 화면에서 회원명을 표시할 때는 직접 문자열을 렌더링하지 말고 `MemberNameLabel`을 사용한다.
- 백엔드 DTO에는 관리자 화면이 탈퇴 상태를 판단할 수 있도록 `status` 또는 `memberStatus`를 포함해야 한다.

개선 제안:

- `MemberNameLabel`에 대한 프론트엔드 단위 테스트가 없다. `(Del)` 표시 여부와 상태 대소문자 처리를 테스트로 추가하면 회귀를 줄일 수 있다.
- DTO 필드명이 화면마다 `status`, `memberStatus`로 나뉘어 있다. 컴포넌트가 둘 다 처리하고 있어 현재는 문제 없지만, 새 API 설계 시 가능하면 `memberStatus`로 맞추면 읽기 쉽다.
- 관리자 화면 신규 개발 시 리뷰 체크리스트에 `MemberNameLabel` 사용 여부를 명시한다.

## 앞으로 지켜야 할 회원 표시 규칙

확인된 정책:

- 탈퇴 회원은 관리자 화면에서 회원 표시명 옆에 빨간색 `(Del)`을 표시한다.
- 일반 회원 화면에서는 탈퇴 상태를 불필요하게 노출하지 않는다.
- 탈퇴 회원의 기록은 유지한다.
- 탈퇴 회원의 외부 식별자와 연락 가능한 개인정보는 마스킹한다.
- 이름 성격의 `display_name`, `nickname`, 기존 신청 기록의 `applicantName`은 운영/기록 목적상 유지한다.

새 화면 개발 규칙:

1. 이 화면이 관리자 화면인지 일반 회원 화면인지 먼저 구분한다.
2. 관리자 화면에서 회원명을 표시한다면 `MemberNameLabel`을 사용한다.
3. 관리자 API 응답에는 연결 회원의 상태값을 `memberStatus` 또는 `status`로 포함한다.
4. 게스트 신청처럼 회원과 연결되지 않은 기록은 `memberStatus`를 `null`로 두고 `(Del)`을 표시하지 않는다.
5. 일반 회원 화면에는 `MemberStatus.WITHDRAWN`을 직접 노출하지 않는다.
6. 탈퇴 회원의 원 이메일, 원 provider ID, Google `sub`, 토큰, 프로필 이미지 URL을 응답에 추가하지 않는다.
7. 회원 목록, 수업 신청자 목록, 출석, 결제, 운영 체크 등 관리자 운영 화면에서 회원 정보가 보이면 같은 표시 규칙을 적용한다.
8. 화면에서 표시할 이름은 기존 우선순위를 따른다. 닉네임이 있으면 닉네임, 없으면 표시명, 없으면 화면의 기존 안전한 fallback을 사용한다.

예시:

```jsx
<MemberNameLabel member={member} fallback="-" />
```

```jsx
<MemberNameLabel name={application.applicantName} status={application.memberStatus} />
```

## API 및 서비스 흐름

로그인 흐름:

1. `AuthControl` 로그인 버튼 클릭
2. `authApi.googleLoginUrl()`로 Google OAuth 시작
3. `GoogleOAuth2MemberService.handleLogin(...)`
4. `provider=GOOGLE`, `provider_id=<Google sub>`인 활성 회원 조회
5. 기존 활성 회원이면 이메일, 표시명, 마지막 로그인 시각 갱신
6. 없으면 `Member.createGoogle(...)`로 신규 회원 생성
7. 세션에는 내부 회원 ID만 저장
8. `GET /api/auth/me`로 프론트 인증 상태 반영

설정 흐름:

1. `MemberSettingsPage`
2. `GET /api/members/me/settings`
3. `MemberSettingsService.findSettings(...)`
4. `PATCH /api/members/me/settings`
5. `MemberSettingsService.updateSettings(...)`
6. 닉네임 trim, 빈 문자열이면 `null`, 2자 미만 또는 20자 초과면 `400`
7. 선호 언어는 `KO`, `EN`만 허용

탈퇴 흐름:

1. `MemberSettingsPage` 하단 `탈퇴하기`
2. 확인 모달
3. `authApi.withdraw()`
4. `DELETE /api/members/me`
5. `CurrentMemberService.requireCurrentMemberId(...)`
6. `MemberAccountService.withdraw(...)`
7. `Member.withdraw(...)`에서 마스킹 및 상태 변경
8. 서버 로그아웃
9. 프론트 상태 초기화 및 메인 이동

관리자 표시 흐름:

1. 관리자 API가 회원 상태를 포함한 DTO 반환
2. 프론트 관리자 화면이 `MemberNameLabel`에 `member` 또는 `name/status` 전달
3. `WITHDRAWN`이면 빨간 `(Del)` 배지 표시
4. 일반 회원 화면에서는 이 컴포넌트를 사용하지 않거나 상태값을 전달하지 않는다.

## 추가 확인 필요 내용

- 실제 배포 DB에 `member.withdrawn_at` 컬럼과 `MemberProvider.WITHDRAWN`, `MemberStatus.WITHDRAWN` 값이 문제 없이 반영되어 있는지 확인이 필요하다. 현재 local profile은 Hibernate `ddl-auto: update`를 사용한다.
- 탈퇴 후 같은 Google 계정으로 다시 로그인하면, 기존 row는 `provider=WITHDRAWN`으로 바뀌어 있으므로 현재 소스 기준으로는 새 회원 row가 생성될 수 있다. 이것이 의도한 재가입 정책인지 제품 정책 확인이 필요하다.
- 탈퇴 회원 표시 UI에 대한 프론트엔드 자동 테스트는 확인되지 않았다.
- 브라우저에서 실제 Google 로그인, My Page 이동, My Settings 탈퇴 모달, 탈퇴 후 로그아웃 상태까지 이어지는 수동 E2E 확인은 별도로 필요하다.
- 현재 `MemberSettingsService.findMember(...)` 자체는 활성 상태를 직접 필터링하지 않는다. 현재 컨트롤러 호출 경로는 `CurrentMemberService`를 거쳐 활성 회원만 들어오므로 문제는 확인되지 않았지만, 향후 다른 호출자가 생기면 활성 상태 검증을 유지해야 한다.
- 운영 체크 화면은 현재 회원 도메인명이 아니라 관리자/운영진 계정명 중심으로 보이며 `MemberNameLabel` 적용 대상은 아닌 것으로 확인된다. 향후 운영 체크에 회원 검색/선택 기능이 추가되면 이 규칙을 적용해야 한다.

## 간단 테스트 체크리스트

백엔드 단위 테스트:

- `MemberAccountServiceTest.withdrawMasksExternalIdentifiersButKeepsDisplayNames`
  - 탈퇴 후 `status=WITHDRAWN`
  - `provider=WITHDRAWN`
  - `provider_id=withdrawn_<id>`
  - `email=withdrawn_member_<id>@swingpop.local`
  - `displayName`과 `nickname` 유지
  - `withdrawnAt` 저장
- 이미 탈퇴한 회원을 다시 탈퇴 처리하면 `UnauthorizedException`
- `MemberSettingsServiceTest`
  - 닉네임 trim
  - 빈 닉네임 null 처리
  - 닉네임 길이 검증
  - 선호 언어 검증
- `EventApplicationServiceTest`
  - 로그인 회원 신청 시 `member` 연결
  - 로그인 회원 신청 이름은 닉네임 우선
  - 로그인 회원 중복 신청 방지
- 회원 메시지 서비스 테스트
  - 회원 메시지 작성 시 thread와 message가 회원 row에 연결되는지 확인

프론트 수동 확인:

1. 로그아웃 상태에서 상단 버튼이 로그인 버튼 하나인지 확인한다.
2. 로그인 후 상단 버튼이 `My Page` 하나인지 확인한다.
3. `My Page`에서 내 수업, 메시지, 설정, 로그아웃이 화면 내부 메뉴로 제공되는지 확인한다.
4. `/settings`, `/messages`, `/my-classes`에서 뒤로가기 버튼을 누르면 `/me`로 돌아가는지 확인한다.
5. `/me`의 `메인으로/Home` 버튼은 메인(`/`)으로 이동하는지 확인한다.
6. `My Settings` 하단에 작은 `탈퇴하기` 버튼이 있는지 확인한다.
7. 탈퇴 확인 모달에서 취소하면 API 호출 없이 모달만 닫히는지 확인한다.
8. 탈퇴 확정 후 `DELETE /api/members/me`가 호출되고 메인으로 이동하며 로그인 상태가 해제되는지 확인한다.

관리자 화면 확인:

1. 탈퇴 회원이 포함된 수강생 목록에서 이름 옆에 빨간 `(Del)`이 표시되는지 확인한다.
2. 게스트 신청자에게는 `(Del)`이 표시되지 않는지 확인한다.
3. 관리자 회원 메시지 목록과 상세에서 탈퇴 회원명 옆에 `(Del)`이 표시되는지 확인한다.
4. 일반 회원 화면에는 `(Del)`이나 `WITHDRAWN` 상태가 노출되지 않는지 확인한다.
5. 새 관리자 화면에서 회원명을 직접 렌더링하지 않고 `MemberNameLabel`을 사용하는지 코드 리뷰한다.
