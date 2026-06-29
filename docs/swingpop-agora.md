# Swingpop Agora 구현 문서

## 추가/수정한 파일

- `src/App.jsx`: My Page 메뉴에 Agora 진입 카드를 추가하고 `/me/agora` 별도 페이지 라우팅과 페이지 shell을 연결했습니다.
- `src/SwingpopAgora.jsx`: Agora를 2D 미니맵 구조로 재배치하고, 운영진 공지를 API에서 불러오며 운영진/회원 아바타와 말풍선을 맵 위 좌표 슬롯에 배치했습니다.
- `src/SwingpopAgora.css`: Agora 전용 2D 맵 스타일, 구역 라벨, 길/댄스홀/공지 구역/방명록 구역/소셜 플로어, 좌표 기반 아바타 말풍선, 모바일 세로형 맵 전환을 추가했습니다.
- `src/api/agoraNotices.js`: `/api/agora/notices` visible 공지 조회 API 클라이언트를 추가했습니다.
- `src/api/agoraGuestbookMessages.js`: `/api/agora/guestbook-messages` 회원 방명록 조회/등록 API 클라이언트를 추가했습니다.
- `src/api/agoraParticipantAvatars.js`: `/api/agora/participant-avatars` 강습 신청 회원 아바타 조회 API 클라이언트를 추가했습니다.
- `src/api/admin.js`: 관리자용 Agora 공지 조회, 등록, 수정, 노출/숨김 API와 방명록 조회, 관리자 숨김/해제 API 메서드를 추가했습니다.
- `src/AdminApp.jsx`: 관리자 메뉴에 `AGORA_NOTICES`를 추가하고 Agora 공지 등록/수정/숨김 관리 패널을 추가했습니다.
- `src/AdminApp.jsx`: 관리자 메뉴에 `AGORA_GUESTBOOK`을 추가하고 Agora 방명록 메시지 조회/숨김/해제 패널을 추가했습니다.
- `backend/src/main/java/com/lindyhopseoul/backend/admin/AdminMenu.java`: `SUPER_ADMIN`, `STAFF` 관리자 메뉴에 `AGORA_NOTICES`, `AGORA_GUESTBOOK`을 추가했습니다.
- `backend/src/main/java/com/lindyhopseoul/backend/agora/*`: Agora 공지, 회원 방명록, 강습 신청 회원 아바타 response/service/controller를 추가했습니다.
- `backend/src/main/java/com/lindyhopseoul/backend/eventmanagement/EventApplicationRepository.java`: Agora 신청 회원 아바타 후보 조회 쿼리를 추가했습니다.
- `backend/src/test/java/com/lindyhopseoul/backend/admin/AdminAuthServiceTest.java`: 관리자 세션 메뉴 테스트 기대값에 `AGORA_NOTICES`, `AGORA_GUESTBOOK`을 반영했습니다.
- `backend/src/test/java/com/lindyhopseoul/backend/agora/AgoraGuestbookMessageServiceTest.java`: 방명록 저장, 7일 만료, 120자 제한, 관리자 숨김/해제 권한 테스트를 추가했습니다.
- `backend/src/test/java/com/lindyhopseoul/backend/agora/AgoraParticipantAvatarServiceTest.java`: 신청 회원 아바타의 안전한 표시 필드, 중복 제거, 최대 표시 수, 추가 인원 수 계산 테스트를 추가했습니다.
- `src/data/agoraNotices.js`: 1차 구현 때 사용한 운영진 공지 mock data입니다. 현재 기본 `/me/agora` 화면은 API 공지를 사용합니다.
- `src/data/agoraGuestbookMessages.js`: 1차 구현 때 사용한 회원 방명록 mock data입니다. 현재 기본 `/me/agora` 화면은 API 방명록을 사용하며, 이 파일은 참조용으로만 남겼습니다.
- `docs/swingpop-agora.md`: 구현 내용과 추후 연동 방향을 문서화했습니다.

## 구현한 기능 요약

- Swingpop Agora 1차 기능 구현을 완료했습니다.
- My Page에는 `스윙팝 아고라` 진입 카드만 표시합니다.
- `스윙팝 아고라` 카드를 클릭하면 `/me/agora`로 이동하고, 그 화면에서 Agora 공지 공간이 별도 페이지처럼 표시됩니다.
- Agora 화면 상단에는 My Page로 돌아가는 버튼을 추가했습니다.
- Agora 영역은 기존 사이트의 푸른 톤을 유지하면서, 카드형 공지 영역이 아니라 2D 스타일의 작은 커뮤니티 맵처럼 보이도록 재구성했습니다.
- `/me/agora` 화면에는 `Dance Hall`, `Notice`, `Guestbook`, `Social Floor` 구역과 길/댄스홀 바닥 느낌의 CSS 맵을 추가했습니다.
- 운영진을 나타내는 원형 캐릭터 1개를 `Notice` 구역 근처에 배치하고, 클릭 가능한 공지 말풍선을 캐릭터 옆에 표시합니다.
- 운영진 캐릭터는 맵 안의 NPC처럼 보이도록 고정 좌표와 그림자, 배지, 부드러운 움직임을 유지했습니다.
- 운영진 공지는 `GET /api/agora/notices` API에서 visible 공지만 최신순으로 불러옵니다.
- 말풍선에는 API로 받은 최신 visible 공지의 한글 제목과 영문 제목이 일정 시간마다 번갈아 표시됩니다.
- 말풍선은 캐릭터 옆에서 말하는 느낌이 나도록 꼬리와 작은 연결점을 조정했고, 텍스트 전환은 흐림과 이동을 함께 사용해 더 부드럽게 나타나고 사라지도록 했습니다.
- 말풍선을 클릭하면 패널이 열리고, 최신 공지부터 오래된 공지 순으로 제목, 간단한 내용, 등록일을 보여줍니다.
- 공지 API 실패 또는 공지 0건 상태에서도 Agora 화면이 깨지지 않고 기본 안내 문구를 표시합니다.
- BGM 버튼은 기본 꺼짐 상태이며, 사용자가 직접 누를 때만 재생을 시도합니다.
- `/audio/swingpop-agora-bgm.mp3` 파일이 없어도 화면이 깨지지 않도록 오디오 오류를 안전하게 처리합니다.
- 모바일에서는 헤더, 캐릭터, 말풍선이 세로로 재배치되도록 반응형 CSS를 적용했습니다.
- `/me/agora`에 회원 방명록 말풍선 영역을 추가했고, 회원 방명록은 DB/API 기반으로 전환했습니다.
- 로그인 회원만 방명록 메시지를 등록할 수 있으며, 작성 당시 닉네임을 `nicknameSnapshot`으로 저장하고 닉네임 첫 글자 캐릭터와 회원용 말풍선으로 표시합니다.
- 회원 메시지는 120자 이하로 제한하며, 빈 메시지는 등록하지 못하도록 검증합니다.
- 회원 메시지는 서버에서 `createdAt` 기준 7일 뒤의 `expiresAt` 값을 만들고, `expiresAt`이 지난 메시지나 `visible=false`, `hiddenByAdmin=true` 메시지는 노출하지 않는 구조입니다.
- 최신 회원 메시지를 먼저 보여주되 최대 5개까지만 맵 안의 고정 슬롯 좌표에 배치해, 게시판 리스트가 아니라 맵 위에 떠 있는 작은 캐릭터/말풍선처럼 보이도록 했습니다.
- 운영진 공지는 신뢰도 있는 큰 공지 말풍선, 회원 메시지는 더 작고 가벼운 방명록 말풍선으로 시각적으로 구분했습니다.
- 모바일에서는 좌표 기반 배치를 세로형 미니맵 흐름으로 전환해 아바타와 말풍선이 겹치지 않도록 했습니다.
- 관리자 페이지에는 `Agora 공지` 메뉴를 추가했고, 운영진이 한글/영문 제목, 한글/영문 내용, 중요공지 여부, 노출 여부를 입력해 공지를 등록/수정할 수 있습니다.
- 관리자 페이지에서는 공지를 삭제하지 않고 노출/숨김 상태를 변경하며, 숨김 처리된 공지는 `/me/agora`에 표시되지 않습니다.
- 일반 회원은 관리자 세션 토큰이 없으므로 관리자용 Agora 공지 등록/수정/숨김 API를 사용할 수 없습니다.
- 관리자 페이지에는 `Agora 방명록` 메뉴를 추가했고, 운영진이 회원 방명록 메시지를 확인하고 부적절한 메시지를 숨김/해제할 수 있습니다.
- 관리자 숨김 처리된 방명록 메시지는 `/me/agora` 미니맵에 표시되지 않습니다.
- `/me/agora`에 현재 공개 중인 이벤트/강습에 정상 신청한 활성 회원들의 아바타를 2D 미니맵 위에 표시합니다.
- 신청 회원 아바타는 실제 사진을 사용하지 않고 닉네임 첫 글자 또는 이니셜 기반의 둥근 캐릭터로 표시합니다.
- 신청 회원 아바타는 Social Floor 또는 Dance Hall 주변의 고정 좌표 슬롯에 배치하고, 너무 많은 경우 `+N more` 형태로 추가 인원 수만 표시합니다.
- 신청 회원 아바타는 방명록 말풍선 아바타보다 작고 말풍선이 없는 형태로 표시해 운영진 공지, 방명록 말풍선과 구분했습니다.
- 신청 회원 아바타 API와 화면에는 이메일, 실명, 연락처, 신청 메모를 노출하지 않고 닉네임/이니셜 중심의 표시 정보만 사용합니다.

## 아직 mock/reference-only인 부분

- 운영진 공지는 DB/API 기반으로 전환되었습니다.
- `src/data/agoraNotices.js`의 `SWINGPOP_AGORA_NOTICES`는 1차 구현 때 사용한 mock reference이며, 현재 기본 `/me/agora` 렌더링에서는 사용하지 않습니다.
- 회원 방명록은 DB/API 기반으로 전환되었습니다.
- `src/data/agoraGuestbookMessages.js`의 회원 방명록 mock data는 1차 구현 때 사용한 reference-only 데이터이며, 현재 기본 `/me/agora` 렌더링에서는 사용하지 않습니다.
- 운영진/회원 아바타 위치는 현재 프론트엔드의 고정 좌표/슬롯 배열로 관리합니다.
- 강습 신청 회원 아바타 위치도 현재 프론트엔드의 고정 좌표/슬롯 배열로 관리합니다.
- 신고 기능은 이번 범위에 포함하지 않았습니다.
- BGM 실제 파일은 포함하지 않았습니다. 파일을 추가하려면 `public/audio/swingpop-agora-bgm.mp3` 경로를 사용하면 됩니다.

## 구현된 DB/API 구조

### 운영진 공지

- DB 테이블: `agora_notice`
- 주요 필드: `id`, `titleKo`, `titleEn`, `contentKo`, `contentEn`, `important`, `visible`, `createdBy`, `createdAt`, `updatedAt`
- `GET /api/agora/notices`: visible 공지 목록을 최신순으로 조회합니다.
- `GET /api/admin/agora/notices`: 관리자용 전체 공지 목록을 최신순으로 조회합니다.
- `POST /api/admin/agora/notices`: 관리자용 공지를 등록합니다.
- `PUT /api/admin/agora/notices/{id}`: 관리자용 공지를 수정합니다.
- `PATCH /api/admin/agora/notices/{id}/visibility`: 관리자용 공지 노출/숨김 상태를 변경합니다.
- 관리자 API는 기존 `AdminSessionService`의 Bearer 토큰을 요구하고, `SUPER_ADMIN` 또는 `STAFF` 권한만 사용할 수 있습니다.

### 회원 방명록

- DB 테이블: `agora_guestbook_message`
- 주요 필드: `id`, `memberId`, `nicknameSnapshot`, `message`, `visible`, `hiddenByAdmin`, `createdAt`, `expiresAt`, `updatedAt`, `hiddenAt`, `hiddenByAdminId`
- `GET /api/agora/guestbook-messages`: `/me/agora`에 표시할 visible, not hidden, not expired 방명록 메시지를 최신순 최대 5개 조회합니다.
- `POST /api/agora/guestbook-messages`: 로그인 회원의 방명록 메시지를 등록합니다.
- `GET /api/admin/agora/guestbook-messages`: 관리자용 전체 방명록 메시지 목록을 최신순으로 조회합니다.
- `PATCH /api/admin/agora/guestbook-messages/{id}/hidden`: 관리자용 방명록 메시지 숨김/숨김 해제 상태를 변경합니다.
- 회원 작성 API는 기존 `CurrentMemberService`를 사용해 로그인한 활성 회원만 작성할 수 있습니다.
- 관리자 API는 기존 `AdminSessionService`의 Bearer 토큰을 요구하고, `SUPER_ADMIN` 또는 `STAFF` 권한만 사용할 수 있습니다.

### 강습 신청 회원 아바타

- 별도 DB 테이블을 추가하지 않고 기존 `EVENT_APPLICATION`, `SWINGPOP_EVENT`, `LESSON`, `MEMBER` 데이터를 조회합니다.
- `GET /api/agora/participant-avatars`: `/me/agora`에 표시할 강습 신청 회원 아바타 목록과 추가 인원 수를 조회합니다.
- `GET /api/agora/class-participant-avatars`: 기존 개발 중 경로와의 호환을 위한 동일 응답 alias입니다.
- 응답 필드: `avatars`, `additionalCount`
- 아바타 필드: `id`, `memberId`, `nickname`, `initial`, `role`, `classTitle`, `positionGroup`
- 표시 기준: active 신청, active 회원, `PUBLISHED` 이벤트, 종료일이 현재 날짜 이후인 이벤트, `PUBLISHED` 레슨, 종료일이 현재 날짜 이후인 레슨입니다.
- 동일 회원이 여러 강습에 신청한 경우 화면 복잡도를 줄이기 위해 한 번만 표시합니다.
- 최대 12명까지만 아바타로 표시하고, 초과 인원은 `additionalCount`로 내려주어 화면에서 `+N more`로 표시합니다.

## 개인정보 노출 방지 기준

- 신청 회원 아바타 API는 `EventApplication.applicantName`, `contactValue`, `contactMethod`, `requestMemo`를 응답에 포함하지 않습니다.
- `/me/agora` 화면에는 회원 이메일, 실명, 연락처를 표시하지 않습니다.
- 닉네임이 있는 회원은 닉네임과 이니셜만 표시합니다.
- 닉네임이 없는 회원은 선호 언어에 따라 `회원` 또는 `Member` 같은 일반 표시명으로 대체합니다.
- 수업/이벤트 제목은 공개 일정에 이미 노출되는 공개 메타데이터로만 사용합니다.
- 취소/제거된 신청, 탈퇴/정지/비활성 회원, 종료된 이벤트/레슨 신청자는 아바타 조회 대상에서 제외합니다.

## 추후 백엔드 연동 API 후보

- `GET /api/agora/map/layout`: 맵 구역과 아바타 슬롯 좌표 설정 조회

## 추후 디자인 고도화

- `/me/agora` 맵을 더 좌우로 넓은 2D 월드처럼 개선합니다.
- 현재 카드형 공간감을 줄이고, 실제 미니맵/댄스홀 지도처럼 보이도록 개선합니다.
- `Dance Hall`, `Notice`, `Guestbook`, `Social Floor` 구역을 라벨 박스가 아니라 건물, 간판, 공간처럼 표현합니다.
- 바닥, 길, 무대, 조명, 건물 레이어를 추가해 입체감을 강화합니다.
- 회원 아바타와 운영진 아바타가 실제 맵 위에 서 있는 느낌으로 좌표를 재배치합니다.
- 모바일에서는 세로형 미니맵으로 자연스럽게 전환합니다.
- 이 개선은 기능 안정화 이후 별도 디자인 고도화 작업으로 진행합니다.

## 테스트 방법

1. `npm run build`로 프론트엔드 빌드가 성공하는지 확인합니다.
2. `mvn test`로 백엔드 테스트가 성공하는지 확인합니다.
3. 개발 서버에서 Google 로그인 후 `/me`로 이동합니다.
4. My Page의 기존 카드인 내 신청 내역, 메시지, 내 설정 버튼이 기존처럼 이동하는지 확인합니다.
5. My Page의 `스윙팝 아고라` 카드를 클릭했을 때 `/me/agora`로 이동하는지 확인합니다.
6. `/me/agora` 화면 상단의 My Page 버튼을 클릭했을 때 `/me`로 돌아가는지 확인합니다.
7. `/me/agora`에서 Swingpop Agora 말풍선의 한글/영문 최신 공지 제목이 자연스럽게 교차 표시되는지 확인합니다.
8. 말풍선을 클릭해 공지 패널이 열리고 공지가 최신순으로 표시되는지 확인합니다.
9. BGM 버튼을 클릭했을 때, 음악 파일이 없는 환경에서도 화면이 깨지지 않고 버튼 상태만 안전하게 바뀌는지 확인합니다.
10. 모바일 폭에서 Agora 페이지가 겹치지 않고 세로 배치되는지 확인합니다.
11. `/me/agora`가 일반 게시판/공지 카드가 아니라 2D 미니맵형 커뮤니티 공간처럼 보이는지 확인합니다.
12. 회원 방명록 입력 UI가 보이는지 확인합니다.
13. 빈 메시지 등록이 막히는지 확인합니다.
14. 120자 글자 수 제한과 남은 글자 수 표시가 동작하는지 확인합니다.
15. 메시지 등록 후 닉네임 첫 글자 캐릭터와 회원 말풍선이 표시되는지 확인합니다.
16. 등록된 메시지 객체에 `expiresAt`이 7일 뒤 값으로 생성되는지 확인합니다.
17. 운영진 공지 말풍선과 회원 방명록 말풍선이 시각적으로 구분되는지 확인합니다.
18. `Dance Hall`, `Notice`, `Guestbook`, `Social Floor` 구역이 맵 안에 보이는지 확인합니다.
19. 운영진 아바타와 회원 아바타가 맵 안에서 겹치지 않고 배치되는지 확인합니다.
20. 관리자 페이지에서 `Agora 공지` 메뉴가 `SUPER_ADMIN` 또는 `STAFF` 계정에 표시되는지 확인합니다.
21. 관리자 페이지에서 Agora 공지를 등록, 수정, 숨김 처리할 수 있는지 확인합니다.
22. 숨김 처리된 공지가 `/me/agora` 운영진 말풍선과 공지 패널에 표시되지 않는지 확인합니다.
23. 관리자 페이지에서 `Agora 방명록` 메뉴가 `SUPER_ADMIN` 또는 `STAFF` 계정에 표시되는지 확인합니다.
24. 관리자 페이지에서 회원 방명록 메시지를 숨김 처리할 수 있는지 확인합니다.
25. 숨김 처리된 회원 방명록 메시지가 `/me/agora` 미니맵에 표시되지 않는지 확인합니다.
26. 숨김 해제한 회원 방명록 메시지가 표시 조건을 만족하면 다시 `/me/agora`에 표시되는지 확인합니다.
27. `/me/agora`에서 강습 신청 회원 아바타가 Social Floor 또는 Dance Hall 주변에 맵 위 캐릭터처럼 표시되는지 확인합니다.
28. 강습 신청 회원 아바타에 닉네임 또는 이니셜만 보이고 이메일, 실명, 연락처가 표시되지 않는지 확인합니다.
29. 신청자가 많을 때 일부만 아바타로 표시되고 나머지는 `+N more`로 표시되는지 확인합니다.
30. 모바일 화면에서 신청 회원 아바타가 겹치지 않고 작은 그리드 형태로 전환되는지 확인합니다.

## 로그인 상태 수동 테스트 체크리스트

- [ ] My Page에서 `스윙팝 아고라` 또는 `Swingpop Agora` 진입 카드가 보이는지 확인합니다.
- [ ] Agora 진입 카드를 클릭했을 때 `/me/agora`로 이동하는지 확인합니다.
- [ ] `/me/agora` 상단의 My Page 또는 뒤로가기 버튼으로 `/me`에 복귀할 수 있는지 확인합니다.
- [ ] 운영진 아바타 옆에 최신 운영진 공지 말풍선이 보이는지 확인합니다.
- [ ] 운영진 공지 말풍선을 클릭했을 때 공지 리스트 패널이 열리는지 확인합니다.
- [ ] BGM 버튼이 보이고, 클릭해도 화면이 깨지지 않는지 확인합니다.
- [ ] 방명록 입력 UI가 `/me/agora` 화면에 자연스럽게 표시되는지 확인합니다.
- [ ] 빈 메시지를 등록하려 할 때 등록이 차단되고 안내가 표시되는지 확인합니다.
- [ ] 120자 제한과 남은 글자 수 표시가 동작하는지 확인합니다.
- [ ] 메시지 등록 후 회원 닉네임/이니셜 아바타와 회원 말풍선이 맵 안에 표시되는지 확인합니다.
- [ ] 등록된 메시지 데이터 구조에 7일 뒤 `expiresAt` 값이 만들어지는지 확인합니다.
- [ ] 강습 신청 회원 아바타가 맵 안에 표시되는지 확인합니다.
- [ ] 신청 회원 아바타에는 닉네임 또는 이니셜만 표시되는지 확인합니다.
- [ ] 이메일, 실명, 연락처 등 개인정보가 표시되지 않는지 확인합니다.
- [ ] 모바일 화면에서 2D 미니맵, 공지 말풍선, 방명록 입력, 회원 말풍선이 깨지지 않는지 확인합니다.
- [ ] 기존 My Page의 내 신청 내역, 메시지, 내 설정 흐름에 영향이 없는지 확인합니다.

## 테스트 결과

- Swingpop Agora 로그인 상태 기능 테스트 성공을 확인했습니다.
- My Page에서 `스윙팝 아고라` 진입 카드가 정상 표시됩니다.
- `스윙팝 아고라` 카드를 클릭하면 `/me/agora`로 정상 이동합니다.
- `/me/agora`에서 My Page 복귀 버튼이 정상 동작합니다.
- 운영진 공지 말풍선이 정상 표시됩니다.
- 공지 펼치기 기능이 정상 동작합니다.
- BGM 버튼이 정상 동작합니다.
- 회원 방명록 입력 UI가 정상 표시됩니다.
- 빈 메시지 등록 차단이 정상 동작합니다.
- 120자 제한이 정상 동작합니다.
- 메시지 등록 후 회원 아바타와 말풍선이 정상 표시됩니다.
- 2D 미니맵형 배치가 정상 표시됩니다.
- 기존 내 신청 내역, 메시지, 내 설정, 개인정보처리방침, 회원 탈퇴 흐름에는 영향이 없습니다.
- `npm run build` 성공을 확인했습니다.
- 소스 기준으로 `/me`의 My Page 메뉴에는 `classes`, `messages`, `settings`, `agora` 카드가 같은 메뉴 레벨로 구성되어 있습니다.
- 소스 기준으로 My Page 본문에서 `SwingpopAgora` 직접 렌더링을 제거했고, `agora` 메뉴 액션은 `/me/agora`로 이동합니다.
- 소스 기준으로 `/me/agora` 전용 `AgoraPage`에서만 `SwingpopAgora`를 `variant="page"`로 렌더링합니다.
- 소스 기준으로 운영진 공지는 API 기반으로 전환했고, BGM 버튼과 말풍선 클릭 공지 패널 기능은 유지했습니다.
- 소스 기준으로 `/me/agora` 전용 shell과 `swingpop-agora--page` 스타일에 조명, 백월, 나무 바닥, 캐릭터 그림자, 말풍선 전환 개선을 추가했습니다.
- 소스 기준으로 회원 방명록은 DB/API 기반 조회/등록 흐름으로 전환했습니다.
- 소스 기준으로 빈 메시지 검증, 120자 제한, 7일 뒤 `expiresAt` 생성, `visible`/`hiddenByAdmin`/만료 필터링, 최신순 최대 5개 표시를 확인했습니다.
- 소스 기준으로 `/me/agora`의 주요 배치를 2D 맵 구조로 변경했고, `Dance Hall`, `Notice`, `Guestbook`, `Social Floor` 구역과 운영진/회원 좌표 슬롯을 추가했습니다.
- 소스 기준으로 공지 말풍선 클릭 패널, BGM 버튼, 회원 방명록 입력/검증 로직은 유지했습니다.
- 운영진 공지는 DB/API 기반으로 전환되었습니다.
- `/me/agora`는 `GET /api/agora/notices`를 통해 visible 공지만 최신순으로 조회합니다.
- 최신 visible 공지가 운영진 말풍선에 표시되고, 공지 패널에도 visible 공지만 최신순으로 표시됩니다.
- 관리자 페이지에서 Agora 공지 등록, 수정, 노출/숨김 처리가 가능한 구조를 추가했습니다.
- 숨김 처리된 공지는 `/me/agora`에 표시되지 않는 구조입니다.
- 회원 방명록은 DB/API 기반으로 전환되었습니다.
- `/me/agora`는 `GET /api/agora/guestbook-messages`를 통해 visible, not hidden, not expired 메시지를 최신순 최대 5개 조회합니다.
- 로그인 회원은 `POST /api/agora/guestbook-messages`로 방명록 메시지를 등록할 수 있습니다.
- 방명록 작성 시 서버에서 작성 당시 닉네임을 `nicknameSnapshot`으로 저장하고, `createdAt` 기준 7일 뒤 `expiresAt`을 생성합니다.
- 관리자 페이지에서 Agora 방명록 메시지를 확인하고 숨김/숨김 해제할 수 있는 구조를 추가했습니다.
- 관리자 숨김 처리된 방명록 메시지는 `/me/agora`에 표시되지 않는 구조입니다.
- 강습 신청 회원 아바타는 `GET /api/agora/participant-avatars`로 조회합니다.
- 신청 회원 아바타는 active 신청, active 회원, published 및 종료되지 않은 이벤트/레슨 기준으로 표시합니다.
- 취소/제거된 신청자, 비활성/탈퇴/정지 회원, 종료된 이벤트/레슨 신청자는 표시 대상에서 제외되는 구조입니다.
- 신청 회원 아바타에는 닉네임 또는 일반 대체 표시명과 이니셜만 사용하며, 이메일, 실명, 연락처, 신청 메모는 응답과 화면에 포함하지 않습니다.
- 신청 회원 아바타는 최대 12명까지만 표시하고 초과 인원은 `+N more`로 표시합니다.
- `npm run build` 성공을 확인했습니다.
- `mvn test` 성공을 확인했습니다. 총 91개 테스트가 통과했습니다.

## 관리자 화면 테스트 결과

- Agora 운영진 공지 DB/API 연동 후 관리자 화면 테스트 성공을 확인했습니다.
- 관리자 페이지에서 `Agora 공지` 메뉴가 정상 표시됩니다.
- 관리자 또는 운영진 권한으로 Agora 공지를 등록할 수 있습니다.
- 등록한 공지가 `/me/agora` 운영진 말풍선과 공지 패널에 정상 표시됩니다.
- 최신 visible 공지가 운영진 말풍선에 표시됩니다.
- 공지 목록은 최신순으로 표시됩니다.
- 관리자 페이지에서 Agora 공지를 수정할 수 있습니다.
- 수정한 공지 내용이 `/me/agora`에 반영됩니다.
- 관리자 페이지에서 Agora 공지를 숨김 처리할 수 있습니다.
- 숨김 처리한 공지는 `/me/agora` 운영진 말풍선과 공지 패널에 표시되지 않습니다.
- 일반 회원은 관리자 Agora 공지 기능에 접근할 수 없습니다.
- 기존 회원 방명록 UI와 미니맵 말풍선 표시는 유지됩니다.
- 기존 My Page, 내 신청 내역, 메시지, 내 설정, 개인정보처리방침, 회원 탈퇴 흐름에는 영향이 없습니다.

## 회원 방명록 DB/API 전환 테스트 결과

- 회원 방명록 DB/API 전환 후 `npm run build` 성공을 확인했습니다.
- 회원 방명록 DB/API 전환 후 `mvn test` 성공을 확인했습니다. 총 88개 테스트가 통과했습니다.
- 로컬 MariaDB 환경에서 Agora 방명록/공지 엔티티 테이블명을 실제 생성 테이블명인 `agora_guestbook_message`, `agora_notice`와 명시적으로 맞췄습니다.
- 등록 실패 원인 추적을 위해 예상 밖 서버 오류가 발생하면 백엔드 로그에 스택트레이스가 남도록 전역 예외 핸들러를 보강했습니다.
- `/me/agora`에서 DB 기반 방명록 메시지를 조회하는 구조로 전환했습니다.
- 로그인 회원만 방명록 메시지를 등록할 수 있도록 `CurrentMemberService` 기반 작성 API를 추가했습니다.
- 비로그인 사용자는 방명록 작성 API를 사용할 수 없는 구조입니다.
- 빈 메시지 또는 공백만 있는 메시지는 서버와 프론트에서 차단합니다.
- 120자 제한은 서버와 프론트에서 유지합니다.
- 메시지 등록 시 서버에서 `createdAt` 기준 7일 뒤 `expiresAt`을 생성합니다.
- 만료된 메시지는 `/me/agora` 표시 API에서 제외됩니다.
- `hiddenByAdmin=true` 메시지는 `/me/agora` 표시 API에서 제외됩니다.
- 관리자 페이지에서 `Agora 방명록` 메뉴와 방명록 메시지 목록을 확인할 수 있습니다.
- 관리자 페이지에서 방명록 메시지를 숨김 처리할 수 있습니다.
- 숨김 처리 후 해당 메시지가 `/me/agora` 표시 조건에서 제외되는 구조입니다.
- 숨김 해제 기능을 제공하며, 메시지가 visible이고 만료되지 않았다면 다시 표시될 수 있습니다.
- 기존 운영진 공지 등록/수정/숨김 기능은 변경하지 않았습니다.
- 기존 My Page 관련 기능에는 영향이 없습니다.

## 강습 신청 회원 아바타 테스트 결과

- 강습 신청 회원 아바타 추가 후 `npm run build` 성공을 확인했습니다.
- 강습 신청 회원 아바타 추가 후 `mvn test` 성공을 확인했습니다. 총 91개 테스트가 통과했습니다.
- `/me/agora`에서 강습 신청 회원 아바타를 조회하는 `GET /api/agora/participant-avatars` API를 추가했습니다.
- 로컬 실행 환경에서 `GET /api/agora/participant-avatars` 직접 호출이 성공했고, 현재 테스트 DB 기준 표시 대상 신청 회원이 없어 `avatars: []`, `additionalCount: 0` 응답을 확인했습니다.
- 응답에는 닉네임, 이니셜, 역할, 공개 수업/이벤트 제목, 위치 그룹만 포함하고 이메일, 실명, 연락처, 신청 메모는 포함하지 않습니다.
- active 신청, active 회원, published 및 종료되지 않은 이벤트/레슨 기준으로 표시합니다.
- 동일 회원이 여러 강습에 신청한 경우 한 번만 표시합니다.
- 최대 12명까지만 아바타로 표시하고 초과 인원은 `+N more`로 표시합니다.
- 신청 회원 아바타는 방명록 말풍선 아바타와 다르게 말풍선 없이 작은 캐릭터/닉네임 태그 형태로 표시됩니다.
- 모바일에서는 절대 좌표 배치 대신 작은 그리드 형태로 전환되어 겹침을 줄입니다.
- 기존 운영진 공지 기능은 변경하지 않았습니다.
- 기존 방명록 작성/조회/숨김 기능은 변경하지 않았습니다.
- 기존 My Page 관련 기능에는 영향이 없습니다.

## 현재 상태

- Swingpop Agora 1차 기능 구현 완료
- 로그인 상태 기능 테스트 성공
- 관리자 화면 Agora 공지 등록/수정/숨김 테스트 성공
- 현재 운영진 공지는 DB/API 기반
- 현재 회원 방명록은 DB/API 기반
- 현재 강습 신청 회원 아바타는 기존 신청 데이터 기반 API로 표시
- 기존 My Page, 내 신청 내역, 메시지, 내 설정, 개인정보처리방침, 회원 탈퇴 흐름 영향 없음

## 추후 작업 후보

- 회원 방명록 운영 QA와 초기 운영 정책 정리
- 2D 맵 디자인 고도화
- 운영진 공지 운영 QA와 초기 운영 데이터 입력

## 기존 기능 영향 확인

- 관리자, 회원 설정, 내 신청 내역, 메시지, 개인정보처리방침, 회원 탈퇴 관련 API 호출은 수정하지 않았습니다.
- My Page의 기존 메뉴 액션과 unread count 계산은 유지하고, Agora 진입 액션만 추가했습니다.
- 실제 운영진 캐릭터, 말풍선, 공지 패널, BGM은 `/me/agora` 화면에서만 렌더링됩니다.
- 회원 방명록 UI와 2D 미니맵 배치 구조는 유지하고, 데이터 조회/등록만 DB/API 기반으로 전환했습니다.
- 신청 회원 아바타는 `/me/agora` 화면에만 추가했고, 기존 내 신청 내역/메시지/설정/회원 탈퇴 흐름은 수정하지 않았습니다.
- 새 라이브러리를 추가하지 않아 package.json과 lockfile 변경은 없습니다.
