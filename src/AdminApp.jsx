import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import AdminCorkboardPanel from "./AdminCorkboardPanel";
import { adminApi } from "./api/admin";
import EventManagementPanel, {
  LessonBoardPanel,
  MessageTemplatePanel,
  TeacherDashboardPanel,
} from "./EventManagementPanel";
import KnowledgeBasePanel from "./KnowledgeBasePanel";
import MemberNameLabel from "./MemberNameLabel";
import {
  getExistingSubscription,
  isPushSupported,
  subscribeThisDevice,
  unsubscribeThisDevice,
} from "./pushNotifications";
import OperationCheckPanel, { OperationCheckMineList, OperationCheckQuickInput } from "./OperationCheckPanel";

const TOKEN_STORAGE_KEY = "swingpop-admin-token";
// A local UI preference, so it lives in the browser rather than the account —
// admin-scoped so it never touches the public site's theme.
const THEME_STORAGE_KEY = "swingpop-admin-theme";
const THEMES = ["light", "dark"];

const LANGUAGES = ["Kor", "Eng"];
const HIDDEN_ADMIN_MENUS = new Set(["TEACHER_USERS"]);
const MEMBER_ACTION_TYPES = ["LESSON_APPLICATION_REMOVED", "MEMBER_SUSPENDED", "MEMBER_REACTIVATED"];

const I18N = {
  Kor: {
    brand: "SwingPop Admin",
    checkingSession: "관리자 세션 확인 중",
    menus: {
      DASHBOARD: "관리자 홈",
      OPERATION_CHECK: "운영 체크",
      EVENT_VIEW: "강습조회",
      EVENT_REGISTRATION: "이벤트/강습 등록",
      CORKBOARD: "담벼락",
      MEMBER_MESSAGES: "회원 메시지",
      MEMBER_ACTION_LOGS: "수강생 처리 로그",
      KNOWLEDGE_BASE: "메뉴얼 저장소",
      KNOWLEDGE_BASE_REGISTRATION: "메뉴얼 저장소",
      MESSAGE_TEMPLATE_VIEW: "메시지 템플릿",
      MESSAGE_TEMPLATE_REGISTRATION: "메시지 템플릿 등록",
      ADMIN_USERS: "관리자 계정",
      MEMBERS: "회원 관리",
      TEACHER_USERS: "강사 프로필 관리",
      MY_ACCOUNT: "내 정보",
    },
    menuCategories: {
      OPERATIONS: "운영진",
      CLASSES: "수업관리",
      SYSTEM: "설정",
    },
    home: "관리자 홈",
    roles: {
      // Zero-width space: invisible, but it is the one place the badge is
      // allowed to wrap, so a narrow column yields 수퍼 / 관리자 rather than
      // 수퍼관 / 리자. Paired with `break-keep` in RoleBadge.
      SUPER_ADMIN: "수퍼​관리자",
      STAFF: "동호회 운영진",
      TEACHER: "강사",
    },
    statuses: {
      Y: "사용",
      N: "비활성",
    },
    memberStatuses: {
      ALL: "전체",
      ACTIVE: "활성 회원",
      WITHDRAWN: "탈퇴 회원",
      SUSPENDED: "비활성 회원",
    },
    memberLanguages: {
      ALL: "전체",
      KO: "KO",
      EN: "EN",
    },
    languages: {
      label: "언어",
      Kor: "한국어",
      Eng: "English",
    },
    login: {
      title: "관리자 로그인",
      loginId: "아이디",
      password: "비밀번호",
      submit: "로그인",
      submitting: "로그인 중",
    },
    common: {
      cancel: "취소",
      create: "등록",
      edit: "수정",
      save: "수정 완료",
      saving: "저장 중",
      delete: "삭제",
      deactivate: "비활성화",
      logout: "로그아웃",
      showFilters: "검색 조건",
      hideFilters: "검색 조건 닫기",
      showForm: "입력 열기",
      hideForm: "입력 닫기",
      buildVersion: "빌드 버전",
      loading: "불러오는 중",
      count: (count) => `${count}개`,
      empty: "-",
    },
    myAccount: {
      openButton: "내 정보",
      panelTitle: "내 정보",
      panelSubtitle: "계정 아이디와 비밀번호, 표시 언어를 관리합니다.",
      title: "비밀번호 변경",
      requiredTitle: "비밀번호를 변경해주세요",
      requiredBody:
        "지금 쓰고 계신 비밀번호는 관리자가 지정해 전달한 것이라 본인만 아는 값이 아닙니다. 새 비밀번호를 정하기 전까지 다른 화면을 이용할 수 없습니다.",
      currentPassword: "현재 비밀번호",
      newPassword: "새 비밀번호",
      confirmPassword: "새 비밀번호 확인",
      submit: "변경하기",
      submitting: "변경 중",
      hint: "8자 이상, 지금 쓰는 비밀번호와 다르게 정해주세요.",
      mismatch: "새 비밀번호가 서로 다릅니다.",
      tooShort: "새 비밀번호는 8자 이상이어야 합니다.",
      sameAsCurrent: "현재 비밀번호와 다른 값으로 정해주세요.",
      success: "비밀번호를 변경했습니다.",
      // Settings screen
      changeLoginIdAction: "아이디 변경하기",
      changeLoginIdDesc: "로그인에 사용하는 아이디를 바꿉니다.",
      changePasswordAction: "비밀번호 변경하기",
      changePasswordDesc: "로그인 비밀번호를 새로 정합니다.",
      languageAction: "언어 선택",
      languageDesc: "관리자 화면에 표시할 언어를 고릅니다.",
      themeAction: "화면 테마",
      themeDesc: "밝은 화면과 어두운 화면 중에서 고릅니다.",
      themeTitle: "화면 테마",
      themeNames: { light: "라이트", dark: "다크" },
      // Captions for the current value shown on each change button.
      currentValueLabels: { language: "현재 언어", theme: "현재 테마" },
      notifications: {
        action: "알림 설정",
        actionDesc: "이벤트별 푸시 알림을 켜고 끕니다.",
        title: "알림 설정",
        device: "이 기기에서 푸시 알림 받기",
        deviceHint: "알림은 기기마다 따로 켜야 합니다.",
        deviceFirst: "먼저 [이 기기에서 푸시 알림 받기]를 켜주세요.",
        unsupported: "이 브라우저는 푸시 알림을 지원하지 않습니다.",
        permissionDenied: "브라우저 알림이 차단되어 있습니다. 브라우저 설정에서 허용해주세요.",
        notConfigured: "서버에 푸시 알림이 설정되어 있지 않습니다.",
        needsInstall: "홈 화면에 설치했거나 알림을 지원하는 브라우저에서 사용해주세요.",
        saveError: "설정을 저장하지 못했습니다.",
        teacherSection: "강사 알림",
        staffSection: "운영진 알림",
        quietSection: "방해금지",
        quietTitle: "방해금지 모드",
        quietDesc: "밤 10시부터 다음날 아침 8시까지 알림을 받지 않습니다.",
        quietZone: (zone) => `기준 시간대: ${zone} · 알림을 켠 기기의 시간대를 따릅니다.`,
        quietWarning:
          "이 시간에 발생한 알림은 보관되지 않고 사라집니다. 아침 8시가 되어도 다시 오지 않으니, 밤사이 내용은 직접 확인해주세요.",
        types: {
          newApplication: { title: "신규 수강신청", desc: "내 수업에 새 수강생이 신청하면 알림" },
          lessonReminder: { title: "강습 전날 알림", desc: "내 수업 전날 저녁에 알림" },
          memberMessage: { title: "회원 메시지", desc: "회원이 홈페이지에서 메시지를 보내면 알림" },
          operationCheckTagged: { title: "운영체크 지정", desc: "운영체크에 내가 지정되면 알림" },
          operationCheckCompleted: { title: "운영체크 완료", desc: "내 운영체크가 완료되면 알림" },
        },
      },
      // Login ID modal
      loginIdTitle: "아이디 변경",
      currentLoginId: "현재 아이디",
      newLoginId: "새 아이디",
      loginIdChecking: "확인 중…",
      loginIdAvailable: "사용 가능한 아이디입니다.",
      loginIdTaken: "이미 사용 중인 아이디입니다.",
      loginIdTooShort: "아이디는 3자 이상이어야 합니다.",
      loginIdSame: "지금 쓰는 아이디와 같습니다.",
      loginIdSubmit: "저장",
      loginIdSubmitting: "저장 중",
      reloginNotice: "저장하면 로그아웃되고 새 아이디로 다시 로그인해야 합니다.",
      passwordReloginNotice: "비밀번호를 바꾸면 다시 로그인해야 합니다.",
      // Language modal
      languageTitle: "언어 선택",
      languageSaving: "변경 중",
    },
    fields: {
      name: "이름",
      loginId: "아이디",
      password: "비밀번호",
      newPassword: "새 비밀번호",
      nickname: "닉네임",
      email: "이메일",
      role: "권한",
      status: "상태",
      language: "표시 언어",
      preferredLanguage: "선호 언어",
      createdAt: "가입일",
      lastLoginAt: "마지막 로그인",
      withdrawnAt: "탈퇴일",
      updatedAt: "수정일",
      actions: "작업",
    },
    knowledgeBase: {
      searchLabel: "검색",
      searchPlaceholder: "카테고리, 제목, 요약, 본문, 태그로 검색",
      categoryFilter: "카테고리",
      allCategories: "전체 카테고리",
      manualLanguage: "매뉴얼 언어",
      translationMissing: "Translation missing",
      resultsTitle: "검색 결과",
      noResults: "검색 결과가 없습니다.",
      selectItem: "왼쪽 목록에서 문서를 선택해주세요.",
      category: "카테고리",
      categoryName: "카테고리명",
      categoryDescription: "설명",
      categoryListTitle: "카테고리 목록",
      title: "제목",
      summary: "요약",
      content: "본문",
      tags: "태그",
      tagsPlaceholder: "쉼표로 구분해 입력",
      status: "상태",
      statuses: {
        DRAFT: "초안",
        PUBLISHED: "게시",
        ARCHIVED: "보관",
      },
      displayOrder: "표시 순서",
      decisionDate: "결정일",
      effectiveFrom: "적용 시작일",
      effectiveTo: "적용 종료일",
      sourceNote: "출처 메모",
      lastUpdated: "마지막 수정일",
      createItemTitle: "문서 등록",
      editItemTitle: "문서 수정",
      createCategoryTitle: "카테고리 등록",
      editCategoryTitle: "카테고리 수정",
      itemCreated: "운영 매뉴얼 문서가 등록되었습니다.",
      itemUpdated: "운영 매뉴얼 문서가 수정되었습니다.",
      itemDeleted: "운영 매뉴얼 문서가 삭제되었습니다.",
      categoryCreated: "카테고리가 등록되었습니다.",
      categoryUpdated: "카테고리가 수정되었습니다.",
      categoryDeleted: "카테고리가 삭제되었습니다.",
      confirmDeleteItem: (title) => `${title} 문서를 삭제할까요?`,
      confirmDeleteCategory: (name) => `${name} 카테고리를 삭제할까요?`,
      openItem: "문서를 눌러 내용을 확인하세요.",
      detailToggleOpen: "상세보기",
      detailToggleClose: "상세 접기",
      detailSectionTitle: "문서 정보",
      close: "닫기",
    },
    dashboard: {
      title: "관리자 홈",
      accessMenus: "접근 메뉴",
    },
    memberMessages: {
      title: "회원 메시지",
      listTitle: "대화방",
      detailTitle: "대화 내역",
      replyPlaceholder: "회원에게 답변을 남겨주세요.",
      reply: "답변 보내기",
      replying: "보내는 중",
      loading: "불러오는 중",
      emptyThreads: "아직 회원 메시지가 없습니다.",
      selectThread: "대화방을 선택해주세요.",
      noMessages: "메시지가 없습니다.",
      sent: "답변이 전송되었습니다.",
      loadError: "메시지를 불러오지 못했습니다.",
      sendError: "답변을 보내지 못했습니다.",
      memberInfo: "회원 정보",
      lastMessage: "마지막 메시지",
      lastMessageAt: "마지막 시간",
      adminSender: "운영진",
      staffSender: (name) => (name ? `운영진 - (${name})` : "운영진"),
      unread: "새 메시지",
    },
    adminUsers: {
      createTitle: "관리자 계정 등록",
      editTitle: "관리자 계정 수정",
      listTitle: "관리자 계정",
      created: "관리자 계정이 등록되었습니다.",
      updated: "관리자 계정이 수정되었습니다.",
      deactivated: "관리자 계정이 비활성화되었습니다.",
      confirmDeactivate: (name) => `${name} 계정을 비활성화할까요?`,
      viewerHint: "계정 생성과 다른 계정 수정·비밀번호 초기화는 수퍼관리자만 가능합니다. 아래 목록에서 본인 계정만 수정할 수 있습니다.",
    },
    adminMembers: {
      filtersTitle: "회원 검색",
      listTitle: "회원 목록",
      keywordSearch: "이름 / 닉네임 / 이메일 검색",
      keywordPlaceholder: "이름, 닉네임, 이메일로 검색",
      nameSearch: "이름 검색",
      namePlaceholder: "표시 이름으로 검색",
      nicknameSearch: "닉네임 검색",
      nicknamePlaceholder: "닉네임으로 검색",
      emailSearch: "이메일 검색",
      emailPlaceholder: "이메일로 검색",
      statusFilter: "회원 상태",
      languageFilter: "선호 언어",
      search: "검색",
      reset: "초기화",
      loading: "불러오는 중",
      empty: "조건에 맞는 회원이 없습니다.",
      loadError: "회원 목록을 불러오지 못했습니다.",
      level1: "Level 1",
      level2: "Level 2",
      level3: "Level 3",
      level4: "Level 4",
      workshop: "워크샵",
      totalApplications: "총 신청 횟수",
      suspend: "비활성화",
      reactivate: "재활성화",
      suspendTitle: "회원 계정을 비활성화할까요?",
      reactivateTitle: "회원 계정을 재활성화할까요?",
      suspendBody: "비활성 회원은 로그인과 일반 회원 기능을 사용할 수 없습니다. 기존 기록은 유지됩니다.",
      reactivateBody: "재활성화하면 회원이 다시 로그인하고 일반 회원 기능을 사용할 수 있습니다.",
      reasonLabel: "사유",
      reasonPlaceholder: "처리 사유를 입력해주세요.",
      reasonRequired: "사유를 입력해주세요.",
      suspended: "회원 계정을 비활성화했습니다.",
      reactivated: "회원 계정을 재활성화했습니다.",
      select: "선택",
      selectAllVisible: "현재 목록 전체 선택",
      showDetails: "상세보기",
      memberColumn: "닉네임(이름)",
      selectedCount: (count) => `선택된 회원 ${count}명`,
      sendMessage: "메시지 보내기",
      sendMessageTitle: "회원에게 메시지 보내기",
      sendMessageDescription: (count) => `선택한 ${count}명의 회원에게 메시지를 보냅니다.`,
      sendMessagePrivacyNote: "각 회원에게 개별 메시지로 전송되며, 다른 수신자는 표시되지 않습니다.",
      activeRecipients: (count) => `발송 가능 대상 ${count}명`,
      excludedRecipients: (count) => `발송 불가 대상 ${count}명`,
      messageLabel: "메시지 내용",
      messagePlaceholder: "회원에게 보낼 메시지를 입력해주세요.",
      messageRequired: "메시지 내용을 입력해주세요.",
      sendingMessage: "보내는 중",
      messageSent: ({ sentCount, skippedCount }) =>
        skippedCount > 0
          ? `${sentCount}명에게 메시지를 보냈습니다. 비활성 또는 탈퇴 회원 ${skippedCount}명은 제외되었습니다.`
          : `${sentCount}명에게 메시지를 보냈습니다.`,
      messageSendError: "메시지를 보내지 못했습니다.",
      previewMore: (count) => `외 ${count}명`,
    },
    memberActionLogs: {
      filtersTitle: "로그 검색",
      listTitle: "수강생 처리 로그",
      from: "시작일",
      to: "종료일",
      action: "처리 동작",
      allActions: "전체",
      search: "검색",
      reset: "초기화",
      loading: "불러오는 중",
      empty: "처리 로그가 없습니다.",
      loadError: "처리 로그를 불러오지 못했습니다.",
      actionAt: "처리 일시",
      actor: "처리자",
      actorRole: "처리자 역할",
      targetMember: "대상 회원",
      targetEmail: "대상 이메일",
      lessonTitle: "수업명",
      lessonDate: "수업 날짜",
      actionType: "처리 동작",
      previousStatus: "처리 전 상태",
      nextStatus: "처리 후 상태",
      summary: "처리 내용",
      reason: "사유",
      noReason: "-",
      actions: {
        LESSON_APPLICATION_REMOVED: "수업 신청 목록에서 제거",
        MEMBER_SUSPENDED: "회원 계정 비활성화",
        MEMBER_REACTIVATED: "회원 계정 재활성화",
      },
    },
    teacherUsers: {
      createTitle: "강사 프로필 등록",
      editTitle: "강사 프로필 수정",
      listTitle: "강사 프로필",
      created: "강사 프로필이 등록되었습니다.",
      updated: "강사 프로필이 수정되었습니다.",
      deactivated: "강사 프로필이 비활성화되었습니다.",
      confirmDeactivate: (name) => `${name} 강사 프로필을 비활성화할까요?`,
    },
  },
  Eng: {
    brand: "SwingPop Admin",
    checkingSession: "Checking admin session",
    menus: {
      DASHBOARD: "Dashboard",
      OPERATION_CHECK: "Operation Check",
      EVENT_VIEW: "Lesson Schedule",
      EVENT_REGISTRATION: "Register Events & Lessons",
      CORKBOARD: "Corkboard",
      MEMBER_MESSAGES: "Member Messages",
      MEMBER_ACTION_LOGS: "Student Action Logs",
      KNOWLEDGE_BASE: "Manual Repository",
      KNOWLEDGE_BASE_REGISTRATION: "Manual Repository",
      MESSAGE_TEMPLATE_VIEW: "Message Templates",
      MESSAGE_TEMPLATE_REGISTRATION: "Register Message Templates",
      ADMIN_USERS: "Admin Accounts",
      MEMBERS: "Member Management",
      TEACHER_USERS: "Teacher Profiles",
      MY_ACCOUNT: "My Account",
    },
    menuCategories: {
      OPERATIONS: "Operations",
      CLASSES: "Classes",
      SYSTEM: "Settings",
    },
    home: "Dashboard",
    roles: {
      SUPER_ADMIN: "Super Admin",
      STAFF: "Staff",
      TEACHER: "Teacher",
    },
    statuses: {
      Y: "Active",
      N: "Inactive",
    },
    memberStatuses: {
      ALL: "All",
      ACTIVE: "Active",
      WITHDRAWN: "Withdrawn",
      SUSPENDED: "Suspended",
    },
    memberLanguages: {
      ALL: "All",
      KO: "KO",
      EN: "EN",
    },
    languages: {
      label: "Language",
      Kor: "Korean",
      Eng: "English",
    },
    login: {
      title: "Admin Login",
      loginId: "Login ID",
      password: "Password",
      submit: "Log In",
      submitting: "Logging in",
    },
    myAccount: {
      openButton: "My Account",
      panelTitle: "My Account",
      panelSubtitle: "Manage your login ID, password, and display language.",
      title: "Change Password",
      requiredTitle: "Choose your own password",
      requiredBody:
        "Your current password was set by an administrator and handed to you, so it is not yours alone. The rest of the admin area stays locked until you replace it.",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmPassword: "Confirm new password",
      submit: "Change password",
      submitting: "Changing",
      hint: "At least 8 characters, and different from the one you have now.",
      mismatch: "The two new passwords do not match.",
      tooShort: "The new password must be at least 8 characters.",
      sameAsCurrent: "Choose something different from your current password.",
      success: "Password changed.",
      // Settings screen
      changeLoginIdAction: "Change login ID",
      changeLoginIdDesc: "Change the ID you sign in with.",
      changePasswordAction: "Change password",
      changePasswordDesc: "Set a new sign-in password.",
      languageAction: "Language",
      languageDesc: "Choose the language for the admin screens.",
      themeAction: "Theme",
      themeDesc: "Choose between a light and a dark screen.",
      themeTitle: "Theme",
      themeNames: { light: "Light", dark: "Dark" },
      currentValueLabels: { language: "Current language", theme: "Current theme" },
      notifications: {
        action: "Notifications",
        actionDesc: "Turn push notifications on or off per event.",
        title: "Notifications",
        device: "Receive push notifications on this device",
        deviceHint: "Notifications must be turned on per device.",
        deviceFirst: "Turn on \"Receive push notifications on this device\" first.",
        unsupported: "This browser does not support push notifications.",
        permissionDenied: "Browser notifications are blocked. Allow them in your browser settings.",
        notConfigured: "Push notifications are not configured on the server.",
        needsInstall: "Use an installed app or a browser that supports notifications.",
        saveError: "Could not save the setting.",
        teacherSection: "Teacher notifications",
        staffSection: "Staff notifications",
        quietSection: "Do not disturb",
        quietTitle: "Do not disturb",
        quietDesc: "No notifications between 10 PM and 8 AM.",
        quietZone: (zone) => `Measured in ${zone} — the time zone of the device you turned notifications on with.`,
        quietWarning:
          "Notifications raised during those hours are dropped, not held. They will not arrive at 8 AM either, so check anything from overnight yourself.",
        types: {
          newApplication: { title: "New application", desc: "When a new student applies to my lesson" },
          lessonReminder: { title: "Lesson reminder", desc: "The evening before my lesson" },
          memberMessage: { title: "Member message", desc: "When a member sends a message from the site" },
          operationCheckTagged: { title: "Operation check tag", desc: "When I am tagged on an operation check" },
          operationCheckCompleted: { title: "Operation check done", desc: "When my operation check is completed" },
        },
      },
      // Login ID modal
      loginIdTitle: "Change Login ID",
      currentLoginId: "Current login ID",
      newLoginId: "New login ID",
      loginIdChecking: "Checking…",
      loginIdAvailable: "This login ID is available.",
      loginIdTaken: "This login ID is already in use.",
      loginIdTooShort: "The login ID must be at least 3 characters.",
      loginIdSame: "This is the same as your current login ID.",
      loginIdSubmit: "Save",
      loginIdSubmitting: "Saving",
      reloginNotice: "Saving signs you out; sign back in with the new login ID.",
      passwordReloginNotice: "Changing your password signs you out and back in.",
      // Language modal
      languageTitle: "Language",
      languageSaving: "Saving",
    },
    common: {
      cancel: "Cancel",
      create: "Create",
      edit: "Edit",
      save: "Save Changes",
      saving: "Saving",
      delete: "Delete",
      deactivate: "Deactivate",
      logout: "Log Out",
      showFilters: "Filters",
      hideFilters: "Hide Filters",
      showForm: "Show Form",
      hideForm: "Hide Form",
      buildVersion: "Build",
      loading: "Loading",
      count: (count) => `${count} items`,
      empty: "-",
    },
    fields: {
      name: "Name",
      loginId: "Login ID",
      password: "Password",
      newPassword: "New Password",
      nickname: "Nickname",
      email: "Email",
      role: "Role",
      status: "Status",
      language: "Display Language",
      preferredLanguage: "Preferred Language",
      createdAt: "Joined",
      lastLoginAt: "Last Login",
      withdrawnAt: "Withdrawn",
      updatedAt: "Updated",
      actions: "Actions",
    },
    knowledgeBase: {
      searchLabel: "Search",
      searchPlaceholder: "Search categories, titles, summaries, content, and tags",
      categoryFilter: "Category",
      allCategories: "All Categories",
      manualLanguage: "Manual Language",
      translationMissing: "Translation missing",
      resultsTitle: "Results",
      noResults: "No matching documents.",
      selectItem: "Select a document from the list.",
      category: "Category",
      categoryName: "Category Name",
      categoryDescription: "Description",
      categoryListTitle: "Categories",
      title: "Title",
      summary: "Summary",
      content: "Content",
      tags: "Tags",
      tagsPlaceholder: "Separate tags with commas",
      status: "Status",
      statuses: {
        DRAFT: "Draft",
        PUBLISHED: "Published",
        ARCHIVED: "Archived",
      },
      displayOrder: "Display Order",
      decisionDate: "Decision Date",
      effectiveFrom: "Effective From",
      effectiveTo: "Effective To",
      sourceNote: "Source Note",
      lastUpdated: "Last Updated",
      createItemTitle: "Create Document",
      editItemTitle: "Edit Document",
      createCategoryTitle: "Create Category",
      editCategoryTitle: "Edit Category",
      itemCreated: "Knowledge base document has been created.",
      itemUpdated: "Knowledge base document has been updated.",
      itemDeleted: "Knowledge base document has been deleted.",
      categoryCreated: "Category has been created.",
      categoryUpdated: "Category has been updated.",
      categoryDeleted: "Category has been deleted.",
      confirmDeleteItem: (title) => `Delete ${title}?`,
      confirmDeleteCategory: (name) => `Delete ${name} category?`,
      openItem: "Select a document to read it.",
      detailToggleOpen: "Details",
      detailToggleClose: "Hide details",
      detailSectionTitle: "Document info",
      close: "Close",
    },
    dashboard: {
      title: "Dashboard",
      accessMenus: "Available Menus",
    },
    memberMessages: {
      title: "Member Messages",
      listTitle: "Threads",
      detailTitle: "Conversation",
      replyPlaceholder: "Write a reply to this member.",
      reply: "Send Reply",
      replying: "Sending",
      loading: "Loading",
      emptyThreads: "No member messages yet.",
      selectThread: "Select a thread.",
      noMessages: "No messages.",
      sent: "Reply sent.",
      loadError: "Could not load messages.",
      sendError: "Could not send reply.",
      memberInfo: "Member Info",
      lastMessage: "Last Message",
      lastMessageAt: "Last Updated",
      adminSender: "Staff",
      staffSender: (name) => (name ? `Staff - (${name})` : "Staff"),
      unread: "Unread",
    },
    adminUsers: {
      createTitle: "Create Admin Account",
      editTitle: "Edit Admin Account",
      listTitle: "Admin Accounts",
      created: "Admin account has been created.",
      updated: "Admin account has been updated.",
      deactivated: "Admin account has been deactivated.",
      confirmDeactivate: (name) => `Deactivate ${name}?`,
      viewerHint: "Only a super administrator can create accounts, edit other accounts, or reset passwords. You can edit only your own account from the list.",
    },
    adminMembers: {
      filtersTitle: "Member Search",
      listTitle: "Members",
      keywordSearch: "Name / Nickname / Email",
      keywordPlaceholder: "Search name, nickname, or email",
      nameSearch: "Name Search",
      namePlaceholder: "Search display name",
      nicknameSearch: "Nickname Search",
      nicknamePlaceholder: "Search nickname",
      emailSearch: "Email Search",
      emailPlaceholder: "Search email",
      statusFilter: "Member Status",
      languageFilter: "Preferred Language",
      search: "Search",
      reset: "Reset",
      loading: "Loading",
      empty: "No members match these filters.",
      loadError: "Could not load members.",
      level1: "Level 1",
      level2: "Level 2",
      level3: "Level 3",
      level4: "Level 4",
      workshop: "Workshop",
      totalApplications: "Total Applications",
      suspend: "Suspend",
      reactivate: "Reactivate",
      suspendTitle: "Suspend this member account?",
      reactivateTitle: "Reactivate this member account?",
      suspendBody: "Suspended members cannot log in or use member features. Existing records are kept.",
      reactivateBody: "Reactivated members can log in and use member features again.",
      reasonLabel: "Reason",
      reasonPlaceholder: "Enter a reason or memo.",
      reasonRequired: "Please enter a reason.",
      suspended: "Member account has been suspended.",
      reactivated: "Member account has been reactivated.",
      select: "Select",
      selectAllVisible: "Select Current List",
      showDetails: "Details",
      memberColumn: "Nickname (Name)",
      selectedCount: (count) => `${count} selected`,
      sendMessage: "Send Message",
      sendMessageTitle: "Send Message To Members",
      sendMessageDescription: (count) => `Send a message to ${count} selected member${count === 1 ? "" : "s"}.`,
      sendMessagePrivacyNote: "Each member receives an individual message. Other recipients are not shown.",
      activeRecipients: (count) => `${count} can receive`,
      excludedRecipients: (count) => `${count} excluded`,
      messageLabel: "Message",
      messagePlaceholder: "Write the message to send to members.",
      messageRequired: "Please enter a message.",
      sendingMessage: "Sending",
      messageSent: ({ sentCount, skippedCount }) =>
        skippedCount > 0
          ? `Sent messages to ${sentCount}. ${skippedCount} inactive or withdrawn member${skippedCount === 1 ? " was" : "s were"} excluded.`
          : `Sent messages to ${sentCount}.`,
      messageSendError: "Could not send messages.",
      previewMore: (count) => `and ${count} more`,
    },
    memberActionLogs: {
      filtersTitle: "Log Search",
      listTitle: "Student Action Logs",
      from: "From",
      to: "To",
      action: "Action",
      allActions: "All",
      search: "Search",
      reset: "Reset",
      loading: "Loading",
      empty: "No action logs.",
      loadError: "Could not load action logs.",
      actionAt: "Processed At",
      actor: "Actor",
      actorRole: "Actor Role",
      targetMember: "Target Member",
      targetEmail: "Target Email",
      lessonTitle: "Lesson",
      lessonDate: "Lesson Date",
      actionType: "Action",
      previousStatus: "Previous Status",
      nextStatus: "Next Status",
      summary: "Summary",
      reason: "Reason",
      noReason: "-",
      actions: {
        LESSON_APPLICATION_REMOVED: "Removed from lesson application list",
        MEMBER_SUSPENDED: "Suspended member account",
        MEMBER_REACTIVATED: "Reactivated member account",
      },
    },
    teacherUsers: {
      createTitle: "Create Teacher Profile",
      editTitle: "Edit Teacher Profile",
      listTitle: "Teacher Profiles",
      created: "Teacher profile has been created.",
      updated: "Teacher profile has been updated.",
      deactivated: "Teacher profile has been deactivated.",
      confirmDeactivate: (name) => `Deactivate ${name}'s teacher profile?`,
    },
  },
};

function getLabels(langCd) {
  return I18N[langCd] || I18N.Kor;
}

function formatDate(value, langCd) {
  if (!value) {
    return getLabels(langCd).common.empty;
  }

  return new Intl.DateTimeFormat(langCd === "Eng" ? "en-US" : "ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

// The action log table carries twelve columns, so its timestamp is split over
// two short lines instead of one wide one. The date half is YYYY-MM-DD in both
// languages: it is the narrowest unambiguous form, and it keeps the column from
// resizing when the language changes.
function formatDateTimeLines(value, langCd) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return {
    date: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date),
    time: new Intl.DateTimeFormat(langCd === "Eng" ? "en-US" : "ko-KR", { timeStyle: "short" }).format(date),
  };
}

// A thread row is one line, so the stamp gets the least room and has to earn
// it: today's threads show the time, older ones the date. A full "2026. 7. 22.
// 오후 5:44" in that spot would leave the preview almost nothing.
function formatThreadTimestamp(value, langCd) {
  if (!value) {
    return getLabels(langCd).common.empty;
  }

  const date = new Date(value);
  const isToday = date.toDateString() === new Date().toDateString();
  if (isToday) {
    return new Intl.DateTimeFormat(langCd === "Eng" ? "en-US" : "ko-KR", { timeStyle: "short" }).format(date);
  }
  return new Intl.DateTimeFormat("en-CA", { month: "2-digit", day: "2-digit" }).format(date);
}

function formatStaffSenderLabel(message, labels) {
  const displayName =
    typeof message?.senderAdminDisplayName === "string" ? message.senderAdminDisplayName.trim() : "";
  return labels.staffSender(displayName);
}

const ROLE_ORDER = ["SUPER_ADMIN", "STAFF", "TEACHER"];

function normalizeRoles(userLike) {
  const roles = Array.isArray(userLike?.roles) && userLike.roles.length > 0 ? userLike.roles : [userLike?.role].filter(Boolean);
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

// Null for an account with no roles, matching the server. There is no
// catch-all role to fall back to.
function primaryRole(userLike) {
  return normalizeRoles(userLike)[0] || null;
}

function hasRole(userLike, role) {
  return normalizeRoles(userLike).includes(role);
}

function hasAnyRole(userLike, roles) {
  return roles.some((role) => hasRole(userLike, role));
}

function filterVisibleMenus(menus = []) {
  return menus.filter((menu) => (
    Object.prototype.hasOwnProperty.call(I18N.Kor.menus, menu) && !HIDDEN_ADMIN_MENUS.has(menu)
  ));
}

// Sidebar grouping. Which menus a given account actually receives is decided by
// the backend (AdminMenu.forRole) — this only says where each one sits once it
// arrives, so a role that never gets a menu simply yields an empty category.
// DASHBOARD is deliberately absent: it is reached through the header home
// button, not a sidebar row.
const MENU_CATEGORIES = [
  { key: "OPERATIONS", menus: ["OPERATION_CHECK", "MEMBER_MESSAGES", "KNOWLEDGE_BASE", "MEMBERS"] },
  { key: "CLASSES", menus: ["EVENT_VIEW", "MESSAGE_TEMPLATE_VIEW"] },
  {
    key: "SYSTEM",
    menus: [
      // Self-service, so it is not a backend-granted menu — it is injected into
      // the visible list for every signed-in admin (see AdminApp visibleMenus).
      "MY_ACCOUNT",
      "CORKBOARD",
      "ADMIN_USERS",
      "EVENT_REGISTRATION",
      "MEMBER_ACTION_LOGS",
      "MESSAGE_TEMPLATE_REGISTRATION",
      "KNOWLEDGE_BASE_REGISTRATION",
    ],
  },
];

function groupMenusByCategory(visibleMenus = []) {
  const available = new Set(visibleMenus);
  const grouped = MENU_CATEGORIES
    .map((category) => ({ ...category, menus: category.menus.filter((menu) => available.has(menu)) }))
    .filter((category) => category.menus.length > 0);

  // Anything the backend sends that no category claims still has to be reachable,
  // or a new menu would silently vanish from the sidebar.
  const claimed = new Set(MENU_CATEGORIES.flatMap((category) => category.menus));
  const unclaimed = visibleMenus.filter((menu) => menu !== "DASHBOARD" && !claimed.has(menu));
  return unclaimed.length > 0 ? [...grouped, { key: null, menus: unclaimed }] : grouped;
}

function createAdminForm() {
  return {
    adminUserNm: "",
    loginId: "",
    password: "",
    role: "STAFF",
    roles: ["STAFF"],
    langCd: "Kor",
    useYn: "Y",
  };
}

function createTeacherForm() {
  return {
    teacherUserNm: "",
    loginId: "",
    password: "",
    langCd: "Kor",
    useYn: "Y",
  };
}

function createMemberFilters() {
  return {
    keyword: "",
    status: "ACTIVE",
    preferredLanguage: "ALL",
  };
}

function toMemberSearchParams(filters) {
  return {
    keyword: filters.keyword.trim(),
    status: filters.status === "ALL" ? "" : filters.status,
    preferredLanguage: filters.preferredLanguage === "ALL" ? "" : filters.preferredLanguage,
  };
}

function createMemberActionLogFilters() {
  return {
    from: "",
    to: "",
    action: "",
  };
}

function toMemberActionLogSearchParams(filters) {
  return {
    from: filters.from,
    to: filters.to,
    action: filters.action,
  };
}

function formatDateRange(startDate, endDate, empty = "-") {
  if (!startDate && !endDate) {
    return empty;
  }
  if (!endDate || startDate === endDate) {
    return startDate || empty;
  }
  return `${startDate} - ${endDate}`;
}

function StatusBadge({ useYn, labels }) {
  const isActive = useYn === "Y";

  return (
    <span
      className={`inline-flex min-w-[72px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? "border-swing-sage bg-swing-sage/40 text-swing-teal-deep"
          : "border-swing-border/30 bg-swing-cream/70 text-swing-muted"
      }`}
    >
      {labels.statuses[useYn] || useYn}
    </span>
  );
}

function MemberStatusBadge({ status, labels }) {
  const isWithdrawn = status === "WITHDRAWN";
  const isSuspended = status === "SUSPENDED";
  const className = isWithdrawn
    ? "border-red-200 bg-red-50 text-red-700"
    : isSuspended
      ? "border-amber-200 bg-amber-50 text-amber-800"
    : "border-swing-sage bg-swing-sage/40 text-swing-teal-deep";

  return (
    <span className={`inline-flex min-w-[72px] items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-semibold sm:min-w-[86px] sm:px-2.5 sm:py-1 sm:text-xs ${className}`}>
      {labels.memberStatuses[status] || status}
    </span>
  );
}

function RoleBadge({ role, labels }) {
  const className =
    role === "SUPER_ADMIN"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : role === "STAFF"
        ? "border-swing-teal/30 bg-swing-teal/10 text-swing-teal-deep"
        : role === "TEACHER"
          ? "border-swing-burgundy/30 bg-swing-burgundy/10 text-swing-burgundy"
          : "border-swing-border/30 bg-swing-cream/50 text-swing-ink/80";

  return (
    // break-keep so a narrow column cannot split the label mid-word: Korean has
    // no spaces here, so the default rule broke 수퍼관리자 into 수퍼관/리자. The
    // only break point left is the zero-width space in the label itself.
    <span className={`inline-flex items-center break-keep rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {labels.roles[role] || role}
    </span>
  );
}

function RoleBadges({ item, labels }) {
  const roles = normalizeRoles(item);

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <RoleBadge key={role} role={role} labels={labels} />
      ))}
    </div>
  );
}

// Timestamps in the wide admin tables get two short lines. Left as one string
// they wrapped wherever the column happened to end — 가입일 came out as three
// lines reading "2026." / "7. 15." / "오후 8:22".
function DateTimeLines({ value, langCd, fallback }) {
  const parts = formatDateTimeLines(value, langCd);
  if (!parts) {
    return fallback;
  }

  return (
    <>
      <div>{parts.date}</div>
      <div className="text-xs">{parts.time}</div>
    </>
  );
}

// One implementation for both navs: the sidebar renders every category at once,
// the phone layout renders one category at a time, but a menu row is the same
// row either way.
function AdminMenuButton({ label, isActive, badgeCount = 0, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
        isActive ? "bg-swing-teal-deep text-swing-paper" : "text-swing-muted hover:bg-swing-cream/60 hover:text-swing-ink"
      }`}
    >
      <span>{label}</span>
      {badgeCount > 0 ? (
        <span
          className={`inline-flex min-w-[22px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold ${
            isActive ? "bg-swing-paper text-swing-teal-deep" : "bg-swing-teal-deep text-swing-paper"
          }`}
        >
          {badgeCount}
        </span>
      ) : null}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-swing-muted">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 text-sm text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="min-h-[42px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 text-sm text-swing-ink outline-none transition focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
    />
  );
}

function Notice({ type = "error", children }) {
  if (!children) {
    return null;
  }

  const className =
    type === "success"
      ? "border-swing-sage bg-swing-sage/40 text-swing-teal-deep"
      : "border-red-200 bg-red-50 text-red-700";

  return <div className={`rounded-lg border px-3 py-2 text-sm leading-6 ${className}`}>{children}</div>;
}

function PrimaryButton(props) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[38px] items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70 ${props.className || ""}`}
    />
  );
}

function SecondaryButton(props) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[38px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-3 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 disabled:cursor-not-allowed disabled:text-swing-muted/45 ${props.className || ""}`}
    />
  );
}

function LanguageOptions({ labels }) {
  return LANGUAGES.map((langCd) => (
    <option key={langCd} value={langCd}>
      {labels.languages[langCd]}
    </option>
  ));
}

function LoginScreen({ onLogin, theme }) {
  const [form, setForm] = useState({ loginId: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginLabels = {
    brand: "SwingPop Admin",
    title: "관리자 로그인 / Admin Login",
    loginId: "아이디 / Login ID",
    password: "비밀번호 / Password",
    submit: "로그인 / Log In",
    submitting: "로그인 중 / Logging in",
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const session = await adminApi.login({
        loginId: form.loginId.trim(),
        password: form.password,
      });
      onLogin(session);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-swing-cream px-5 py-10 text-swing-ink${theme === "dark" ? " dark" : ""}`}>
      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-md items-center">
        <form onSubmit={handleSubmit} className="w-full rounded-lg border border-swing-border/30 bg-swing-paper p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-swing-border/30 pb-5">
            <div>
              <div className="text-sm font-semibold text-swing-teal-deep">{loginLabels.brand}</div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-swing-ink">{loginLabels.title}</h1>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <Field label={loginLabels.loginId}>
              <TextInput
                name="loginId"
                type="text"
                autoComplete="username"
                value={form.loginId}
                onChange={handleChange}
                autoFocus
              />
            </Field>
            <Field label={loginLabels.password}>
              <TextInput
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
              />
            </Field>
          </div>

          <div className="mt-5" aria-live="polite">
            <Notice>{error}</Notice>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
          >
            {isSubmitting ? loginLabels.submitting : loginLabels.submit}
          </button>
        </form>
      </main>
    </div>
  );
}

const MIN_PASSWORD_LENGTH = 8;
// Matches the @Size(min = 3) floor on AdminLoginIdChangeRequest.
const MIN_LOGIN_ID_LENGTH = 3;
// The admin UI languages, in the order the language picker lists them.
const LANGUAGE_OPTIONS = ["Kor", "Eng"];

/**
 * Shared by the modal an admin opens themselves and the screen they are held on
 * until they have set a password of their own. Validates locally only to save a
 * round trip; the same rules are enforced server-side, which is what actually
 * counts.
 */
function PasswordChangeForm({ token, labels, commonLabels, onChanged, onCancel }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(labels.tooShort);
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError(labels.mismatch);
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError(labels.sameAsCurrent);
      return;
    }

    setIsSubmitting(true);
    try {
      const nextSession = await adminApi.changeOwnPassword(token, {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      onChanged(nextSession);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <Field label={labels.currentPassword}>
        <TextInput
          type="password"
          value={form.currentPassword}
          onChange={update("currentPassword")}
          autoComplete="current-password"
          required
        />
      </Field>
      <Field label={labels.newPassword}>
        <TextInput
          type="password"
          value={form.newPassword}
          onChange={update("newPassword")}
          autoComplete="new-password"
          required
        />
      </Field>
      <Field label={labels.confirmPassword}>
        <TextInput
          type="password"
          value={form.confirmPassword}
          onChange={update("confirmPassword")}
          autoComplete="new-password"
          required
        />
      </Field>
      <p className="text-xs leading-5 text-swing-muted">{labels.hint}</p>
      {error ? <Notice type="error">{error}</Notice> : null}
      <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel ? (
          <SecondaryButton type="button" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
            {commonLabels.cancel}
          </SecondaryButton>
        ) : null}
        <PrimaryButton type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? labels.submitting : labels.submit}
        </PrimaryButton>
      </div>
    </form>
  );
}

/**
 * Stands in for the whole admin area rather than overlaying it. An overlay could
 * be removed from the DOM; this way there is nothing rendered behind it to reach.
 */
function PasswordChangeRequiredScreen({ token, labels, commonLabels, theme, onChanged, onLogout }) {
  return (
    <div className={`flex min-h-screen items-center justify-center bg-swing-cream px-4 py-8${theme === "dark" ? " dark" : ""}`}>
      <div className="w-full max-w-md rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-xl">
        <h1 className="text-lg font-bold text-swing-ink">{labels.requiredTitle}</h1>
        <p className="mt-2 text-sm leading-6 text-swing-muted">{labels.requiredBody}</p>
        <div className="mt-5">
          <PasswordChangeForm
            token={token}
            labels={labels}
            commonLabels={commonLabels}
            onChanged={onChanged}
          />
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="mt-4 w-full text-center text-xs font-semibold text-swing-muted underline underline-offset-4 transition hover:text-swing-ink"
        >
          {commonLabels.logout}
        </button>
      </div>
    </div>
  );
}

// Shared overlay used by the account-settings modals. Sits on the same
// end/center-anchored sheet the old MyAccountModal used, so it reads the same on
// a phone.
function AccountModalShell({ title, onClose, commonLabels, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-swing-ink/40 px-3 py-4 sm:items-center sm:px-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-xl sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-swing-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={commonLabels.cancel}
            className="-mr-1 -mt-1 rounded-md p-1 text-swing-muted transition hover:text-swing-ink"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

// New login ID with a live availability check. Save stays disabled until the
// backend confirms the trimmed value is free and actually different from the
// current one; a successful save forces a re-login because the ID it was signed
// in with is gone.
function ChangeLoginIdModal({ token, currentLoginId, labels, commonLabels, onRequireRelogin, onClose }) {
  const [newLoginId, setNewLoginId] = useState("");
  // idle | same | tooShort | checking | available | taken
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = newLoginId.trim();

  useEffect(() => {
    if (trimmed === "") {
      setStatus("idle");
      return undefined;
    }
    if (trimmed === currentLoginId) {
      setStatus("same");
      return undefined;
    }
    if (trimmed.length < MIN_LOGIN_ID_LENGTH) {
      setStatus("tooShort");
      return undefined;
    }

    let cancelled = false;
    setStatus("checking");
    const handle = window.setTimeout(async () => {
      try {
        const result = await adminApi.checkLoginIdAvailable(token, trimmed);
        if (!cancelled) {
          setStatus(result.available ? "available" : "taken");
        }
      } catch {
        // A failed check leaves Save disabled; the save itself re-validates.
        if (!cancelled) {
          setStatus("idle");
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [trimmed, currentLoginId, token]);

  const statusMessage = {
    same: { type: "error", text: labels.loginIdSame },
    tooShort: { type: "error", text: labels.loginIdTooShort },
    checking: { type: "muted", text: labels.loginIdChecking },
    available: { type: "success", text: labels.loginIdAvailable },
    taken: { type: "error", text: labels.loginIdTaken },
  }[status];

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (status !== "available") {
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      await adminApi.changeOwnLoginId(token, { newLoginId: trimmed });
      onRequireRelogin();
    } catch (submitError) {
      // Lost the race — someone took the ID between the check and the save.
      setStatus("taken");
      setError(submitError.message);
      setIsSubmitting(false);
    }
  };

  return (
    <AccountModalShell title={labels.loginIdTitle} onClose={onClose} commonLabels={commonLabels}>
      <form onSubmit={handleSubmit} className="grid gap-3">
        <Field label={labels.currentLoginId}>
          <TextInput value={currentLoginId} disabled readOnly />
        </Field>
        <Field label={labels.newLoginId}>
          <TextInput
            value={newLoginId}
            onChange={(event) => {
              setNewLoginId(event.target.value);
              setError("");
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
        </Field>
        {statusMessage && statusMessage.type === "muted" ? (
          <p className="text-xs font-semibold text-swing-muted">{statusMessage.text}</p>
        ) : null}
        {statusMessage && statusMessage.type !== "muted" ? (
          <Notice type={statusMessage.type}>{statusMessage.text}</Notice>
        ) : null}
        {error ? <Notice type="error">{error}</Notice> : null}
        <p className="text-xs leading-5 text-swing-muted">{labels.reloginNotice}</p>
        <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
            {commonLabels.cancel}
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isSubmitting || status !== "available"} className="w-full sm:w-auto">
            {isSubmitting ? labels.loginIdSubmitting : labels.loginIdSubmit}
          </PrimaryButton>
        </div>
      </form>
    </AccountModalShell>
  );
}

// Password change reuses PasswordChangeForm but, unlike the header modal it
// replaces, forces a re-login on success instead of quietly refreshing the
// session in place.
function ChangePasswordModal({ token, labels, commonLabels, onRequireRelogin, onClose }) {
  return (
    <AccountModalShell title={labels.title} onClose={onClose} commonLabels={commonLabels}>
      <p className="mb-3 text-xs leading-5 text-swing-muted">{labels.passwordReloginNotice}</p>
      <PasswordChangeForm
        token={token}
        labels={labels}
        commonLabels={commonLabels}
        onCancel={onClose}
        onChanged={() => onRequireRelogin()}
      />
    </AccountModalShell>
  );
}

// Language switch is the one settings action that does not force a re-login: it
// updates the account's LANG_CD and the caller swaps langCd in the live session.
function LanguageModal({ token, currentLangCd, labels, commonLabels, languageNames, onLanguageChanged, onClose }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const choose = async (langCd) => {
    if (langCd === currentLangCd || isSaving) {
      onClose();
      return;
    }
    setIsSaving(true);
    setError("");
    try {
      await adminApi.changeOwnLanguage(token, { langCd });
      onLanguageChanged(langCd);
      onClose();
    } catch (submitError) {
      setError(submitError.message);
      setIsSaving(false);
    }
  };

  return (
    <AccountModalShell title={labels.languageTitle} onClose={onClose} commonLabels={commonLabels}>
      {error ? (
        <div className="mb-3">
          <Notice type="error">{error}</Notice>
        </div>
      ) : null}
      <div className="grid gap-2">
        {LANGUAGE_OPTIONS.map((option) => {
          const isCurrent = option === currentLangCd;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(option)}
              disabled={isSaving}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-semibold transition disabled:opacity-60 ${
                isCurrent
                  ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                  : "border-swing-border/55 bg-swing-paper text-swing-ink hover:bg-swing-cream/50"
              }`}
            >
              <span>{languageNames[option]}</span>
              {isCurrent ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m5 12 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </AccountModalShell>
  );
}

// Light/dark theme picker. Purely local — it applies the choice immediately by
// swapping a class on the admin shell, with no backend or re-login.
function ThemeModal({ currentTheme, labels, commonLabels, themeNames, onThemeChanged, onClose }) {
  return (
    <AccountModalShell title={labels.themeTitle} onClose={onClose} commonLabels={commonLabels}>
      <div className="grid gap-2">
        {THEMES.map((option) => {
          const isCurrent = option === currentTheme;
          return (
            <button
              key={option}
              type="button"
              onClick={() => {
                onThemeChanged(option);
                onClose();
              }}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm font-semibold transition ${
                isCurrent
                  ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                  : "border-swing-border/55 bg-swing-paper text-swing-ink hover:bg-swing-cream/50"
              }`}
            >
              <span>{themeNames[option]}</span>
              {isCurrent ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="m5 12 4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>
    </AccountModalShell>
  );
}

// Per-event push notifications. The device master toggle subscribes/unsubscribes
// this browser; the per-type switches persist to the account and are shown only
// for the roles the user holds.
function NotificationSettingsModal({ token, labels, commonLabels, onClose }) {
  const copy = labels.notifications;
  const [settings, setSettings] = useState(null);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // Shown when the locked preferences are clicked; cleared as soon as the
  // device toggle it asks for goes on.
  const [hint, setHint] = useState("");
  const supported = isPushSupported();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [loaded, subscription] = await Promise.all([
          adminApi.getPushSettings(token),
          getExistingSubscription().catch(() => null),
        ]);
        if (!active) {
          return;
        }
        setSettings(loaded);
        setSubscribed(Boolean(subscription));
      } catch {
        if (active) {
          setError(copy.saveError);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [token, copy.saveError]);

  const mapError = (caught) => {
    switch (caught?.message) {
      case "PUSH_UNSUPPORTED":
        return copy.unsupported;
      case "PERMISSION_DENIED":
        return copy.permissionDenied;
      case "PUSH_NOT_CONFIGURED":
        return copy.notConfigured;
      case "NO_SERVICE_WORKER":
        return copy.needsInstall;
      default:
        return copy.saveError;
    }
  };

  const toggleDevice = async () => {
    setBusy(true);
    setError("");
    setHint("");
    try {
      if (subscribed) {
        await unsubscribeThisDevice(token);
        setSubscribed(false);
      } else {
        await subscribeThisDevice(token);
        setSubscribed(true);
      }
    } catch (caught) {
      setError(mapError(caught));
    } finally {
      setBusy(false);
    }
  };

  const toggleType = async (key) => {
    if (!settings) {
      return;
    }
    const next = {
      newApplication: settings.newApplication,
      lessonReminder: settings.lessonReminder,
      memberMessage: settings.memberMessage,
      operationCheckTagged: settings.operationCheckTagged,
      operationCheckCompleted: settings.operationCheckCompleted,
      quietHours: settings.quietHours,
      [key]: !settings[key],
    };
    setSettings((current) => ({ ...current, [key]: !current[key] }));
    setBusy(true);
    setError("");
    try {
      const updated = await adminApi.updatePushSettings(token, next);
      setSettings((current) => ({ ...current, ...updated }));
    } catch {
      setSettings((current) => ({ ...current, [key]: !current[key] }));
      setError(copy.saveError);
    } finally {
      setBusy(false);
    }
  };

  const roles = settings?.roles || [];
  const isTeacher = roles.includes("TEACHER");
  const isStaff = roles.includes("SUPER_ADMIN") || roles.includes("STAFF");

  const typeRow = (key) => (
    <label className="flex items-start justify-between gap-3 rounded-lg border border-swing-border/40 bg-swing-paper px-4 py-3">
      <span>
        <span className="block text-sm font-semibold text-swing-ink">{copy.types[key].title}</span>
        <span className="mt-0.5 block text-xs text-swing-muted">{copy.types[key].desc}</span>
      </span>
      <input
        type="checkbox"
        checked={Boolean(settings?.[key])}
        disabled={busy || !subscribed}
        onChange={() => toggleType(key)}
        className="mt-1 h-5 w-5 shrink-0 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
      />
    </label>
  );

  // Every preference below the device toggle only decides what a subscribed
  // device receives, so without a subscription they decide nothing. They stay
  // visible but fogged, and a click on the fog says what to do instead of
  // silently doing nothing.
  const preferencesLocked = !subscribed;
  const preferenceFog = (children) =>
    preferencesLocked ? (
      <div
        onClick={() => setHint(copy.deviceFirst)}
        className="cursor-not-allowed opacity-45 [&_*]:pointer-events-none"
        aria-disabled="true"
      >
        {children}
      </div>
    ) : (
      children
    );

  return (
    <AccountModalShell title={copy.title} onClose={onClose} commonLabels={commonLabels}>
      {loading ? (
        <div className="py-6 text-center text-sm text-swing-muted">{commonLabels.loading}</div>
      ) : (
        <div className="grid gap-4">
          <div className="rounded-lg border border-swing-border/40 bg-swing-cream/40 p-4">
            <label className="flex items-start justify-between gap-3">
              <span>
                <span className="block text-sm font-semibold text-swing-ink">{copy.device}</span>
                <span className="mt-0.5 block text-xs text-swing-muted">{copy.deviceHint}</span>
              </span>
              <input
                type="checkbox"
                checked={subscribed}
                disabled={busy || !supported}
                onChange={toggleDevice}
                className="mt-1 h-5 w-5 shrink-0 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
              />
            </label>
            {!supported ? <p className="mt-2 text-xs text-swing-muted">{copy.unsupported}</p> : null}
            {settings && !settings.pushConfigured ? (
              <p className="mt-2 text-xs text-swing-muted">{copy.notConfigured}</p>
            ) : null}
          </div>

          {error ? <Notice type="error">{error}</Notice> : null}
          {hint && !error ? (
            <p className="rounded-lg border border-swing-teal/30 bg-swing-teal/10 px-3 py-2 text-sm leading-6 text-swing-teal-deep">
              {hint}
            </p>
          ) : null}

          {/* Applies across every type below, so it sits above them. The warning
              is always visible rather than only once it is switched on: what it
              costs — notifications that never arrive at all — is the thing to
              know *before* turning it on. */}
          {preferenceFog(
            <div className="grid gap-2">
              <div className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-swing-muted/70">
                {copy.quietSection}
              </div>
              <label className="flex items-start justify-between gap-3 rounded-lg border border-swing-border/40 bg-swing-paper px-4 py-3">
                <span>
                  <span className="block text-sm font-semibold text-swing-ink">{copy.quietTitle}</span>
                  <span className="mt-0.5 block text-xs text-swing-muted">{copy.quietDesc}</span>
                  {settings?.quietHoursZone ? (
                    <span className="mt-1 block text-xs text-swing-muted/80">
                      {copy.quietZone(settings.quietHoursZone)}
                    </span>
                  ) : null}
                  <span className="mt-2 block text-xs leading-5 text-swing-muted/90">{copy.quietWarning}</span>
                </span>
                <input
                  type="checkbox"
                  checked={Boolean(settings?.quietHours)}
                  disabled={busy || !subscribed}
                  onChange={() => toggleType("quietHours")}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
                />
              </label>
            </div>
          )}

          {isTeacher
            ? preferenceFog(
                <div className="grid gap-2">
                  <div className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-swing-muted/70">
                    {copy.teacherSection}
                  </div>
                  {typeRow("newApplication")}
                  {typeRow("lessonReminder")}
                </div>
              )
            : null}
          {isStaff
            ? preferenceFog(
                <div className="grid gap-2">
                  <div className="px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-swing-muted/70">
                    {copy.staffSection}
                  </div>
                  {typeRow("memberMessage")}
                  {typeRow("operationCheckTagged")}
                  {typeRow("operationCheckCompleted")}
                </div>
              )
            : null}
        </div>
      )}
    </AccountModalShell>
  );
}

// The 내 정보 (설정) menu content: an account summary plus the self-service
// actions, each opening one of the modals above.
function AccountSettingsPanel({ token, session, labels, theme, onThemeChanged, onRequireRelogin, onLanguageChanged, onLogout }) {
  const copy = labels.myAccount;
  // null | loginId | password | language | theme
  const [openModal, setOpenModal] = useState(null);
  const user = session.user;

  // The current value rides on the button that changes it, captioned with what
  // it is. It used to be repeated in a summary tile above as well, which said
  // the same thing twice and left the reader looking for the difference.
  const actions = [
    {
      key: "loginId",
      title: copy.changeLoginIdAction,
      desc: copy.changeLoginIdDesc,
      valueLabel: labels.fields.loginId,
      value: user.loginId,
    },
    { key: "password", title: copy.changePasswordAction, desc: copy.changePasswordDesc },
    {
      key: "language",
      title: copy.languageAction,
      desc: copy.languageDesc,
      valueLabel: copy.currentValueLabels.language,
      value: labels.languages[user.langCd] || user.langCd,
    },
    {
      key: "theme",
      title: copy.themeAction,
      desc: copy.themeDesc,
      valueLabel: copy.currentValueLabels.theme,
      value: copy.themeNames[theme] || theme,
    },
    {
      key: "notifications",
      title: copy.notifications.action,
      desc: copy.notifications.actionDesc,
    },
  ];

  return (
    <section className="grid gap-5">
      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-swing-border/30 pb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-swing-ink">{copy.panelTitle}</h2>
            <p className="mt-2 text-sm text-swing-muted">{copy.panelSubtitle}</p>
          </div>
          <RoleBadges item={user} labels={labels} />
        </div>

        {/* Only 이름 is left here: 아이디 and 표시 언어 now sit on the buttons
            that change them. */}
        <dl className="mt-5">
          <div className="rounded-lg border border-swing-border/30 bg-swing-cream/50 p-4">
            <dt className="text-xs font-semibold text-swing-muted">{labels.fields.name}</dt>
            <dd className="mt-1 text-sm font-semibold text-swing-ink">{user.userNm}</dd>
          </div>
        </dl>

        <div className="mt-5 grid gap-2">
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => setOpenModal(action.key)}
              className="flex items-center justify-between gap-3 rounded-lg border border-swing-border/55 bg-swing-paper px-4 py-3 text-left transition hover:bg-swing-cream/50"
            >
              <span>
                <span className="block text-sm font-semibold text-swing-ink">{action.title}</span>
                <span className="mt-0.5 block text-xs text-swing-muted">{action.desc}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 text-swing-muted">
                {action.value ? (
                  <span className="text-right">
                    <span className="block text-[11px] text-swing-muted/80">{action.valueLabel}</span>
                    <span className="block text-xs font-semibold text-swing-ink/70">{action.value}</span>
                  </span>
                ) : null}
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Logout lives at the foot of the account screen rather than the header:
          it is a rare, deliberate action, so it sits below the settings as a
          small, quiet button. */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onLogout}
          className="rounded-lg border border-swing-border/55 bg-swing-paper px-4 py-2 text-xs font-semibold text-swing-muted transition hover:bg-swing-cream/50 hover:text-swing-ink"
        >
          {labels.common.logout}
        </button>
      </div>

      {openModal === "loginId" ? (
        <ChangeLoginIdModal
          token={token}
          currentLoginId={user.loginId}
          labels={copy}
          commonLabels={labels.common}
          onRequireRelogin={onRequireRelogin}
          onClose={() => setOpenModal(null)}
        />
      ) : null}
      {openModal === "password" ? (
        <ChangePasswordModal
          token={token}
          labels={copy}
          commonLabels={labels.common}
          onRequireRelogin={onRequireRelogin}
          onClose={() => setOpenModal(null)}
        />
      ) : null}
      {openModal === "language" ? (
        <LanguageModal
          token={token}
          currentLangCd={user.langCd}
          labels={copy}
          commonLabels={labels.common}
          languageNames={labels.languages}
          onLanguageChanged={onLanguageChanged}
          onClose={() => setOpenModal(null)}
        />
      ) : null}
      {openModal === "theme" ? (
        <ThemeModal
          currentTheme={theme}
          labels={copy}
          commonLabels={labels.common}
          themeNames={copy.themeNames}
          onThemeChanged={onThemeChanged}
          onClose={() => setOpenModal(null)}
        />
      ) : null}
      {openModal === "notifications" ? (
        <NotificationSettingsModal
          token={token}
          labels={copy}
          commonLabels={labels.common}
          onClose={() => setOpenModal(null)}
        />
      ) : null}
    </section>
  );
}

function AdminUsersPanel({ token, currentUser, langCd, labels }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => ({ ...createAdminForm(), langCd }));
  const [editingId, setEditingId] = useState(null);
  // Collapsed on arrival so the account list is what you land on. Editing a row
  // opens it, otherwise the edit button would look like it did nothing.
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isEditing = editingId !== null;
  const canManageSuperAdmin = hasRole(currentUser, "SUPER_ADMIN");
  // Non-super admins (STAFF) view the list but may edit only their own account;
  // creating accounts, editing others, and resetting passwords are super-admin only.
  const currentUserKey = currentUser?.userId || currentUser?.userCd;
  const isSelf = (item) => (item?.userId || item?.adminUserCd) === currentUserKey;
  const restrictedEditor = isEditing && !canManageSuperAdmin;

  const roleOptions = useMemo(() => {
    if (canManageSuperAdmin || form.roles.includes("SUPER_ADMIN")) {
      return ROLE_ORDER;
    }
    return ["STAFF", "TEACHER"];
  }, [canManageSuperAdmin, form.roles]);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setItems(await adminApi.findAdmins(token));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...createAdminForm(), langCd });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleRoleToggle = (role) => {
    setForm((currentForm) => {
      const nextRoles = currentForm.roles.includes(role)
        ? currentForm.roles.filter((currentRole) => currentRole !== role)
        : [...currentForm.roles, role];
      const normalizedRoles = normalizeRoles({ roles: nextRoles }).filter(
        (nextRole) => canManageSuperAdmin || nextRole !== "SUPER_ADMIN",
      );
      const safeRoles = normalizedRoles.length > 0 ? normalizedRoles : ["STAFF"];
      return {
        ...currentForm,
        role: primaryRole({ roles: safeRoles }),
        roles: safeRoles,
      };
    });
  };

  const handleEdit = (item) => {
    setEditingId(item.adminUserCd);
    setShowForm(true);
    const roles = normalizeRoles(item);
    setForm({
      adminUserNm: item.adminUserNm,
      loginId: item.loginId,
      password: "",
      role: primaryRole(item),
      roles,
      langCd: item.langCd || "Kor",
      useYn: item.useYn,
    });
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    const payload = {
      adminUserNm: form.adminUserNm.trim(),
      loginId: form.loginId.trim(),
      password: form.password.trim() || null,
      role: primaryRole(form),
      roles: form.roles,
      langCd: form.langCd,
      useYn: form.useYn,
    };

    try {
      if (isEditing) {
        await adminApi.updateAdmin(token, editingId, payload);
        setNotice(labels.adminUsers.updated);
      } else {
        await adminApi.createAdmin(token, {
          adminUserNm: payload.adminUserNm,
          loginId: payload.loginId,
          password: form.password,
          role: payload.role,
          roles: payload.roles,
          langCd: payload.langCd,
        });
        setNotice(labels.adminUsers.created);
      }
      resetForm();
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (item) => {
    if (!window.confirm(labels.adminUsers.confirmDeactivate(item.adminUserNm))) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await adminApi.deactivateAdmin(token, item.adminUserCd);
      setNotice(labels.adminUsers.deactivated);
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    // min-w-0 on the grid items: without it a grid child keeps its content's
    // intrinsic width, so the 860px account table below refuses to shrink and
    // pushes the whole page wider than a phone screen instead of scrolling
    // inside its own container.
    // items-start for the same reason as the log panel: otherwise the form
    // column stretches to the height of the account table beside it.
    <section className="grid min-w-0 items-start gap-5 [&>*]:min-w-0 xl:grid-cols-[390px_minmax(0,1fr)]">
      {canManageSuperAdmin || isEditing ? (
      <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm">
        {/* Collapsed, this card is just its title row, so the divider and the
            padding under it would frame nothing but empty space. */}
        <div
          className={`flex items-center justify-between gap-3 ${
            showForm ? "border-b border-swing-border/30 pb-3" : ""
          }`}
        >
          <h2 className="text-lg font-bold text-swing-ink">
            {isEditing ? labels.adminUsers.editTitle : labels.adminUsers.createTitle}
          </h2>
          <div className="flex items-center gap-3">
            {isEditing ? (
              <button type="button" onClick={resetForm} className="text-sm font-semibold text-swing-muted hover:text-swing-ink">
                {labels.common.cancel}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShowForm((current) => !current)}
              className="text-sm font-semibold text-swing-muted hover:text-swing-ink"
            >
              {showForm ? labels.common.hideForm : labels.common.showForm}
            </button>
          </div>
        </div>

        {/* Hidden rather than unmounted so a half-typed entry survives a collapse.
            The short single-line fields pair up two to a row: one per row left the
            form taller than a phone screen for what is a handful of short values.
            Role keeps a row of its own because it is a checkbox list. */}
        <div className={`mt-3 grid gap-3 ${showForm ? "" : "hidden"}`}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={labels.fields.name}>
              <TextInput name="adminUserNm" value={form.adminUserNm} onChange={handleChange} />
            </Field>
            <Field label={labels.fields.loginId}>
              <TextInput name="loginId" value={form.loginId} onChange={handleChange} />
            </Field>
            <Field label={isEditing ? labels.fields.newPassword : labels.fields.password}>
              <TextInput
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Field>
            <Field label={labels.fields.language}>
              <SelectInput name="langCd" value={form.langCd} onChange={handleChange}>
                <LanguageOptions labels={labels} />
              </SelectInput>
            </Field>
            {isEditing ? (
              <Field label={labels.fields.status}>
                <SelectInput name="useYn" value={form.useYn} onChange={handleChange}>
                  <option value="Y">{labels.statuses.Y}</option>
                  <option value="N">{labels.statuses.N}</option>
                </SelectInput>
              </Field>
            ) : null}
          </div>
          <Field label={labels.fields.role}>
            <div className="grid grid-cols-2 gap-2 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3">
              {roleOptions.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm font-semibold text-swing-ink/80">
                  <input
                    type="checkbox"
                    checked={form.roles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    disabled={restrictedEditor || (!canManageSuperAdmin && role === "SUPER_ADMIN")}
                    className="h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
                  />
                  {labels.roles[role]}
                </label>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-5 grid gap-2" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={`mt-5 min-h-[42px] w-full items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70 ${
            showForm ? "inline-flex" : "hidden"
          }`}
        >
          {isSaving ? labels.common.saving : isEditing ? labels.common.save : labels.common.create}
        </button>
      </form>
      ) : (
        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          <h2 className="text-lg font-bold text-swing-ink">{labels.adminUsers.listTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-swing-muted">{labels.adminUsers.viewerHint}</p>
        </div>
      )}

      <AccountTable
        title={labels.adminUsers.listTitle}
        isLoading={isLoading}
        items={items}
        labels={labels}
        langCd={langCd}
        getKey={(item) => item.adminUserCd}
        getName={(item) => item.adminUserNm}
        getCode={(item) => item.adminUserCd}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        canEdit={(item) => canManageSuperAdmin || isSelf(item)}
        canDeactivate={(item) =>
          canManageSuperAdmin &&
          !isSelf(item) &&
          item.useYn !== "N"
        }
      />
    </section>
  );
}

function TeacherUsersPanel({ token, langCd, labels }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(() => ({ ...createTeacherForm(), langCd }));
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isEditing = editingId !== null;

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setItems(await adminApi.findTeachers(token));
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...createTeacherForm(), langCd });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleEdit = (item) => {
    setEditingId(item.teacherUserCd);
    setForm({
      teacherUserNm: item.teacherUserNm,
      loginId: item.loginId,
      password: "",
      langCd: item.langCd || "Kor",
      useYn: item.useYn,
    });
    setError("");
    setNotice("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    const payload = {
      teacherUserNm: form.teacherUserNm.trim(),
      loginId: form.loginId.trim(),
      password: form.password.trim() || null,
      langCd: form.langCd,
      useYn: form.useYn,
    };

    try {
      if (isEditing) {
        await adminApi.updateTeacher(token, editingId, payload);
        setNotice(labels.teacherUsers.updated);
      } else {
        await adminApi.createTeacher(token, {
          teacherUserNm: payload.teacherUserNm,
          loginId: payload.loginId,
          password: form.password,
          langCd: payload.langCd,
        });
        setNotice(labels.teacherUsers.created);
      }
      resetForm();
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (item) => {
    if (!window.confirm(labels.teacherUsers.confirmDeactivate(item.teacherUserNm))) {
      return;
    }

    setError("");
    setNotice("");

    try {
      await adminApi.deactivateTeacher(token, item.teacherUserCd);
      setNotice(labels.teacherUsers.deactivated);
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    // Same min-w-0 as the admin panel: the account table below is 860px wide
    // and would otherwise stretch the page rather than scroll inside its box.
    <section className="grid min-w-0 gap-5 [&>*]:min-w-0 xl:grid-cols-[390px_minmax(0,1fr)]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">
            {isEditing ? labels.teacherUsers.editTitle : labels.teacherUsers.createTitle}
          </h2>
          {isEditing ? (
            <button type="button" onClick={resetForm} className="text-sm font-semibold text-swing-muted hover:text-swing-ink">
              {labels.common.cancel}
            </button>
          ) : null}
        </div>

        {/* Two to a row, matching the admin account form: these are all short
            single-line values and one per row made the form needlessly tall. */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Field label={labels.fields.name}>
            <TextInput name="teacherUserNm" value={form.teacherUserNm} onChange={handleChange} />
          </Field>
          <Field label={labels.fields.loginId}>
            <TextInput name="loginId" value={form.loginId} onChange={handleChange} />
          </Field>
          <Field label={isEditing ? labels.fields.newPassword : labels.fields.password}>
            <TextInput
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
          </Field>
          <Field label={labels.fields.language}>
            <SelectInput name="langCd" value={form.langCd} onChange={handleChange}>
              <LanguageOptions labels={labels} />
            </SelectInput>
          </Field>
          {isEditing ? (
            <Field label={labels.fields.status}>
              <SelectInput name="useYn" value={form.useYn} onChange={handleChange}>
                <option value="Y">{labels.statuses.Y}</option>
                <option value="N">{labels.statuses.N}</option>
              </SelectInput>
            </Field>
          ) : null}
        </div>

        <div className="mt-5 grid gap-2" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70"
        >
          {isSaving ? labels.common.saving : isEditing ? labels.common.save : labels.common.create}
        </button>
      </form>

      <AccountTable
        title={labels.teacherUsers.listTitle}
        isLoading={isLoading}
        items={items}
        labels={labels}
        langCd={langCd}
        getKey={(item) => item.teacherUserCd}
        getName={(item) => item.teacherUserNm}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
        canEdit={() => true}
        canDeactivate={(item) => item.useYn !== "N"}
      />
    </section>
  );
}

function AccountTable({
  title,
  isLoading,
  items,
  labels,
  langCd,
  getKey,
  getName,
  onEdit,
  onDeactivate,
  canEdit,
  canDeactivate,
}) {
  return (
    <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
        <h2 className="text-lg font-bold text-swing-ink">{title}</h2>
        <span className="text-sm text-swing-muted">{isLoading ? labels.common.loading : labels.common.count(items.length)}</span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[860px] w-full border-separate border-spacing-0 text-left text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase text-swing-muted">
              <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.name}</th>
              <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.loginId}</th>
              <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.role}</th>
              <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.language}</th>
              <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.status}</th>
              <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.updatedAt}</th>
              <th className="border-b border-swing-border/30 px-3 py-2 text-right">{labels.fields.actions}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={getKey(item)} className="align-middle">
                <td className="border-b border-swing-border/20 px-3 py-3 font-semibold text-swing-ink">{getName(item)}</td>
                <td className="border-b border-swing-border/20 px-3 py-3 text-swing-muted">{item.loginId}</td>
                <td className="border-b border-swing-border/20 px-3 py-3">
                  <RoleBadges item={item} labels={labels} />
                </td>
                <td className="border-b border-swing-border/20 px-3 py-3 text-swing-muted">
                  {labels.languages[item.langCd || "Kor"]}
                </td>
                <td className="border-b border-swing-border/20 px-3 py-3">
                  <StatusBadge useYn={item.useYn} labels={labels} />
                </td>
                <td className="border-b border-swing-border/20 px-3 py-3 text-swing-muted">{formatDate(item.modDt, langCd)}</td>
                <td className="border-b border-swing-border/20 px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      disabled={!canEdit(item)}
                      className="rounded-lg border border-swing-border/45 px-3 py-1.5 text-xs font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 disabled:cursor-not-allowed disabled:text-swing-muted/45"
                    >
                      {labels.common.edit}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeactivate(item)}
                      disabled={!canDeactivate(item)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-swing-muted/45"
                    >
                      {labels.common.deactivate}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminMembersPanel({ token, currentUser, langCd, labels }) {
  const [filters, setFilters] = useState(() => createMemberFilters());
  // Collapsed by default, matching the events screen: the list is what people
  // come here for, and the filters push it off a phone screen.
  const [showFilters, setShowFilters] = useState(false);
  // Off by default: sixteen columns is a report, and the everyday question at
  // this screen is just "who is this and are they active". The full table is one
  // click away for the times it is the report that is wanted.
  const [showDetails, setShowDetails] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(() => createMemberFilters());
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [statusModal, setStatusModal] = useState(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusReasonError, setStatusReasonError] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageContent, setMessageContent] = useState("");
  const [messageError, setMessageError] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  const memberLabels = labels.adminMembers;
  const canChangeMemberStatus = hasRole(currentUser, "SUPER_ADMIN");
  const selectedMemberIdSet = useMemo(() => new Set(selectedMemberIds), [selectedMemberIds]);
  const selectedMembers = useMemo(
    () => items.filter((member) => selectedMemberIdSet.has(member.memberId)),
    [items, selectedMemberIdSet],
  );
  const selectedActiveCount = selectedMembers.filter((member) => member.memberStatus === "ACTIVE").length;
  const selectedExcludedCount = selectedMembers.length - selectedActiveCount;
  const isAllVisibleSelected =
    items.length > 0 && items.every((member) => selectedMemberIdSet.has(member.memberId));

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      setItems(await adminApi.findMembers(token, toMemberSearchParams(appliedFilters)));
    } catch (nextError) {
      setError(nextError.message || memberLabels.loadError);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters, memberLabels.loadError, token]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    const visibleMemberIds = new Set(items.map((member) => member.memberId));
    setSelectedMemberIds((currentIds) => currentIds.filter((memberId) => visibleMemberIds.has(memberId)));
  }, [items]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((currentFilters) => ({ ...currentFilters, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setNotice("");
    setAppliedFilters(filters);
  };

  const handleReset = () => {
    const nextFilters = createMemberFilters();
    setFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setNotice("");
    setSelectedMemberIds([]);
  };

  const toggleMemberSelection = (memberId) => {
    setSelectedMemberIds((currentIds) =>
      currentIds.includes(memberId)
        ? currentIds.filter((currentId) => currentId !== memberId)
        : [...currentIds, memberId],
    );
    setNotice("");
    setError("");
  };

  const toggleVisibleSelection = () => {
    setSelectedMemberIds((currentIds) => {
      if (isAllVisibleSelected) {
        return currentIds.filter((memberId) => !items.some((member) => member.memberId === memberId));
      }
      const nextIds = new Set(currentIds);
      items.forEach((member) => nextIds.add(member.memberId));
      return Array.from(nextIds);
    });
    setNotice("");
    setError("");
  };

  const openMessageModal = () => {
    if (selectedMemberIds.length === 0) {
      return;
    }
    setIsMessageModalOpen(true);
    setMessageContent("");
    setMessageError("");
    setError("");
    setNotice("");
  };

  const closeMessageModal = () => {
    if (isSendingMessage) {
      return;
    }
    setIsMessageModalOpen(false);
    setMessageContent("");
    setMessageError("");
  };

  const submitMemberMessage = async () => {
    const normalizedContent = messageContent.trim();
    if (!normalizedContent) {
      setMessageError(memberLabels.messageRequired);
      return;
    }

    setIsSendingMessage(true);
    setMessageError("");
    setError("");
    setNotice("");

    try {
      const response = await adminApi.sendMemberMessages(token, {
        memberIds: selectedMemberIds,
        content: normalizedContent,
      });
      setNotice(memberLabels.messageSent(response));
      setSelectedMemberIds([]);
      setIsMessageModalOpen(false);
      setMessageContent("");
      await loadItems();
    } catch (nextError) {
      setMessageError(nextError.message || memberLabels.messageSendError);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const openStatusModal = (type, member) => {
    setStatusModal({ type, member });
    setStatusReason("");
    setStatusReasonError("");
    setError("");
    setNotice("");
  };

  const closeStatusModal = () => {
    if (isChangingStatus) {
      return;
    }
    setStatusModal(null);
    setStatusReason("");
    setStatusReasonError("");
  };

  const submitStatusChange = async () => {
    const reason = statusReason.trim();
    if (!reason) {
      setStatusReasonError(memberLabels.reasonRequired);
      return;
    }

    setIsChangingStatus(true);
    setStatusReasonError("");
    setError("");
    setNotice("");
    try {
      if (statusModal.type === "suspend") {
        await adminApi.suspendMember(token, statusModal.member.memberId, { reason });
        setNotice(memberLabels.suspended);
      } else {
        await adminApi.reactivateMember(token, statusModal.member.memberId, { reason });
        setNotice(memberLabels.reactivated);
      }
      setStatusModal(null);
      setStatusReason("");
      await loadItems();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsChangingStatus(false);
    }
  };

  return (
    // min-w-0 on both the grid and its items, matching the action log panel: the
    // 1180px member table sits inside a card, and that card is the grid item
    // whose automatic minimum size would otherwise hold the table's full width.
    // Without both, the page widened past the viewport instead of the table
    // scrolling inside its own container. content-start keeps the auto rows from
    // absorbing the height the page grid hands this column.
    <section className="grid min-w-0 content-start gap-4 [&>*]:min-w-0 sm:gap-5">
      <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm">
        {/* Collapsed, this card is just its title row, so the divider and the
            padding under it would frame nothing but empty space. */}
        <div
          className={`flex flex-wrap items-center justify-between gap-2 sm:gap-3 ${
            showFilters ? "border-b border-swing-border/30 pb-3" : ""
          }`}
        >
          <h2 className="text-lg font-bold text-swing-ink">{memberLabels.filtersTitle}</h2>
          <div className="flex gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-3 text-xs font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 sm:min-h-[38px] sm:text-sm"
            >
              {showFilters ? labels.common.hideFilters : labels.common.showFilters}
            </button>
            {showFilters ? (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex min-h-[34px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-3 text-xs font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 sm:min-h-[38px] sm:text-sm"
                >
                  {memberLabels.reset}
                </button>
                <button
                  type="submit"
                  className="inline-flex min-h-[34px] items-center justify-center rounded-lg bg-swing-teal-deep px-3 text-xs font-semibold text-swing-paper transition hover:bg-swing-teal sm:min-h-[38px] sm:px-4 sm:text-sm"
                >
                  {memberLabels.search}
                </button>
              </>
            ) : null}
          </div>
        </div>

        <div className={`mt-3 grid gap-2.5 sm:gap-3 ${showFilters ? "" : "hidden"}`}>
          <div className="grid gap-2">
            <Field label={memberLabels.keywordSearch}>
              <TextInput
                name="keyword"
                value={filters.keyword}
                onChange={handleFilterChange}
                placeholder={memberLabels.keywordPlaceholder}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <div className="min-w-0 sm:w-44">
              <Field label={memberLabels.statusFilter}>
                <SelectInput name="status" value={filters.status} onChange={handleFilterChange}>
                  <option value="ALL">{labels.memberStatuses.ALL}</option>
                  <option value="ACTIVE">{labels.memberStatuses.ACTIVE}</option>
                  <option value="SUSPENDED">{labels.memberStatuses.SUSPENDED}</option>
                  <option value="WITHDRAWN">{labels.memberStatuses.WITHDRAWN}</option>
                </SelectInput>
              </Field>
            </div>
            <div className="min-w-0 sm:w-36">
              <Field label={memberLabels.languageFilter}>
                <SelectInput name="preferredLanguage" value={filters.preferredLanguage} onChange={handleFilterChange}>
                  <option value="ALL">{labels.memberLanguages.ALL}</option>
                  <option value="KO">{labels.memberLanguages.KO}</option>
                  <option value="EN">{labels.memberLanguages.EN}</option>
                </SelectInput>
              </Field>
            </div>
          </div>
        </div>
      </form>

      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 border-b border-swing-border/30 pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{memberLabels.listTitle}</h2>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="mr-auto text-xs font-semibold text-swing-muted sm:mr-0 sm:text-sm">
              {memberLabels.selectedCount(selectedMemberIds.length)}
            </span>
            <label className="flex items-center gap-1.5 rounded-lg border border-swing-border/55 bg-swing-paper px-3 py-2 text-xs font-semibold text-swing-ink/80 sm:text-sm">
              <input
                type="checkbox"
                checked={showDetails}
                onChange={() => setShowDetails((current) => !current)}
                className="h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
              />
              {memberLabels.showDetails}
            </label>
            <SecondaryButton type="button" onClick={toggleVisibleSelection} disabled={items.length === 0}>
              {memberLabels.selectAllVisible}
            </SecondaryButton>
            <PrimaryButton type="button" onClick={openMessageModal} disabled={selectedMemberIds.length === 0}>
              {memberLabels.sendMessage}
            </PrimaryButton>
            <span className="text-sm text-swing-muted">
              {isLoading ? memberLabels.loading : labels.common.count(items.length)}
            </span>
          </div>
        </div>

        <div className="mt-4" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>

        {items.length === 0 && !isLoading ? (
          <div className="py-10 text-center text-sm text-swing-muted">{memberLabels.empty}</div>
        ) : (
          <>
            <div className="mt-3 divide-y divide-swing-border/20 md:hidden">
              {items.map((member) => (
                <article key={member.memberId} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedMemberIdSet.has(member.memberId)}
                      onChange={() => toggleMemberSelection(member.memberId)}
                      aria-label={`${memberLabels.select}: ${member.displayName || member.email}`}
                      className="mt-1 h-5 w-5 shrink-0 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <MemberNameLabel
                            name={
                              (showDetails ? member.displayName : member.nickname || member.displayName) ||
                              labels.common.empty
                            }
                            status={member.memberStatus}
                            className="text-sm font-semibold text-swing-ink"
                          />
                          {showDetails ? (
                            <div className="mt-1 truncate text-xs text-swing-muted">
                              {member.nickname || labels.common.empty}
                            </div>
                          ) : member.nickname && member.displayName && member.nickname !== member.displayName ? (
                            <div className="mt-1 truncate text-xs text-swing-muted">({member.displayName})</div>
                          ) : null}
                        </div>
                        <MemberStatusBadge status={member.memberStatus} labels={labels} />
                      </div>
                      {showDetails ? (
                        <div className="mt-2 truncate text-xs text-swing-muted">{member.email}</div>
                      ) : null}
                      <dl
                        className={`mt-3 grid gap-x-3 gap-y-1 text-[11px] leading-5 text-swing-muted ${
                          showDetails ? "grid-cols-2" : "grid-cols-1"
                        }`}
                      >
                        <div className="min-w-0">
                          <dt className="inline font-semibold text-swing-muted">{labels.fields.preferredLanguage}: </dt>
                          <dd className="inline">
                            {labels.memberLanguages[member.preferredLanguage] ||
                              member.preferredLanguage ||
                              labels.common.empty}
                          </dd>
                        </div>
                        {showDetails ? (
                          <>
                            <div className="min-w-0">
                              <dt className="inline font-semibold text-swing-muted">{labels.fields.createdAt}: </dt>
                              <dd className="inline">{formatDate(member.createdAt, langCd)}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="inline font-semibold text-swing-muted">{labels.fields.lastLoginAt}: </dt>
                              <dd className="inline">{formatDate(member.lastLoginAt, langCd)}</dd>
                            </div>
                            <div className="min-w-0">
                              <dt className="inline font-semibold text-swing-muted">{labels.fields.withdrawnAt}: </dt>
                              <dd className="inline">{formatDate(member.withdrawnAt, langCd)}</dd>
                            </div>
                          </>
                        ) : null}
                      </dl>
                      {showDetails ? (
                      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold text-swing-ink/80">
                        <span className="rounded bg-swing-cream/60 px-1.5 py-0.5">{memberLabels.level1} {member.level1ApplicationCount}</span>
                        <span className="rounded bg-swing-cream/60 px-1.5 py-0.5">{memberLabels.level2} {member.level2ApplicationCount}</span>
                        <span className="rounded bg-swing-cream/60 px-1.5 py-0.5">{memberLabels.level3} {member.level3ApplicationCount}</span>
                        <span className="rounded bg-swing-cream/60 px-1.5 py-0.5">{memberLabels.level4} {member.level4ApplicationCount}</span>
                        <span className="rounded bg-swing-cream/60 px-1.5 py-0.5">{memberLabels.workshop} {member.workshopApplicationCount}</span>
                        <span className="rounded bg-swing-teal/10 px-1.5 py-0.5 text-swing-teal-deep">
                          {memberLabels.totalApplications} {member.totalApplicationCount}
                        </span>
                      </div>
                      ) : null}
                      {showDetails &&
                      canChangeMemberStatus &&
                      (member.memberStatus === "ACTIVE" || member.memberStatus === "SUSPENDED") ? (
                        <div className="mt-3 flex justify-end">
                          {member.memberStatus === "ACTIVE" ? (
                            <button
                              type="button"
                              onClick={() => openStatusModal("suspend", member)}
                              className="min-h-[32px] rounded-lg border border-amber-200 px-3 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
                            >
                              {memberLabels.suspend}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openStatusModal("reactivate", member)}
                              className="min-h-[32px] rounded-lg border border-swing-sage px-3 text-xs font-semibold text-swing-teal-deep transition hover:bg-swing-sage/40"
                            >
                              {memberLabels.reactivate}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table
                className={`w-full border-separate border-spacing-0 text-left text-xs lg:text-sm ${
                  showDetails ? "min-w-[1180px]" : ""
                }`}
              >
              {/* whitespace-nowrap for the same reason as the action log table:
                  sixteen columns inside a 1180px floor leave the short-label
                  ones so little width that 닉네임 broke to one character per
                  line. The table scrolls in its own container, so letting the
                  headers set the column width costs nothing. */}
              <thead className="whitespace-nowrap">
                <tr className="text-xs font-semibold uppercase text-swing-muted">
                  <th className="w-12 border-b border-swing-border/30 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={isAllVisibleSelected}
                      onChange={toggleVisibleSelection}
                      disabled={items.length === 0}
                      aria-label={memberLabels.selectAllVisible}
                      className="h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
                    />
                  </th>
                  <th className="border-b border-swing-border/30 px-3 py-2">
                    {showDetails ? labels.fields.name : memberLabels.memberColumn}
                  </th>
                  {showDetails ? (
                    <>
                      <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.nickname}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.email}</th>
                    </>
                  ) : null}
                  <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.status}</th>
                  <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.preferredLanguage}</th>
                  {showDetails ? (
                    <>
                      <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.createdAt}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.lastLoginAt}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2">{labels.fields.withdrawnAt}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2 text-right">{memberLabels.level1}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2 text-right">{memberLabels.level2}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2 text-right">{memberLabels.level3}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2 text-right">{memberLabels.level4}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2 text-right">{memberLabels.workshop}</th>
                      <th className="border-b border-swing-border/30 px-3 py-2 text-right">
                        {memberLabels.totalApplications}
                      </th>
                      <th className="border-b border-swing-border/30 px-3 py-2 text-right">{labels.fields.actions}</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {items.map((member) => (
                  <tr key={member.memberId} className="align-middle">
                    <td className="border-b border-swing-border/20 px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedMemberIdSet.has(member.memberId)}
                        onChange={() => toggleMemberSelection(member.memberId)}
                        aria-label={`${memberLabels.select}: ${member.displayName || member.email}`}
                        className="h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
                      />
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3">
                      {/* Collapsed, the two name columns fold into one: the
                          nickname is what people are called here, with the
                          registered name after it when they differ. */}
                      <MemberNameLabel
                        name={
                          (showDetails ? member.displayName : member.nickname || member.displayName) ||
                          labels.common.empty
                        }
                        status={member.memberStatus}
                        className="font-semibold text-swing-ink"
                      />
                      {!showDetails && member.nickname && member.displayName && member.nickname !== member.displayName ? (
                        <span className="ml-1 text-swing-muted">({member.displayName})</span>
                      ) : null}
                    </td>
                    {showDetails ? (
                      <>
                        <td className="border-b border-swing-border/20 px-3 py-3 text-swing-muted">
                          {member.nickname || labels.common.empty}
                        </td>
                        <td className="border-b border-swing-border/20 px-3 py-3 text-swing-muted">{member.email}</td>
                      </>
                    ) : null}
                    <td className="border-b border-swing-border/20 px-3 py-3">
                      <MemberStatusBadge status={member.memberStatus} labels={labels} />
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3 text-swing-muted">
                      {labels.memberLanguages[member.preferredLanguage] || member.preferredLanguage || labels.common.empty}
                    </td>
                    {showDetails ? (
                    <>
                    <td className="whitespace-nowrap border-b border-swing-border/20 px-3 py-3 text-swing-muted">
                      <DateTimeLines value={member.createdAt} langCd={langCd} fallback={labels.common.empty} />
                    </td>
                    <td className="whitespace-nowrap border-b border-swing-border/20 px-3 py-3 text-swing-muted">
                      <DateTimeLines value={member.lastLoginAt} langCd={langCd} fallback={labels.common.empty} />
                    </td>
                    <td className="whitespace-nowrap border-b border-swing-border/20 px-3 py-3 text-swing-muted">
                      <DateTimeLines value={member.withdrawnAt} langCd={langCd} fallback={labels.common.empty} />
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3 text-right font-semibold text-swing-ink/80">
                      {member.level1ApplicationCount}
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3 text-right font-semibold text-swing-ink/80">
                      {member.level2ApplicationCount}
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3 text-right font-semibold text-swing-ink/80">
                      {member.level3ApplicationCount}
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3 text-right font-semibold text-swing-ink/80">
                      {member.level4ApplicationCount}
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3 text-right font-semibold text-swing-ink/80">
                      {member.workshopApplicationCount}
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3 text-right font-bold text-swing-ink">
                      {member.totalApplicationCount}
                    </td>
                    <td className="border-b border-swing-border/20 px-3 py-3">
                      <div className="flex justify-end gap-2">
                        {canChangeMemberStatus && member.memberStatus === "ACTIVE" ? (
                          <button
                            type="button"
                            onClick={() => openStatusModal("suspend", member)}
                            className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-50"
                          >
                            {memberLabels.suspend}
                          </button>
                        ) : null}
                        {canChangeMemberStatus && member.memberStatus === "SUSPENDED" ? (
                          <button
                            type="button"
                            onClick={() => openStatusModal("reactivate", member)}
                            className="rounded-lg border border-swing-sage px-3 py-1.5 text-xs font-semibold text-swing-teal-deep transition hover:bg-swing-sage/40"
                          >
                            {memberLabels.reactivate}
                          </button>
                        ) : null}
                      </div>
                    </td>
                    </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      {isMessageModalOpen ? (
        <MemberMessageSendModal
          labels={memberLabels}
          commonLabels={labels.common}
          members={selectedMembers}
          activeCount={selectedActiveCount}
          excludedCount={selectedExcludedCount}
          content={messageContent}
          error={messageError}
          isSubmitting={isSendingMessage}
          onContentChange={(value) => {
            setMessageContent(value);
            setMessageError("");
          }}
          onCancel={closeMessageModal}
          onSubmit={submitMemberMessage}
        />
      ) : null}
      {statusModal ? (
        <MemberStatusChangeModal
          labels={memberLabels}
          commonLabels={labels.common}
          member={statusModal.member}
          type={statusModal.type}
          reason={statusReason}
          reasonError={statusReasonError}
          isSubmitting={isChangingStatus}
          onReasonChange={(value) => {
            setStatusReason(value);
            setStatusReasonError("");
          }}
          onCancel={closeStatusModal}
          onSubmit={submitStatusChange}
        />
      ) : null}
    </section>
  );
}

function MemberMessageSendModal({
  labels,
  commonLabels,
  members,
  activeCount,
  excludedCount,
  content,
  error,
  isSubmitting,
  onContentChange,
  onCancel,
  onSubmit,
}) {
  const previewMembers = members.slice(0, 5);
  const moreCount = Math.max(0, members.length - previewMembers.length);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-swing-ink/40 px-3 py-4 sm:items-center sm:px-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-xl sm:p-5">
        <h2 className="text-lg font-bold text-swing-ink">{labels.sendMessageTitle}</h2>
        <p className="mt-3 text-sm leading-6 text-swing-muted">{labels.sendMessageDescription(members.length)}</p>

        <div className="mt-4 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3">
          <div className="flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-swing-sage/50 px-2.5 py-1 text-swing-teal-deep">
              {labels.activeRecipients(activeCount)}
            </span>
            {excludedCount > 0 ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">
                {labels.excludedRecipients(excludedCount)}
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {previewMembers.map((member) => (
              <span
                key={member.memberId}
                className="inline-flex items-center rounded-full border border-swing-border/30 bg-swing-paper px-2.5 py-1 text-xs font-semibold text-swing-ink/80"
              >
                <MemberNameLabel
                  name={member.displayName || commonLabels.empty}
                  status={member.memberStatus}
                />
              </span>
            ))}
            {moreCount > 0 ? (
              <span className="inline-flex items-center rounded-full border border-swing-border/30 bg-swing-paper px-2.5 py-1 text-xs font-semibold text-swing-muted">
                {labels.previewMore(moreCount)}
              </span>
            ) : null}
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-swing-muted">{labels.sendMessagePrivacyNote}</p>

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-swing-muted">{labels.messageLabel}</span>
          <textarea
            value={content}
            onChange={(event) => onContentChange(event.target.value)}
            maxLength={2000}
            rows={5}
            placeholder={labels.messagePlaceholder}
            className="mt-1.5 min-h-[128px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 sm:min-h-[160px]"
          />
        </label>
        {error ? <div className="mt-2 text-sm font-semibold text-red-600">{error}</div> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
            {commonLabels.cancel}
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? labels.sendingMessage : labels.sendMessage}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function MemberStatusChangeModal({
  labels,
  commonLabels,
  member,
  type,
  reason,
  reasonError,
  isSubmitting,
  onReasonChange,
  onCancel,
  onSubmit,
}) {
  const isSuspend = type === "suspend";
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-swing-ink/40 px-3 py-4 sm:items-center sm:px-4">
      <div className="max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-y-auto rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-xl sm:p-5">
        <h2 className="text-lg font-bold text-swing-ink">
          {isSuspend ? labels.suspendTitle : labels.reactivateTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-swing-muted">
          {isSuspend ? labels.suspendBody : labels.reactivateBody}
        </p>
        <div className="mt-4 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3">
          <MemberNameLabel
            name={member.displayName || commonLabels.empty}
            status={member.memberStatus}
            className="font-semibold text-swing-ink"
          />
          <div className="mt-1 text-xs text-swing-muted">{member.email}</div>
        </div>
        <label className="mt-4 block">
          <span className="text-xs font-semibold text-swing-muted">{labels.reasonLabel}</span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            maxLength={1000}
            rows={4}
            placeholder={labels.reasonPlaceholder}
            className="mt-1.5 min-h-[112px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40"
          />
        </label>
        {reasonError ? <div className="mt-2 text-sm font-semibold text-red-600">{reasonError}</div> : null}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <SecondaryButton type="button" onClick={onCancel} disabled={isSubmitting} className="w-full sm:w-auto">
            {commonLabels.cancel}
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onSubmit} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSuspend ? labels.suspend : labels.reactivate}
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function AdminMemberActionLogsPanel({ token, langCd, labels }) {
  const logLabels = labels.memberActionLogs;
  const [filters, setFilters] = useState(() => createMemberActionLogFilters());
  const [showFilters, setShowFilters] = useState(false);
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      setLogs(await adminApi.findMemberActionLogs(token, toMemberActionLogSearchParams(filters)));
    } catch (nextError) {
      setError(nextError.message || logLabels.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [filters, logLabels.loadError, token]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    loadLogs();
  };

  const handleReset = () => {
    setFilters(createMemberActionLogFilters());
  };

  return (
    // min-w-0 on both the grid and its items: the 1100px log table sits inside a
    // card, so the card is the grid item whose automatic minimum size holds the
    // table's width. Without both, the page widens to 1162px on a 375px screen
    // instead of the table scrolling inside its own container.
    // content-start: the page grid stretches this column to the sidebar's
    // height, and without it the auto rows grew to absorb the slack — the
    // collapsed filter card was 203px tall for a title and one button.
    <section className="grid min-w-0 content-start gap-5 [&>*]:min-w-0">
      <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm">
        {/* Collapsed, this card is just its title row, so the divider and the
            padding under it would frame nothing but empty space. */}
        <div
          className={`flex flex-wrap items-center justify-between gap-3 ${
            showFilters ? "border-b border-swing-border/30 pb-3" : ""
          }`}
        >
          <h2 className="text-lg font-bold text-swing-ink">{logLabels.filtersTitle}</h2>
          <div className="flex gap-2">
            <SecondaryButton type="button" onClick={() => setShowFilters((current) => !current)}>
              {showFilters ? labels.common.hideFilters : labels.common.showFilters}
            </SecondaryButton>
            {showFilters ? (
              <>
                <SecondaryButton type="button" onClick={handleReset}>
                  {logLabels.reset}
                </SecondaryButton>
                <PrimaryButton type="submit">{logLabels.search}</PrimaryButton>
              </>
            ) : null}
          </div>
        </div>
        <div className={`mt-3 grid gap-3 md:grid-cols-3 ${showFilters ? "" : "hidden"}`}>
          <Field label={logLabels.from}>
            <TextInput type="date" name="from" value={filters.from} onChange={handleChange} />
          </Field>
          <Field label={logLabels.to}>
            <TextInput type="date" name="to" value={filters.to} onChange={handleChange} />
          </Field>
          <Field label={logLabels.action}>
            <SelectInput name="action" value={filters.action} onChange={handleChange}>
              <option value="">{logLabels.allActions}</option>
              {MEMBER_ACTION_TYPES.map((action) => (
                <option key={action} value={action}>
                  {logLabels.actions[action] || action}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
      </form>

      <Notice>{error}</Notice>

      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{logLabels.listTitle}</h2>
          <span className="text-sm font-semibold text-swing-muted">{labels.common.count(logs.length)}</span>
        </div>
        {isLoading ? <div className="py-8 text-center text-sm text-swing-muted">{logLabels.loading}</div> : null}
        {!isLoading && logs.length === 0 ? (
          <div className="py-8 text-center text-sm text-swing-muted">{logLabels.empty}</div>
        ) : null}
        {!isLoading && logs.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[1100px] w-full divide-y divide-swing-border/30 text-left text-sm">
              {/* whitespace-nowrap on the headers: twelve columns inside a 1100px
                  floor left the short-label ones about 39px of content width, so
                  "처리자 역할" broke to one character per line. The table already
                  scrolls in its own container, so letting the headers set the
                  column width costs nothing. The sentence-length columns get a
                  floor too, otherwise their text wraps every few characters. */}
              <thead className="whitespace-nowrap bg-swing-cream/50 text-xs font-semibold uppercase tracking-wide text-swing-muted">
                <tr>
                  <th className="px-3 py-3">{logLabels.actionAt}</th>
                  <th className="px-3 py-3">{logLabels.actor}</th>
                  <th className="px-3 py-3">{logLabels.actorRole}</th>
                  <th className="px-3 py-3">{logLabels.targetMember}</th>
                  <th className="px-3 py-3">{logLabels.targetEmail}</th>
                  <th className="px-3 py-3">{logLabels.lessonTitle}</th>
                  <th className="px-3 py-3">{logLabels.lessonDate}</th>
                  <th className="min-w-[150px] px-3 py-3">{logLabels.actionType}</th>
                  <th className="px-3 py-3">{logLabels.previousStatus}</th>
                  <th className="px-3 py-3">{logLabels.nextStatus}</th>
                  <th className="min-w-[150px] px-3 py-3">{logLabels.summary}</th>
                  <th className="min-w-[150px] px-3 py-3">{logLabels.reason}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-swing-border/20">
                {logs.map((log) => {
                  const targetName = log.targetMemberNickname || log.targetMemberDisplayName || log.applicantName;
                  const targetEmail = log.targetMemberEmail || log.applicantEmail || labels.common.empty;
                  return (
                    <tr key={log.id} className="align-top">
                      <td className="whitespace-nowrap px-3 py-3 text-swing-muted">
                        <DateTimeLines value={log.actionAt} langCd={langCd} fallback={labels.common.empty} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-swing-ink">{log.actorAdminName || log.actorLoginId}</div>
                        <div className="mt-1 text-xs text-swing-muted">{log.actorLoginId || log.actorAdminId}</div>
                      </td>
                      <td className="px-3 py-3">
                        <RoleBadge role={log.actorRole} labels={labels} />
                      </td>
                      <td className="px-3 py-3 font-semibold text-swing-ink">
                        <MemberNameLabel
                          member={{
                            memberNickname: log.targetMemberNickname,
                            memberDisplayName: log.targetMemberDisplayName,
                            email: log.targetMemberEmail || log.applicantEmail,
                            status: log.targetMemberStatus,
                          }}
                          name={targetName}
                          status={log.targetMemberStatus}
                          fallback={labels.common.empty}
                        />
                      </td>
                      <td className="px-3 py-3 text-swing-muted">{targetEmail}</td>
                      <td className="px-3 py-3 text-swing-ink">
                        <div className="font-semibold">{log.lessonTitle || log.eventTitle || labels.common.empty}</div>
                        <div className="mt-1 text-xs text-swing-muted">#{log.lessonId || log.eventId}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-swing-muted">
                        {formatDateRange(log.lessonStartDate, log.lessonEndDate, labels.common.empty)}
                      </td>
                      <td className="px-3 py-3 text-swing-ink/80">{logLabels.actions[log.action] || log.action}</td>
                      <td className="px-3 py-3 text-swing-muted">
                        {labels.memberStatuses[log.previousMemberStatus] || log.previousMemberStatus || labels.common.empty}
                      </td>
                      <td className="px-3 py-3 text-swing-muted">
                        {labels.memberStatuses[log.nextMemberStatus] || log.nextMemberStatus || labels.common.empty}
                      </td>
                      <td className="px-3 py-3 text-swing-ink/80">{log.summary || labels.common.empty}</td>
                      <td className="px-3 py-3 text-swing-muted">{log.reason || logLabels.noReason}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function AdminMemberMessagesPanel({ token, langCd, labels, onUnreadChanged }) {
  const [threads, setThreads] = useState([]);
  const [selectedThreadId, setSelectedThreadId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [reply, setReply] = useState("");
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const messageLabels = labels.memberMessages;

  const loadThreads = useCallback(async () => {
    setIsLoadingThreads(true);
    setError("");

    try {
      const nextThreads = await adminApi.findMemberMessageThreads(token);
      const safeThreads = Array.isArray(nextThreads) ? nextThreads : [];
      setThreads(safeThreads);
      // Nothing is opened for the reader: landing on the newest thread marked
      // it read before anyone had chosen to look at it. A thread already open
      // stays open across a refresh; one that disappeared closes.
      setSelectedThreadId((currentThreadId) =>
        currentThreadId && safeThreads.some((thread) => thread.threadId === currentThreadId)
          ? currentThreadId
          : null
      );
    } catch (nextError) {
      setError(nextError.message || messageLabels.loadError);
      setThreads([]);
      setSelectedThreadId(null);
    } finally {
      setIsLoadingThreads(false);
    }
  }, [messageLabels.loadError, token]);

  const loadDetail = useCallback(async () => {
    if (!selectedThreadId) {
      setDetail(null);
      return;
    }

    setIsLoadingDetail(true);
    setError("");

    try {
      setDetail(await adminApi.findMemberMessageThread(token, selectedThreadId));
      await onUnreadChanged?.();
      await loadThreads();
    } catch (nextError) {
      setError(nextError.message || messageLabels.loadError);
      setDetail(null);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [loadThreads, messageLabels.loadError, onUnreadChanged, selectedThreadId, token]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedReply = reply.trim();
    if (!selectedThreadId || !normalizedReply) {
      setError(messageLabels.sendError);
      return;
    }

    setIsSending(true);
    setError("");
    setNotice("");

    try {
      const nextDetail = await adminApi.createMemberMessageReply(token, selectedThreadId, {
        content: normalizedReply,
      });
      setDetail(nextDetail);
      setReply("");
      setNotice(messageLabels.sent);
      await loadThreads();
    } catch (nextError) {
      setError(nextError.message || messageLabels.sendError);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{messageLabels.listTitle}</h2>
          <span className="text-sm text-swing-muted">
            {isLoadingThreads ? messageLabels.loading : labels.common.count(threads.length)}
          </span>
        </div>

        {threads.length === 0 && !isLoadingThreads ? (
          <div className="py-8 text-center text-sm text-swing-muted">{messageLabels.emptyThreads}</div>
        ) : (
          <div className="mt-4 grid gap-2">
            {threads.map((thread) => {
              const isSelected = thread.threadId === selectedThreadId;
              const isUnread = Boolean(thread.unreadByAdmin);
              return (
                <button
                  key={thread.threadId}
                  type="button"
                  onClick={() => {
                    // Tapping the open thread closes it again, so the reader can
                    // put the conversation away without picking another one.
                    setSelectedThreadId((currentThreadId) =>
                      currentThreadId === thread.threadId ? null : thread.threadId
                    );
                    setNotice("");
                    setError("");
                  }}
                  className={`flex items-center gap-2 overflow-hidden rounded-lg border px-3 py-2 text-left transition ${
                    isSelected
                      ? "border-swing-teal bg-swing-teal/10"
                      : isUnread
                        ? "border-swing-teal/40 bg-swing-teal/5 hover:border-swing-teal/60 hover:bg-swing-teal/10"
                      : "border-swing-border/30 bg-swing-paper hover:border-swing-border/45 hover:bg-swing-cream/50"
                  }`}
                  title={thread.lastMessagePreview || undefined}
                >
                  {/* One row per thread: name, unread count, preview, time. The
                      preview is the elastic part and simply cuts off — the whole
                      message is one click away, and a scannable list is worth
                      more here than two lines of it. The address moved to the
                      detail pane, which already prints it. */}
                  <MemberNameLabel
                    member={thread}
                    fallback={labels.common.empty}
                    className={`max-w-[40%] shrink-0 flex-nowrap overflow-hidden text-sm ${
                      isUnread ? "font-bold" : "font-semibold"
                    } text-swing-ink [&>span]:truncate`}
                  />
                  {isUnread ? (
                    <span className="inline-flex shrink-0 items-center rounded-full bg-swing-teal-deep px-1.5 py-0.5 text-[11px] font-bold text-swing-paper">
                      {thread.unreadMessageCountForAdmin > 1 ? thread.unreadMessageCountForAdmin : messageLabels.unread}
                    </span>
                  ) : null}
                  <span className="min-w-0 flex-1 truncate text-xs text-swing-muted">
                    {thread.lastMessagePreview || labels.common.empty}
                  </span>
                  <span className="shrink-0 text-[11px] text-swing-muted/70">
                    {formatThreadTimestamp(thread.lastMessageAt, langCd)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{messageLabels.detailTitle}</h2>
          {detail?.member ? (
            <div className="mt-3 grid gap-2 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3 text-sm text-swing-muted sm:grid-cols-2">
              <div>
                <span className="font-semibold text-swing-ink">{messageLabels.memberInfo}: </span>
                <MemberNameLabel member={detail.member} fallback={labels.common.empty} />
              </div>
              <div>{detail.member.email}</div>
              <div>
                <MemberNameLabel
                  name={detail.member.displayName || labels.common.empty}
                  status={detail.member.displayName ? detail.member.status : null}
                />
              </div>
              <div>
                <MemberNameLabel
                  name={detail.member.nickname || labels.common.empty}
                  status={detail.member.nickname ? detail.member.status : null}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4" aria-live="polite">
          <Notice>{error}</Notice>
          <Notice type="success">{notice}</Notice>
        </div>

        {!selectedThreadId ? (
          <div className="py-12 text-center text-sm text-swing-muted">{messageLabels.selectThread}</div>
        ) : isLoadingDetail ? (
          <div className="py-12 text-center text-sm text-swing-muted">{messageLabels.loading}</div>
        ) : (
          <>
            <div className="mt-4 grid max-h-[520px] gap-3 overflow-y-auto rounded-lg border border-swing-border/30 bg-swing-cream/50 p-4">
              {detail?.messages?.length > 0 ? (
                detail.messages.map((message) => {
                  const isAdmin = message.senderType === "ADMIN";
                  return (
                    <article key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                          isAdmin
                            ? "bg-swing-teal-deep text-swing-paper"
                            : "border border-swing-border/30 bg-swing-paper text-swing-ink"
                        }`}
                      >
                        <div className={`text-xs font-semibold ${isAdmin ? "text-swing-paper/75" : "text-swing-muted"}`}>
                          {isAdmin ? (
                            formatStaffSenderLabel(message, messageLabels)
                          ) : (
                            <MemberNameLabel name={message.senderName} status={detail?.member?.status} />
                          )}
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        <div className={`mt-2 text-[11px] ${isAdmin ? "text-swing-paper/65" : "text-swing-muted/70"}`}>
                          {formatDate(message.createdAt, langCd)}
                        </div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="py-8 text-center text-sm text-swing-muted">{messageLabels.noMessages}</div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-4">
              <textarea
                value={reply}
                onChange={(event) => {
                  setReply(event.target.value);
                  setError("");
                  setNotice("");
                }}
                maxLength={2000}
                rows={4}
                placeholder={messageLabels.replyPlaceholder}
                className="w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-3 text-sm leading-6 text-swing-ink outline-none transition placeholder:text-swing-muted focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40"
              />
              <div className="mt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSending}
                  className="inline-flex min-h-[42px] w-full items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70 sm:w-auto"
                >
                  {isSending ? messageLabels.replying : messageLabels.reply}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </section>
  );
}

export default function AdminApp() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [session, setSession] = useState(null);
  const [theme, setTheme] = useState(() => {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.includes(stored) ? stored : "light";
  });
  const [activeMenu, setActiveMenu] = useState("DASHBOARD");
  const [isChecking, setIsChecking] = useState(Boolean(token));
  const [operationCheckSummary, setOperationCheckSummary] = useState({ openTotalCount: 0, openAssignedCount: 0 });
  const [memberMessageUnreadCount, setMemberMessageUnreadCount] = useState(0);
  const [operationCheckRefreshKey, setOperationCheckRefreshKey] = useState(0);
  // Set when any admin call comes back with PASSWORD_CHANGE_REQUIRED, so a
  // session whose flag is out of date still lands on the change screen instead
  // of showing a raw error. The login flag below is the usual trigger.
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);

  const applySession = useCallback((nextSession) => {
    const nextMenus = filterVisibleMenus(nextSession.menus || []);

    setSession({
      user: {
        ...nextSession.user,
        langCd: nextSession.user?.langCd || "Kor",
        roles: normalizeRoles(nextSession.user),
        role: primaryRole(nextSession.user),
      },
      menus: nextMenus,
    });

    setActiveMenu((currentMenu) => {
      // MY_ACCOUNT is injected into visibleMenus rather than granted by the
      // backend, so treat it as always-valid here too — a session refresh should
      // not bounce someone off the settings screen.
      if (currentMenu === "MY_ACCOUNT" || nextMenus.includes(currentMenu)) {
        return currentMenu;
      }
      return nextMenus[0] || "DASHBOARD";
    });
  }, []);

  const clearSession = useCallback(() => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setSession(null);
    setActiveMenu("DASHBOARD");
    setMemberMessageUnreadCount(0);
    setPasswordChangeRequired(false);
  }, []);

  // Any admin call that reports the account still owes a password change flips
  // the app to the change screen, wherever it was. adminApi raises this from a
  // 403 PASSWORD_CHANGE_REQUIRED.
  useEffect(() => {
    const handle = () => setPasswordChangeRequired(true);
    window.addEventListener("swingpop:password-change-required", handle);
    return () => window.removeEventListener("swingpop:password-change-required", handle);
  }, []);

  useEffect(() => {
    if (!token) {
      setIsChecking(false);
      return;
    }

    let isMounted = true;

    adminApi
      .me(token)
      .then((nextSession) => {
        if (isMounted) {
          applySession(nextSession);
        }
      })
      .catch(() => {
        if (isMounted) {
          clearSession();
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsChecking(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [applySession, clearSession, token]);

  const handleLogin = (nextSession) => {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, nextSession.accessToken);
    setToken(nextSession.accessToken);
    applySession(nextSession);
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await adminApi.logout(token);
      }
    } finally {
      clearSession();
    }
  };

  // Language is the one self-service change with no re-login: swap langCd on the
  // live session so every label re-renders, without disturbing the active menu.
  const handleOwnLanguageChanged = useCallback((nextLangCd) => {
    setSession((current) =>
      current ? { ...current, user: { ...current.user, langCd: nextLangCd } } : current
    );
  }, []);

  // Theme is a browser-local preference: persist it and let the `dark` class on
  // the shell (below) do the rest.
  const handleThemeChanged = useCallback((nextTheme) => {
    const safeTheme = THEMES.includes(nextTheme) ? nextTheme : "light";
    window.localStorage.setItem(THEME_STORAGE_KEY, safeTheme);
    setTheme(safeTheme);
  }, []);

  const langCd = session?.user?.langCd || "Kor";
  const labels = getLabels(langCd);
  // MY_ACCOUNT is self-service rather than backend-granted, so it is appended for
  // every signed-in admin rather than arriving in session.menus.
  const visibleMenus = useMemo(
    () => (session ? [...filterVisibleMenus(session.menus || []), "MY_ACCOUNT"] : []),
    [session]
  );
  const menuCategories = useMemo(() => groupMenusByCategory(visibleMenus), [visibleMenus]);
  const safeActiveMenu = visibleMenus.includes(activeMenu) ? activeMenu : visibleMenus[0] || "DASHBOARD";
  // Which category the phone nav has dropped open. Purely open/closed state: it
  // does not follow the active menu, because the panel closes as soon as you
  // pick something from it.
  const [openCategory, setOpenCategory] = useState(null);
  const mobileNavRef = useRef(null);

  useEffect(() => {
    if (!openCategory) {
      return undefined;
    }

    const closeOnOutside = (event) => {
      if (mobileNavRef.current && !mobileNavRef.current.contains(event.target)) {
        setOpenCategory(null);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setOpenCategory(null);
      }
    };

    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openCategory]);
  const pageTitle = labels.menus[safeActiveMenu] || labels.brand;
  // While a change is owed the whole admin area is off limits, so the sidebar
  // count fetches below would only draw a 403 each. Fold it into their guards.
  const pendingPasswordChange = Boolean(session?.user?.mustChangePassword) || passwordChangeRequired;
  const canUseOperationCheck =
    session && !pendingPasswordChange ? hasAnyRole(session.user, ["SUPER_ADMIN", "STAFF"]) : false;
  const canUseMemberMessages =
    session && !pendingPasswordChange ? hasAnyRole(session.user, ["SUPER_ADMIN", "STAFF"]) : false;
  const menuBadgeCount = (menu) => {
    if (menu === "OPERATION_CHECK") {
      return operationCheckSummary.openAssignedCount;
    }
    if (menu === "MEMBER_MESSAGES") {
      return memberMessageUnreadCount;
    }
    return 0;
  };

  const shouldShowOperationCheckQuickInput =
    canUseOperationCheck && (safeActiveMenu === "DASHBOARD" || safeActiveMenu === "OPERATION_CHECK");

  const handleOperationCheckChanged = useCallback(() => {
    setOperationCheckRefreshKey((current) => current + 1);
  }, []);

  const loadMemberMessageUnreadCount = useCallback(async () => {
    if (!token || !canUseMemberMessages) {
      setMemberMessageUnreadCount(0);
      return 0;
    }

    try {
      const response = await adminApi.findMemberMessageUnreadCount(token);
      const count = Number(response?.count) || 0;
      setMemberMessageUnreadCount(count);
      return count;
    } catch {
      setMemberMessageUnreadCount(0);
      return 0;
    }
  }, [canUseMemberMessages, token]);

  useEffect(() => {
    if (!token || !canUseOperationCheck) {
      setOperationCheckSummary({ openTotalCount: 0, openAssignedCount: 0 });
      return;
    }

    let isMounted = true;

    adminApi
      .findOperationCheckSummary(token)
      .then((summary) => {
        if (isMounted) {
          setOperationCheckSummary(summary);
        }
      })
      .catch(() => {
        if (isMounted) {
          setOperationCheckSummary({ openTotalCount: 0, openAssignedCount: 0 });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canUseOperationCheck, operationCheckRefreshKey, token]);

  useEffect(() => {
    loadMemberMessageUnreadCount();
  }, [loadMemberMessageUnreadCount]);

  if (isChecking) {
    return (
      <div className={`flex min-h-screen items-center justify-center bg-swing-cream text-sm font-semibold text-swing-muted${theme === "dark" ? " dark" : ""}`}>
        {labels.checkingSession}
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLogin={handleLogin} theme={theme} />;
  }

  // Checked before anything else renders, so the admin area is not merely
  // covered up while a pending change is outstanding. The API refuses these
  // calls regardless; this is what makes that refusal legible.
  if (pendingPasswordChange) {
    return (
      <PasswordChangeRequiredScreen
        token={token}
        labels={labels.myAccount}
        commonLabels={labels.common}
        theme={theme}
        onChanged={(nextSession) => {
          setPasswordChangeRequired(false);
          applySession(nextSession);
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className={`min-h-screen bg-swing-cream text-swing-ink${theme === "dark" ? " dark" : ""}`}>
      <header className="border-b border-swing-border/30 bg-swing-paper">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            {/* Replaces the old 관리자 홈 sidebar row: the dashboard is a
                destination you return to, not a peer of the working menus. */}
            <button
              type="button"
              onClick={() => setActiveMenu("DASHBOARD")}
              aria-label={labels.home}
              aria-current={safeActiveMenu === "DASHBOARD" ? "page" : undefined}
              className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border transition ${
                safeActiveMenu === "DASHBOARD"
                  ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                  : "border-swing-border/55 bg-swing-paper text-swing-ink/70 hover:bg-swing-cream/50 hover:text-swing-ink"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.5 9.5V20a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <div className="text-sm font-semibold text-swing-teal-deep">{labels.brand}</div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-swing-ink">{pageTitle}</h1>
            </div>
          </div>
          {/* 내 정보 and 로그아웃 both moved into the 설정 › 내 정보 screen, so the
              header only identifies who is signed in. */}
          <div className="flex flex-wrap items-center gap-3">
            <RoleBadges item={session.user} labels={labels} />
            <span className="text-sm font-semibold text-swing-ink/80">{session.user.userNm}</span>
          </div>
        </div>
      </header>

      {/* Phones get the categories as a bar fixed to the underside of the
          header, and the chosen category's menus drop over the page rather than
          pushing it down — a nav is a detour, not part of the content. Above lg
          this is replaced by the sidebar. */}
      <div ref={mobileNavRef} className="relative z-[60] border-b border-swing-border/30 bg-swing-paper lg:hidden">
        <nav className="mx-auto flex max-w-7xl flex-wrap gap-1.5 px-5 py-2" aria-label={labels.brand}>
          {menuCategories.map((category) => {
            const categoryKey = category.key || "OTHER";
            const isOpen = openCategory === categoryKey;
            const holdsActiveMenu = category.menus.includes(safeActiveMenu);

            return (
              <button
                key={categoryKey}
                type="button"
                onClick={() => setOpenCategory(isOpen ? null : categoryKey)}
                aria-expanded={isOpen}
                className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                  isOpen
                    ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                    : holdsActiveMenu
                      ? "border-swing-teal-deep/40 bg-swing-cream text-swing-teal-deep"
                      : "border-swing-border/55 bg-swing-paper text-swing-muted"
                }`}
              >
                {category.key ? labels.menuCategories[category.key] || category.key : labels.brand}
              </button>
            );
          })}
        </nav>

        {menuCategories
          .filter((category) => openCategory === (category.key || "OTHER"))
          .map((category) => (
            <div
              key={category.key || "OTHER"}
              className="absolute inset-x-0 top-full border-b border-swing-border/30 bg-swing-paper shadow-[0_12px_24px_-12px_rgba(46,39,32,0.45)]"
            >
              <div className="mx-auto grid max-w-7xl gap-1 px-5 py-2">
                {category.menus.map((menu) => (
                  <AdminMenuButton
                    key={menu}
                    label={labels.menus[menu] || menu}
                    isActive={safeActiveMenu === menu}
                    badgeCount={menuBadgeCount(menu)}
                    onSelect={() => {
                      setActiveMenu(menu);
                      setOpenCategory(null);
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden rounded-lg border border-swing-border/30 bg-swing-paper p-3 shadow-sm lg:sticky lg:top-5 lg:block lg:h-fit">
          <nav className="grid gap-4">
            {menuCategories.map((category) => (
              <div key={category.key || "OTHER"} className="grid gap-1">
                {category.key ? (
                  <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-swing-muted/70">
                    {labels.menuCategories[category.key] || category.key}
                  </div>
                ) : null}
                {category.menus.map((menu) => (
                  <AdminMenuButton
                    key={menu}
                    label={labels.menus[menu] || menu}
                    isActive={safeActiveMenu === menu}
                    badgeCount={menuBadgeCount(menu)}
                    onSelect={() => setActiveMenu(menu)}
                  />
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <main className="grid min-w-0 gap-5">
          {shouldShowOperationCheckQuickInput ? (
            <OperationCheckQuickInput token={token} langCd={langCd} onChanged={handleOperationCheckChanged}>
              {/* Only on the dashboard: the OPERATION_CHECK menu below already
                  lists everything, so repeating my own items there would be
                  noise. */}
              {safeActiveMenu === "DASHBOARD" ? (
                <OperationCheckMineList
                  token={token}
                  langCd={langCd}
                  currentUserId={session.user.userCd || session.user.userId}
                  refreshKey={operationCheckRefreshKey}
                  onChanged={handleOperationCheckChanged}
                />
              ) : null}
            </OperationCheckQuickInput>
          ) : null}
          {safeActiveMenu === "DASHBOARD" ? (
            <div className="grid gap-5">
              {/* The account-summary panel was dropped: 아이디 / 권한 / 표시 언어
                  now live on the 설정 › 내 정보 screen, so repeating them here was
                  duplicate. Teachers still get their lesson dashboard. */}
              {hasRole(session.user, "TEACHER") ? <TeacherDashboardPanel token={token} langCd={langCd} /> : null}
            </div>
          ) : null}
          {safeActiveMenu === "OPERATION_CHECK" ? (
            <OperationCheckPanel
              token={token}
              langCd={langCd}
              refreshKey={operationCheckRefreshKey}
              onChanged={handleOperationCheckChanged}
            />
          ) : null}
          {safeActiveMenu === "MY_ACCOUNT" ? (
            <AccountSettingsPanel
              token={token}
              session={session}
              labels={labels}
              theme={theme}
              onThemeChanged={handleThemeChanged}
              onRequireRelogin={handleLogout}
              onLanguageChanged={handleOwnLanguageChanged}
              onLogout={handleLogout}
            />
          ) : null}
          {safeActiveMenu === "EVENT_VIEW" ? <LessonBoardPanel token={token} langCd={langCd} /> : null}
          {safeActiveMenu === "EVENT_REGISTRATION" ? (
            <EventManagementPanel token={token} currentUser={session.user} langCd={langCd} />
          ) : null}
          {safeActiveMenu === "CORKBOARD" ? (
            <AdminCorkboardPanel token={token} currentUser={session.user} langCd={langCd} />
          ) : null}
          {safeActiveMenu === "MEMBER_MESSAGES" ? (
            <AdminMemberMessagesPanel
              token={token}
              langCd={langCd}
              labels={labels}
              onUnreadChanged={loadMemberMessageUnreadCount}
            />
          ) : null}
          {safeActiveMenu === "MEMBER_ACTION_LOGS" ? (
            <AdminMemberActionLogsPanel token={token} langCd={langCd} labels={labels} />
          ) : null}
          {safeActiveMenu === "MEMBERS" ? (
            <AdminMembersPanel token={token} currentUser={session.user} langCd={langCd} labels={labels} />
          ) : null}
          {safeActiveMenu === "KNOWLEDGE_BASE" || safeActiveMenu === "KNOWLEDGE_BASE_REGISTRATION" ? (
            <KnowledgeBasePanel
              token={token}
              currentUser={session.user}
              langCd={langCd}
              labels={labels}
              readOnly={safeActiveMenu === "KNOWLEDGE_BASE"}
            />
          ) : null}
          {safeActiveMenu === "MESSAGE_TEMPLATE_VIEW" || safeActiveMenu === "MESSAGE_TEMPLATE_REGISTRATION" ? (
            <MessageTemplatePanel
              token={token}
              currentUser={session.user}
              langCd={langCd}
              readOnly={safeActiveMenu === "MESSAGE_TEMPLATE_VIEW"}
            />
          ) : null}
          {safeActiveMenu === "ADMIN_USERS" ? (
            <AdminUsersPanel token={token} currentUser={session.user} langCd={langCd} labels={labels} />
          ) : null}
        </main>
      </div>

      {/* Deploys are manual and a phone can sit on an old bundle, so make the
          running build readable instead of guessing from which features appear.
          Selectable, so it can be quoted when reporting a problem. It sits on
          the page background at the foot of the page rather than in the sidebar,
          where it competed with the menus for a phone's first screen. */}
      <div className="select-text px-5 pb-6 text-center text-[11px] leading-4 text-swing-muted/70">
        {labels.common.buildVersion} · {__BUILD_VERSION__}
      </div>
    </div>
  );
}
