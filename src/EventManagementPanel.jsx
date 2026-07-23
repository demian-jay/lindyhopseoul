import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";
import MemberNameLabel from "./MemberNameLabel";

const SUPPORTED_LANGUAGES = ["ko", "en"];
const EVENT_TYPES = ["REGULAR_CLASS", "PARTY", "DIALOGUE_PARTY"];
const EVENT_STATUSES = ["PUBLISHED", "FINISHED"];
const LESSON_TYPES = ["LEVEL1", "LEVEL2", "LEVEL3", "LEVEL4", "WORKSHOP", "EXPERIENCE"];
const LESSON_STATUSES = ["PUBLISHED", "FINISHED"];
const TEMPLATE_TYPES = ["EVENT_PROMOTION", "PARTY_PROMOTION", "REGULAR_CLASS_PROMOTION", "LESSON_PROMOTION"];
const ROLE_ORDER = ["SUPER_ADMIN", "STAFF", "TEACHER"];
// Named by venue, not by event type: regular classes and parties both run at KP.
const KP_GOOGLE_MAP_URL = "https://maps.app.goo.gl/ypA9zfFkKVqwJoT96";
const KP_NAVER_MAP_URL = "https://naver.me/x2jQH2Tt";
const KP_LOCATION = "KP DANCE HALL, 서울 강남구 학동로 166 지하 1층 B호";
const DIALOGUE_GOOGLE_MAP_URL = "https://maps.app.goo.gl/zw1a5deEpgU6t2CH9";
const DIALOGUE_NAVER_MAP_URL = "https://naver.me/GYC9bsWA";
const DIALOGUE_LOCATION = "Dialogue, 서울 용산구 신흥로 31 지하1층";
// Events repeat on a fixed weekday: regular classes on Saturdays, Dialogue
// meetups on Wednesdays. A new event defaults to next month's first and last
// occurrence of that weekday. Values are JS getDay() numbers. Declared here
// because EVENT_TYPE_DEFAULTS below reads it at module evaluation time.
const WEEKDAY = { SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3, THURSDAY: 4, FRIDAY: 5, SATURDAY: 6 };
const TEMPLATE_VARIABLES = [
  "{{event.title.ko}}",
  "{{event.title.en}}",
  "{{event.shortDescription.ko}}",
  "{{event.shortDescription.en}}",
  "{{event.description.ko}}",
  "{{event.description.en}}",
  "{{event.date}}",
  "{{event.startDate}}",
  "{{event.endDate}}",
  "{{event.startTime}}",
  "{{event.endTime}}",
  "{{event.location}}",
  "{{lessons.all.ko}}",
  "{{lessons.all.en}}",
  "{{lessons.level1.title.ko}}",
  "{{lessons.level1.title.en}}",
  "{{lessons.level1.time}}",
  "{{lessons.level1.fee}}",
  "{{lessons.level1.teachers}}",
  "{{lessons.level2.title.ko}}",
  "{{lessons.level2.title.en}}",
  "{{lessons.level2.time}}",
  "{{lessons.level2.fee}}",
  "{{lessons.level2.teachers}}",
  "{{lessons.level3.title.ko}}",
  "{{lessons.level3.title.en}}",
  "{{lessons.level3.time}}",
  "{{lessons.level3.fee}}",
  "{{lessons.level3.teachers}}",
  "{{lessons.level4.title.ko}}",
  "{{lessons.level4.title.en}}",
  "{{lessons.level4.time}}",
  "{{lessons.level4.fee}}",
  "{{lessons.level4.teachers}}",
  "{{lessons.workshop.title.ko}}",
  "{{lessons.workshop.title.en}}",
  "{{lessons.workshop.time}}",
  "{{lessons.workshop.fee}}",
  "{{lessons.workshop.teachers}}",
  "{{lessons.experience.title.ko}}",
  "{{lessons.experience.title.en}}",
  "{{lessons.experience.time}}",
  "{{lessons.experience.fee}}",
  "{{lessons.experience.teachers}}",
];

function normalizeRoles(userLike) {
  const roles = Array.isArray(userLike?.roles) && userLike.roles.length > 0 ? userLike.roles : [userLike?.role].filter(Boolean);
  return ROLE_ORDER.filter((role) => roles.includes(role));
}

function hasRole(userLike, role) {
  return normalizeRoles(userLike).includes(role);
}

const EVENT_TYPE_LABELS = {
  Kor: {
    REGULAR_CLASS: "정규수업",
    PARTY: "파티",
    DIALOGUE_PARTY: "다이얼로그 모임",
  },
  Eng: {
    REGULAR_CLASS: "Regular Class",
    PARTY: "Party",
    DIALOGUE_PARTY: "Dialogue Social",
  },
};

// Shared by events and lessons: both carry the same two status codes.
const EVENT_STATUS_LABELS = {
  Kor: {
    PUBLISHED: "진행중",
    FINISHED: "종료됨",
  },
  Eng: {
    PUBLISHED: "Published",
    FINISHED: "Finished",
  },
};

// One block per event type: everything the registration form pre-fills lives
// here, so changing an operational value is a single-place edit. weekday is the
// recurring day the event falls on; the form turns it into next month's first
// and last occurrence. Types without one (parties are one-offs) leave the dates
// empty. Address display is switched on for every type, matching how the venues
// are actually published.
const EVENT_TYPE_DEFAULTS = {
  REGULAR_CLASS: {
    weekday: WEEKDAY.SATURDAY,
    displayOrder: 2,
    startTime: "17:30",
    endTime: "22:00",
    location: KP_LOCATION,
    addressInfoEnabled: true,
    googleMapUrl: KP_GOOGLE_MAP_URL,
    naverMapUrl: KP_NAVER_MAP_URL,
    translations: {
      ko: {
        title: "스윙팝 토요일 정규수업",
        shortDescription: "토요일에 진행되는 스윙팝 정규 수업입니다.",
        description:
          "스윙팝 토요일 정규수업은 Level 1, Level 2, Level 3 강습으로 구성됩니다. 처음 시작하는 분과 기본기를 다지는 분 모두 참여할 수 있으며 수업이 끝난 후에는 소셜댄스가 이어집니다.",
      },
      en: {
        title: "SwingPop Saturday Regular Classes",
        shortDescription: "SwingPop's regular Saturday swing dance classes.",
        description:
          "SwingPop Saturday Regular Classes consist of Level 1, Level 2, and Level 3 courses. Whether you're taking your first steps in swing dancing or looking to strengthen your fundamentals, there's a class for you. After the lessons, everyone is welcome to stay and enjoy social dancing.",
      },
    },
    lesson: {
      defaultLessonType: "LEVEL1",
      byType: {
        LEVEL1: {
          scheduleType: "PERIOD",
          startTime: "19:00",
          endTime: "20:00",
          fee: "60000",
          displayOrder: 1,
          roleSelectionEnabled: true,
          translations: {
            ko: {
              title: "레벨 1 토요일 수업",
              description:
                "Level 1은 스윙댄스를 처음 시작하는 분들을 위한 입문 과정입니다. 기본 리듬과 스텝, 파트너와의 연결을 차근차근 배우며, 춤을 배우는 것을 넘어 스윙댄스 문화와 소셜댄스의 즐거움을 경험합니다. 춤을 처음 접하는 분도 부담 없이 참여할 수 있습니다, 누구나 환영합니다.",
            },
            en: {
              title: "Level 1 Saturday Class",
              description:
                "Level 1 is an introductory course designed for those taking their first steps into swing dancing. You'll gradually learn the fundamental rhythms, footwork, and partner connection while experiencing the culture of swing dancing and the joy of social dancing. No prior dance experience is required, everyone is welcome.",
            },
          },
        },
        LEVEL2: {
          scheduleType: "PERIOD",
          startTime: "17:30",
          endTime: "19:00",
          fee: "70000",
          displayOrder: 2,
          roleSelectionEnabled: true,
          translations: {
            ko: {
              title: "레벨 2 토요일 수업",
              description:
                "트리플 스텝을 시작으로 스윙아웃, 슈가 푸시, 써클 등 린디합의 대표적인 패턴을 배웁니다. 단순히 동작을 익히는 것에 그치지 않고, 소셜댄스에서 다양한 사람들과 편안하게 춤출 수 있는 연결과 리드·팔로우를 함께 연습합니다.",
            },
            en: {
              title: "Level 2 Saturday Class",
              description:
                "Starting with the triple step, you'll learn fundamental Lindy Hop patterns such as the Swing Out, Sugar Push, and Circle. Beyond simply learning the moves, you'll also practice connection, leading, and following so you can dance comfortably with a variety of partners during social dancing.",
            },
          },
        },
        LEVEL3: {
          scheduleType: "PERIOD",
          startTime: "17:30",
          endTime: "19:00",
          fee: "80000",
          displayOrder: 3,
          roleSelectionEnabled: true,
          translations: {
            ko: {
              title: "레벨 3 토요일 수업",
              description:
                "레벨 3에서는 Swing Out을 자연스럽게 출 수 있다는 것을 바탕으로 한 단계 더 깊이 있는 린디합을 배웁니다. Swing Out의 완성도를 높이고, 다양한 Variations와 리듬 변화, 방향 전환 등을 연습하며 춤의 폭을 넓혀갑니다. 새로운 동작을 배우는 것뿐만 아니라, 음악에 맞춰 더 자연스럽게 표현하고 파트너와 편안하게 소통하는 방법도 함께 익혀갑니다.",
            },
            en: {
              title: "Level 3 Saturday Class",
              description:
                "Level 3 builds on a solid understanding of the Swing Out and takes your Lindy Hop to the next level. You'll refine your Swing Out, explore a variety of variations, rhythm changes, and directional changes, and expand your range on the dance floor. Beyond learning new moves, you'll also develop smoother musical expression and more comfortable communication with different partners through connection, leading, and following.",
            },
          },
        },
        LEVEL4: {
          scheduleType: "PERIOD",
          startTime: "16:00",
          endTime: "17:30",
          fee: "90000",
          displayOrder: 4,
          roleSelectionEnabled: true,
          translations: {
            ko: {
              title: "레벨 4 토요일 수업",
              description:
                "레벨 4는 린디합을 더욱 깊이 있게 배우는 과정입니다. 움직임의 완성도와 음악성, 파트너와의 연결을 더욱 섬세하게 다듬으며, 다양한 리듬과 즉흥적인 표현을 통해 자신만의 스타일을 만들어갑니다. 새로운 동작을 익히는 것에 그치지 않고, 어떤 파트너와도 자연스럽게 호흡하며 자유롭고 즐겁게 춤출 수 있는 능력을 키우는 것을 목표로 합니다.",
            },
            en: {
              title: "Level 4 Saturday Class",
              description:
                "Level 4 is designed for experienced dancers who are ready to deepen their understanding of Lindy Hop. Building on a strong technical foundation, you'll refine movement quality, musicality, and partner communication while exploring advanced concepts, creative variations, and improvisation. The focus is not just on learning more figures, but on developing the confidence and versatility to express yourself naturally with any partner on the social dance floor.",
            },
          },
        },
        WORKSHOP: {
          scheduleType: "SINGLE_DAY",
          startTime: "16:30",
          endTime: "17:30",
          fee: "10000",
          displayOrder: 6,
          translations: {
            ko: {
              title: "월별 워크샵",
              description:
                "월별 워크샵은 매월 새로운 주제로 진행되는 단기 워크샵입니다. 가요 라인댄스, 재즈 라인댄스, 찰스턴 등 다양한 장르를 가볍게 경험하며 춤의 폭을 넓혀보세요.",
            },
            en: {
              title: "Monthly Workshop",
              description:
                "A special workshop held every month with a new theme. From swing dance to Pop Line Dance, Jazz Line Dance, Charleston, and more, it's a great opportunity to explore different styles and expand your dancing experience.",
            },
          },
        },
        EXPERIENCE: {
          scheduleType: "SINGLE_DAY",
          startTime: "19:00",
          endTime: "20:00",
          fee: "30000",
          displayOrder: 1,
          translations: {
            ko: {
              title: "레벨 1 원데이 클래스",
              description:
                "스윙댄스를 처음 접하는 분들을 위한 하루 체험 클래스입니다. 기본 리듬과 스텝, 파트너와 함께 춤추는 즐거움을 부담 없이 경험해 보세요. 정규 수업을 시작하기 전 스윙댄스와 스윙팝을 만나볼 수 있는 가장 좋은 첫걸음입니다.",
            },
            en: {
              title: "Level 1 One-Day Class",
              description:
                "A one-day introductory class designed for complete beginners. Experience the basics of swing dancing, including rhythm, footwork, and partner connection, in a fun and welcoming environment. It's the perfect first step to discover swing dancing and get to know the SwingPop community before joining our regular classes.",
            },
          },
        },
      },
    },
  },
  PARTY: {
    displayOrder: 1,
    startTime: "16:30",
    endTime: "22:00",
    location: KP_LOCATION,
    addressInfoEnabled: true,
    googleMapUrl: KP_GOOGLE_MAP_URL,
    naverMapUrl: KP_NAVER_MAP_URL,
    // No text defaults on purpose: every party is written from scratch.
  },
  DIALOGUE_PARTY: {
    weekday: WEEKDAY.WEDNESDAY,
    displayOrder: 3,
    startTime: "19:30",
    endTime: "22:00",
    location: DIALOGUE_LOCATION,
    addressInfoEnabled: true,
    googleMapUrl: DIALOGUE_GOOGLE_MAP_URL,
    naverMapUrl: DIALOGUE_NAVER_MAP_URL,
    translations: {
      ko: {
        title: "Dialogue 소셜댄스",
        shortDescription: "해방촌 Dialogue에서 스윙댄스 체험수업과 소셜댄스 이벤트를 진행합니다.",
        description:
          "해방촌 Dialogue에서 스윙댄스 체험수업과 소셜댄스 이벤트를 진행합니다. 처음 오시는 분들도 가볍게 참여할 수 있는 체험수업은 7:30~8:00에 진행되며, 이후 8:00~10:00에는 함께 음악을 즐기며 자유롭게 춤추는 소셜댄스 시간이 이어집니다. 스윙댄스를 처음 접하는 분들도 편하게 참여하실 수 있으니 많은 참여 부탁드립니다.",
      },
      en: {
        title: "Dialogue Social Dance",
        shortDescription: "Join us at Dialogue in Haebangchon for a swing dance trial class and social dance event.",
        description:
          "Join us at Dialogue in Haebangchon for a swing dance trial class and social dance event. The trial class will be held from 7:30 to 8:00, followed by social dancing from 8:00 to 10:00, where everyone can enjoy the music and dance freely together. Beginners are very welcome, so feel free to join us.",
      },
    },
    lesson: {
      defaultLessonType: "EXPERIENCE",
      byType: {
        EXPERIENCE: {
          scheduleType: "SINGLE_DAY",
          startTime: "19:30",
          endTime: "20:00",
          fee: "15000",
          displayOrder: 1,
          translations: {
            ko: {
              title: "다이얼로그 원데이 클래스",
              description:
                "다이얼로그 전에 진행되는 30분 체험 클래스입니다. 스윙댄스가 처음인 분도 부담 없이 기본 스텝과 리듬을 배우며 스윙댄스의 즐거움을 경험해 보세요.",
            },
            en: {
              title: "Dialogue One-Day Class",
              description:
                "A 30-minute introductory class held before Dialogue. It's a fun and easy way to experience swing dancing before joining the social dance.",
            },
          },
        },
      },
    },
  },
};

const COPY_TEXT = {
  Kor: {
    filters: "검색 조건",
    from: "시작일",
    to: "종료일",
    eventType: "이벤트 타입",
    eventStatus: "이벤트 상태",
    showFilters: "검색 조건",
    hideFilters: "검색 조건 닫기",
    all: "전체",
    events: "이벤트",
    createEvent: "이벤트 등록",
    edit: "수정",
    editEvent: "이벤트 수정",
    eventDetail: "이벤트 상세",
    noEvents: "이벤트가 없습니다.",
    selectEvent: "이벤트를 선택해주세요.",
    lessonBoard: "강습 목록",
    selectLesson: "강습을 선택해주세요.",
    close: "닫기",
    noLessonsInRange: "해당 기간에 강습이 없습니다.",
    addLesson: "강습 추가",
    editLesson: "강습 수정",
    promotion: "홍보 메시지 만들기",
    save: "저장",
    create: "등록",
    cancel: "취소",
    delete: "삭제",
    render: "미리보기 생성",
    copy: "복사하기",
    copied: "클립보드에 복사되었습니다.",
    loading: "불러오는 중",
    eventStartDate: "이벤트 시작일",
    eventEndDate: "이벤트 종료일",
    startTime: "시작 시간",
    endTime: "종료 시간",
    location: "장소",
    addressInfoEnabled: "주소 정보 입력하기",
    addressInfoEnabledDesc: "신청 완료 화면에 지도 링크를 표시합니다.",
    googleMapUrl: "구글지도 URL",
    naverMapUrl: "네이버지도 URL",
    displayOrder: "정렬 순서",
    languageInfo: "한국어/영어 정보",
    title: "제목",
    shortDescription: "간단 설명",
    description: "설명",
    lessons: "강습",
    lessonType: "강습 타입",
    scheduleType: "스케줄 타입",
    lessonStartDate: "강습 시작일",
    lessonEndDate: "강습 종료일",
    lessonStatus: "강습 상태",
    fee: "강습비",
    feePaymentNote: "현장에서 현금/계좌이체 해주세요.",
    currency: "통화",
    teachers: "강사",
    roleSelectionEnabled: "수업 등록 시 역할 선택하기",
    roleSelectionEnabledDesc: "활성화하면 수강생 신청 화면에서 리더 / 팔로워 / 모두 가능 역할을 선택합니다.",
    danceRole: "역할",
    danceRoles: {
      LEADER: "리더",
      FOLLOWER: "팔로워",
      BOTH: "리더/팔로워 모두 가능",
    },
    templates: "메시지 템플릿",
    templateCreateTitle: "템플릿 등록",
    templateEditTitle: "템플릿 수정",
    templateNew: "템플릿 등록",
    templateName: "템플릿명",
    templateType: "템플릿 유형",
    useYn: "사용 여부",
    content: "본문",
    variables: "사용 가능한 변수",
    preview: "미리보기",
    event: "이벤트",
    language: "언어",
    teachingSchedule: "내 강습 일정",
    lessonStatusFilter: "강습 상태",
    participants: "수강생",
    noParticipants: "신청자가 없습니다.",
    notices: "공지사항",
    noticePlaceholder: "수강생에게 전달할 공지사항을 입력하세요.",
    noticeSubmit: "공지 등록",
    noticeSaving: "등록 중",
    noticeLoadError: "공지사항을 불러오지 못했습니다.",
    noticeRequired: "공지 내용을 입력해주세요.",
    noticeAuthorFallback: "운영진",
    noticeEdit: "편집",
    noticeDelete: "삭제",
    noticeSave: "저장",
    noticeCancel: "취소",
    noticeConfirmDelete: "이 공지를 삭제할까요?",
    requestMemo: "질문사항 / 하고 싶은 말",
    noRequestMemo: "남긴 내용이 없습니다.",
    viewParticipantDetail: "상세 보기",
    removeApplication: "목록에서 제거",
    removeApplicationTitle: "수강생을 이 수업에서 제거할까요?",
    removeApplicationBody: "이 작업은 해당 수업의 수강 신청 목록에서만 제거됩니다.",
    removeApplicationConfirm: "제거하기",
    applicationRemoved: "수강 신청을 목록에서 제거했습니다.",
    legacyContact: "기존 연락처",
    contactMethods: {
      PHONE: "전화번호",
      KAKAO_TALK: "카카오톡",
      WHATSAPP: "WhatsApp",
      INSTAGRAM: "Instagram",
      EMAIL: "이메일",
    },
    noLessons: "강습이 없습니다.",
    eventSaved: "이벤트가 저장되었습니다.",
    lessonSaved: "강습이 저장되었습니다.",
    templateSaved: "템플릿이 저장되었습니다.",
    eventDeleted: "이벤트가 삭제되었습니다.",
    lessonDeleted: "강습이 삭제되었습니다.",
    templateDeleted: "템플릿이 삭제되었습니다.",
    confirmDeleteEvent: "이 이벤트를 삭제할까요?",
    confirmDeleteLesson: "이 강습을 삭제할까요?",
    confirmDeleteTemplate: "이 템플릿을 삭제할까요?",
    confirmLoadEventDefaults: "선택한 이벤트 타입의 기본 정보를 불러올까요? 현재 입력한 기본 정보가 덮어쓰기 됩니다.",
  },
  Eng: {
    filters: "Filters",
    from: "From",
    to: "To",
    eventType: "Event Type",
    eventStatus: "Event Status",
    showFilters: "Filters",
    hideFilters: "Hide Filters",
    all: "All",
    events: "Events",
    createEvent: "Create Event",
    edit: "Edit",
    editEvent: "Edit Event",
    eventDetail: "Event Detail",
    noEvents: "No events.",
    selectEvent: "Select an event.",
    lessonBoard: "Lessons",
    selectLesson: "Select a lesson.",
    close: "Close",
    noLessonsInRange: "No lessons in this range.",
    addLesson: "Add Lesson",
    editLesson: "Edit Lesson",
    promotion: "Create Promotion Message",
    save: "Save",
    create: "Create",
    cancel: "Cancel",
    delete: "Delete",
    render: "Generate Preview",
    copy: "Copy",
    copied: "Copied to clipboard.",
    loading: "Loading",
    eventStartDate: "Event Start Date",
    eventEndDate: "Event End Date",
    startTime: "Start Time",
    endTime: "End Time",
    location: "Location",
    addressInfoEnabled: "Enter address information",
    addressInfoEnabledDesc: "Show map links after a student completes an application.",
    googleMapUrl: "Google Maps URL",
    naverMapUrl: "Naver Map URL",
    displayOrder: "Display Order",
    languageInfo: "Korean / English Info",
    title: "Title",
    shortDescription: "Short Description",
    description: "Description",
    lessons: "Lessons",
    lessonType: "Lesson Type",
    scheduleType: "Schedule Type",
    lessonStartDate: "Lesson Start Date",
    lessonEndDate: "Lesson End Date",
    lessonStatus: "Lesson Status",
    fee: "Fee",
    feePaymentNote: "Please pay on site by cash or bank transfer.",
    currency: "Currency",
    teachers: "Teachers",
    roleSelectionEnabled: "Ask for role when applying",
    roleSelectionEnabledDesc: "When enabled, students choose Leader, Follower, or both roles on the application form.",
    danceRole: "Role",
    danceRoles: {
      LEADER: "Leader",
      FOLLOWER: "Follower",
      BOTH: "Leader / Follower both ok",
    },
    templates: "Message Templates",
    templateCreateTitle: "New Template",
    templateEditTitle: "Edit Template",
    templateNew: "New Template",
    templateName: "Template Name",
    templateType: "Template Type",
    useYn: "Use",
    content: "Content",
    variables: "Available Variables",
    preview: "Preview",
    event: "Event",
    language: "Language",
    teachingSchedule: "My Teaching Schedule",
    lessonStatusFilter: "Lesson Status",
    participants: "Participants",
    noParticipants: "No applications yet.",
    notices: "Notices",
    noticePlaceholder: "Write a notice for students.",
    noticeSubmit: "Post Notice",
    noticeSaving: "Posting",
    noticeLoadError: "Could not load notices.",
    noticeRequired: "Please write a notice.",
    noticeAuthorFallback: "Staff",
    noticeEdit: "Edit",
    noticeDelete: "Delete",
    noticeSave: "Save",
    noticeCancel: "Cancel",
    noticeConfirmDelete: "Delete this notice?",
    requestMemo: "Questions / Anything to share",
    noRequestMemo: "No memo left.",
    viewParticipantDetail: "View details",
    removeApplication: "Remove from list",
    removeApplicationTitle: "Remove this student from this lesson?",
    removeApplicationBody: "This only removes the application from this lesson's participant list.",
    removeApplicationConfirm: "Remove",
    applicationRemoved: "Application has been removed from the list.",
    legacyContact: "Previous contact",
    contactMethods: {
      PHONE: "Phone",
      KAKAO_TALK: "KakaoTalk",
      WHATSAPP: "WhatsApp",
      INSTAGRAM: "Instagram",
      EMAIL: "Email",
    },
    noLessons: "No lessons.",
    eventSaved: "Event has been saved.",
    lessonSaved: "Lesson has been saved.",
    templateSaved: "Template has been saved.",
    eventDeleted: "Event has been deleted.",
    lessonDeleted: "Lesson has been deleted.",
    templateDeleted: "Template has been deleted.",
    confirmDeleteEvent: "Delete this event?",
    confirmDeleteLesson: "Delete this lesson?",
    confirmDeleteTemplate: "Delete this template?",
    confirmLoadEventDefaults: "Load the default information for the selected event type? Current basic information will be overwritten.",
  },
};

function t(langCd) {
  return COPY_TEXT[langCd] || COPY_TEXT.Kor;
}

function eventTypeLabel(eventType, langCd) {
  return EVENT_TYPE_LABELS[langCd]?.[eventType] || eventType;
}

function eventStatusLabel(status, langCd) {
  return EVENT_STATUS_LABELS[langCd]?.[status] || status;
}

function toManualLanguage(langCd) {
  return langCd === "Eng" ? "en" : "ko";
}

function monthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    from: toDateInput(first),
    to: toDateInput(last),
    eventType: "",
    status: "",
  };
}

function emptyEventFilters() {
  return {
    from: "",
    to: "",
    eventType: "",
    status: "",
  };
}

function toDateInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toTimeInput(value) {
  return value ? String(value).slice(0, 5) : "";
}

function formatDateRange(startDate, endDate) {
  if (!startDate && !endDate) {
    return "-";
  }
  if (!endDate || startDate === endDate) {
    return startDate;
  }
  return `${startDate} - ${endDate}`;
}

function emptyEventForm() {
  return applyEventTypeDefaults({
    eventType: "REGULAR_CLASS",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    location: "",
    addressInfoEnabled: false,
    googleMapUrl: "",
    naverMapUrl: "",
    status: "PUBLISHED",
    displayOrder: 10,
    translations: {
      ko: { title: "", shortDescription: "", description: "" },
      en: { title: "", shortDescription: "", description: "" },
    },
  }, "REGULAR_CLASS");
}

// Resets the form to a type's defaults rather than merging into it. Called only
// when a blank form is built or the admin confirms the "load defaults" prompt,
// so "this type, from scratch" is the intent both times.
//
// Fields the type leaves undefined are cleared, not kept. A party defines no
// dates or text, and carrying the previous type's over meant picking 파티 could
// silently inherit Dialogue's title and its Wednesday dates. Declining the
// prompt still preserves everything — see applyEventTypeAddressDefaults.
function applyEventTypeDefaults(form, eventType) {
  const defaults = EVENT_TYPE_DEFAULTS[eventType] || {};
  const reset = (nextValue) => nextValue || "";

  return {
    ...form,
    eventType,
    // Recurring types land on next month's first and last matching weekday.
    startDate: reset(defaults.weekday === undefined ? "" : firstWeekdayOfNextMonth(defaults.weekday)),
    endDate: reset(defaults.weekday === undefined ? "" : lastWeekdayOfNextMonth(defaults.weekday)),
    displayOrder: defaults.displayOrder ?? form.displayOrder,
    startTime: reset(defaults.startTime),
    endTime: reset(defaults.endTime),
    location: reset(defaults.location),
    // Every venue is published with its address, so this is on for all types.
    addressInfoEnabled: true,
    googleMapUrl: reset(defaults.googleMapUrl),
    naverMapUrl: reset(defaults.naverMapUrl),
    translations: SUPPORTED_LANGUAGES.reduce((translations, languageCode) => {
      const defaultTranslation = defaults.translations?.[languageCode] || {};
      translations[languageCode] = {
        title: reset(defaultTranslation.title),
        shortDescription: reset(defaultTranslation.shortDescription),
        description: reset(defaultTranslation.description),
      };
      return translations;
    }, {}),
  };
}

// Used when the admin declines the "load defaults" prompt on a type change: the
// address block still follows the new type, since it describes the venue rather
// than anything the admin wrote.
function applyEventTypeAddressDefaults(form, eventType) {
  const defaults = EVENT_TYPE_DEFAULTS[eventType] || {};
  return {
    ...form,
    eventType,
    addressInfoEnabled: true,
    googleMapUrl: form.googleMapUrl || defaults.googleMapUrl || "",
    naverMapUrl: form.naverMapUrl || defaults.naverMapUrl || "",
  };
}

// Floor every lesson falls back to when its event type and lesson type define
// nothing more specific — a party's lessons, or a level nobody has filled in yet.
const LESSON_COMMON = {
  scheduleType: "SINGLE_DAY",
  startTime: "",
  endTime: "",
  fee: "0",
  displayOrder: 10,
  roleSelectionEnabled: false,
};

// Resolved in one place so a lesson's defaults are LESSON_COMMON overlaid with
// whatever the event type's lesson block says for that lesson type.
function lessonDefaultsFor(eventType, lessonType) {
  const byType = EVENT_TYPE_DEFAULTS[eventType]?.lesson?.byType?.[lessonType] || {};
  return { ...LESSON_COMMON, ...byType };
}

function defaultLessonType(event = null) {
  return EVENT_TYPE_DEFAULTS[event?.eventType]?.lesson?.defaultLessonType || "LEVEL1";
}

function defaultLessonScheduleType(event = null, lessonType = defaultLessonType(event)) {
  return lessonDefaultsFor(event?.eventType, lessonType).scheduleType;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function firstWeekdayOfNextMonth(weekday) {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  // How many days past the 1st the first matching weekday falls.
  const offset = (weekday - first.getDay() + 7) % 7;
  return toDateInputValue(new Date(first.getFullYear(), first.getMonth(), 1 + offset));
}

function lastWeekdayOfNextMonth(weekday) {
  const now = new Date();
  // Day 0 of the month after next is the last day of next month.
  const last = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  const offset = (last.getDay() - weekday + 7) % 7;
  return toDateInputValue(new Date(last.getFullYear(), last.getMonth(), last.getDate() - offset));
}

// Last calendar day of the month the given YYYY-MM-DD date falls in.
function lastDayOfMonthOf(dateStr) {
  if (!dateStr) {
    return "";
  }
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return toDateInputValue(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

// Lessons take their dates from the parent event: a PERIOD lesson runs the whole
// event, a single-day one sits on its opening day.
function emptyLessonForm(
  event = null,
  scheduleType = null,
  lessonType = defaultLessonType(event)
) {
  const defaults = lessonDefaultsFor(event?.eventType, lessonType);
  const resolvedScheduleType = scheduleType || defaults.scheduleType;
  const eventStartDate = event?.startDate || "";
  const eventEndDate = event?.endDate || eventStartDate;
  const startDate = eventStartDate;
  const endDate = resolvedScheduleType === "PERIOD" ? eventEndDate : eventStartDate;
  return {
    lessonType,
    scheduleType: resolvedScheduleType,
    startDate,
    endDate,
    startTime: defaults.startTime,
    endTime: defaults.endTime,
    fee: defaults.fee,
    currency: "KRW",
    status: "PUBLISHED",
    displayOrder: defaults.displayOrder,
    roleSelectionEnabled: defaults.roleSelectionEnabled,
    teacherUserIds: [],
    translations: SUPPORTED_LANGUAGES.reduce((translations, languageCode) => {
      const defaultTranslation = defaults.translations?.[languageCode] || {};
      translations[languageCode] = {
        title: defaultTranslation.title || "",
        description: defaultTranslation.description || "",
      };
      return translations;
    }, {}),
  };
}

function emptyTemplateForm() {
  return {
    templateName: "",
    templateType: "EVENT_PROMOTION",
    content: "",
    contentEn: "",
    useYn: "Y",
  };
}

function translation(entity, languageCode) {
  return entity?.translations?.[languageCode] || entity?.translations?.ko || {};
}

function eventTitle(event, languageCode) {
  return translation(event, languageCode).title || "-";
}

function lessonTitle(lesson, languageCode) {
  return translation(lesson, languageCode).title || "-";
}

function localizedTitle(titles, languageCode) {
  return titles?.[languageCode] || titles?.ko || "-";
}

function participantLegacyContactText(participant, copy) {
  if (!participant.contactValue) {
    return "";
  }
  const method = copy.contactMethods?.[participant.contactMethod] || participant.contactMethod || "-";
  return `${method}: ${participant.contactValue}`;
}

function participantSummaryText(participant, copy) {
  const details = [];
  if (!participant.danceRole) {
    return participantLegacyContactText(participant, copy);
  }
  details.push(`${copy.danceRole}: ${copy.danceRoles?.[participant.danceRole] || participant.danceRole}`);
  const contact = participantLegacyContactText(participant, copy);
  if (contact) {
    details.push(`${copy.legacyContact}: ${contact}`);
  }
  return details.join(" / ");
}

function previewText(value, maxLength = 80) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength)}...`;
}

function formatNoticeDate(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function noticeAuthorLabel(notice, copy) {
  const nickname = String(notice?.authorNickname || "").trim();
  const displayName = String(notice?.authorDisplayName || "").trim();
  if (nickname && displayName && nickname !== displayName) {
    return `${nickname} / ${displayName}`;
  }
  return nickname || displayName || copy.noticeAuthorFallback;
}

// `readOnly` hides only the compose form — reading past notices is part of
// viewing a lesson. Teachers keep posting notices from their own dashboard,
// where the backend already scopes them to lessons they are assigned to.
function LessonNoticePanel({ token, lessonId, copy, readOnly = false }) {
  const [notices, setNotices] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  const loadNotices = useCallback(async () => {
    if (!token || !lessonId) {
      setNotices([]);
      return;
    }
    setIsLoading(true);
    try {
      const nextNotices = await adminApi.findLessonNotices(token, lessonId);
      setNotices(Array.isArray(nextNotices) ? nextNotices : []);
      setError("");
    } catch {
      setNotices([]);
      setError(copy.noticeLoadError);
    } finally {
      setIsLoading(false);
    }
  }, [copy.noticeLoadError, lessonId, token]);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedContent = content.trim();
    if (!normalizedContent) {
      setError(copy.noticeRequired);
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await adminApi.createLessonNotice(token, lessonId, { content: normalizedContent });
      setContent("");
      await loadNotices();
    } catch (nextError) {
      setError(nextError.message || copy.noticeLoadError);
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (notice) => {
    setEditingId(notice.id);
    setEditingContent(notice.content || "");
    setError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingContent("");
  };

  const handleUpdate = async (notice) => {
    const normalizedContent = editingContent.trim();
    if (!normalizedContent) {
      setError(copy.noticeRequired);
      return;
    }
    setIsMutating(true);
    setError("");
    try {
      await adminApi.updateLessonNotice(token, lessonId, notice.id, { content: normalizedContent });
      cancelEdit();
      await loadNotices();
    } catch (nextError) {
      setError(nextError.message || copy.noticeLoadError);
    } finally {
      setIsMutating(false);
    }
  };

  const handleDelete = async (notice) => {
    if (!window.confirm(copy.noticeConfirmDelete)) {
      return;
    }
    setIsMutating(true);
    setError("");
    try {
      await adminApi.deleteLessonNotice(token, lessonId, notice.id);
      if (editingId === notice.id) {
        cancelEdit();
      }
      await loadNotices();
    } catch (nextError) {
      setError(nextError.message || copy.noticeLoadError);
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <section className="mt-4 rounded-lg border border-swing-border/30 bg-swing-paper p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold text-swing-muted">{copy.notices}</h4>
        {isLoading ? <span className="text-xs text-swing-muted/70">{copy.loading}</span> : null}
      </div>
      {readOnly ? null : (
      <form onSubmit={handleSubmit} className="mt-3 grid gap-2">
        <TextArea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setError("");
          }}
          maxLength={2000}
          rows={3}
          placeholder={copy.noticePlaceholder}
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Notice>{error}</Notice>
          <PrimaryButton type="submit" disabled={isSaving} className="ml-auto">
            {isSaving ? copy.noticeSaving : copy.noticeSubmit}
          </PrimaryButton>
        </div>
      </form>
      )}
      {notices.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-md border border-swing-border/30 bg-swing-cream/50 px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xs font-semibold text-swing-muted">
                  {noticeAuthorLabel(notice, copy)} · {formatNoticeDate(notice.createdAt)}
                </div>
                {editingId !== notice.id ? (
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(notice)}
                      disabled={isMutating}
                      className="text-xs font-semibold text-swing-teal-deep hover:underline disabled:opacity-50"
                    >
                      {copy.noticeEdit}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(notice)}
                      disabled={isMutating}
                      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                    >
                      {copy.noticeDelete}
                    </button>
                  </div>
                ) : null}
              </div>
              {editingId === notice.id ? (
                <div className="mt-2 grid gap-2">
                  <TextArea
                    value={editingContent}
                    onChange={(event) => {
                      setEditingContent(event.target.value);
                      setError("");
                    }}
                    maxLength={2000}
                    rows={3}
                  />
                  <div className="flex items-center justify-end gap-2">
                    <SecondaryButton type="button" onClick={cancelEdit} disabled={isMutating}>
                      {copy.noticeCancel}
                    </SecondaryButton>
                    <PrimaryButton type="button" onClick={() => handleUpdate(notice)} disabled={isMutating}>
                      {isMutating ? copy.noticeSaving : copy.noticeSave}
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-swing-ink">{notice.content}</p>
              )}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ParticipantList({ participants, copy, onRemoveParticipant }) {
  const items = Array.isArray(participants) ? participants : [];
  return (
    <div className="mt-4 w-full basis-full rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-swing-muted">{copy.participants}</div>
        <div className="text-sm font-bold text-swing-ink">{items.length}</div>
      </div>
      {items.length > 0 ? (
        <div className="participant-card-grid mt-3">
          {items.map((participant) => (
            <div key={participant.id} className="min-w-0 rounded-md border border-swing-border/30 bg-swing-paper px-3 py-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 text-sm font-semibold text-swing-ink">
                  <MemberNameLabel name={participant.applicantName} status={participant.memberStatus} />
                </div>
                {onRemoveParticipant ? (
                  <button
                    type="button"
                    onClick={() => onRemoveParticipant(participant)}
                    className="shrink-0 rounded-md border border-red-200 bg-swing-paper px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                  >
                    {copy.removeApplication}
                  </button>
                ) : null}
              </div>
              {participantSummaryText(participant, copy) ? (
                <div className="mt-1 text-xs text-swing-muted">{participantSummaryText(participant, copy)}</div>
              ) : null}
              {participant.requestMemo ? (
                <div className="mt-2 rounded-md bg-swing-cream/50 px-2.5 py-2 text-xs leading-5 text-swing-ink/80">
                  <span className="font-semibold text-swing-ink">{copy.requestMemo}: </span>
                  {previewText(participant.requestMemo)}
                </div>
              ) : null}
              <details className="mt-2 text-xs text-swing-ink/80">
                <summary className="cursor-pointer font-semibold text-swing-teal-deep">{copy.viewParticipantDetail}</summary>
                <div className="mt-2 rounded-md border border-swing-border/30 bg-swing-cream/50 px-3 py-2">
                  <div className="font-semibold text-swing-ink">{copy.requestMemo}</div>
                  <p className="mt-1 whitespace-pre-wrap leading-5 text-swing-ink/80">
                    {participant.requestMemo || copy.noRequestMemo}
                  </p>
                  {participantLegacyContactText(participant, copy) ? (
                    <div className="mt-3">
                      <div className="font-semibold text-swing-ink">{copy.legacyContact}</div>
                      <div className="mt-1 text-swing-ink/80">{participantLegacyContactText(participant, copy)}</div>
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs text-swing-muted">{copy.noParticipants}</div>
      )}
    </div>
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
      className="min-h-[40px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 text-sm text-swing-ink outline-none transition focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
    />
  );
}

function SelectInput(props) {
  return (
    <select
      {...props}
      className="min-h-[40px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 text-sm text-swing-ink outline-none transition focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
    />
  );
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-[96px] w-full rounded-lg border border-swing-border/70 bg-swing-cream px-3 py-2 text-sm leading-6 text-swing-ink outline-none transition focus:border-swing-teal focus:ring-2 focus:ring-swing-teal/40 disabled:bg-swing-paper disabled:text-swing-muted"
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
  return <div className={`rounded-lg border px-3 py-2 text-sm ${className}`}>{children}</div>;
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-swing-border/30 bg-swing-cream/50 px-2.5 py-1 text-xs font-semibold text-swing-muted">
      {children}
    </span>
  );
}

function PrimaryButton(props) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[40px] items-center justify-center rounded-lg bg-swing-teal-deep px-4 text-sm font-semibold text-swing-paper transition hover:bg-swing-teal disabled:cursor-not-allowed disabled:bg-swing-sage disabled:text-swing-ink/70 ${props.className || ""}`}
    />
  );
}

function SecondaryButton(props) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[40px] items-center justify-center rounded-lg border border-swing-border/55 bg-swing-paper px-4 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50 disabled:cursor-not-allowed disabled:text-swing-muted/45 ${props.className || ""}`}
    />
  );
}

function DangerButton(props) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[40px] items-center justify-center rounded-lg border border-red-200 bg-swing-paper px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-swing-muted/45 ${props.className || ""}`}
    />
  );
}

function LanguageTabs({ activeLanguage, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-swing-border/30 bg-swing-cream/50 p-1">
      {SUPPORTED_LANGUAGES.map((languageCode) => (
        <button
          key={languageCode}
          type="button"
          onClick={() => onChange(languageCode)}
          className={`min-h-[32px] rounded-md px-3 text-xs font-semibold ${
            activeLanguage === languageCode ? "bg-swing-paper text-swing-teal-deep shadow-sm" : "text-swing-muted hover:text-swing-ink"
          }`}
        >
          {languageCode === "ko" ? "한국어" : "English"}
        </button>
      ))}
    </div>
  );
}

function EventForm({ langCd, initialValue, onSubmit, onCancel, isSaving }) {
  const copy = t(langCd);
  const [form, setForm] = useState(initialValue || emptyEventForm());
  const [activeLanguage, setActiveLanguage] = useState("ko");

  useEffect(() => {
    setForm(initialValue || emptyEventForm());
  }, [initialValue]);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    if (name === "eventType") {
      const shouldApplyDefaults = window.confirm(copy.confirmLoadEventDefaults);
      setForm((current) =>
        shouldApplyDefaults
          ? applyEventTypeDefaults(current, value)
          : applyEventTypeAddressDefaults(current, value)
      );
      return;
    }
    if (name === "addressInfoEnabled") {
      setForm((current) => ({
        ...current,
        addressInfoEnabled: checked,
        googleMapUrl:
          checked && !current.googleMapUrl
            ? EVENT_TYPE_DEFAULTS[current.eventType]?.googleMapUrl || ""
            : current.googleMapUrl,
        naverMapUrl:
          checked && !current.naverMapUrl
            ? EVENT_TYPE_DEFAULTS[current.eventType]?.naverMapUrl || ""
            : current.naverMapUrl,
      }));
      return;
    }
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTranslationChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLanguage]: {
          ...current.translations[activeLanguage],
          [name]: value,
        },
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      displayOrder: Number(form.displayOrder || 0),
      translations: normalizeTranslations(form.translations),
    });
  };

  const activeTranslation = form.translations[activeLanguage];

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
        <h2 className="text-lg font-bold text-swing-ink">{initialValue?.id ? copy.editEvent : copy.createEvent}</h2>
        <SecondaryButton type="button" onClick={onCancel}>
          {copy.cancel}
        </SecondaryButton>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label={copy.eventType}>
          <SelectInput name="eventType" value={form.eventType} onChange={handleChange}>
            {EVENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {eventTypeLabel(value, langCd)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={copy.eventStatus}>
          <SelectInput name="status" value={form.status} onChange={handleChange}>
            {EVENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {eventStatusLabel(value, langCd)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={copy.eventStartDate}>
          <TextInput type="date" name="startDate" value={form.startDate} onChange={handleChange} />
        </Field>
        <Field label={copy.eventEndDate}>
          <TextInput type="date" name="endDate" value={form.endDate} onChange={handleChange} />
        </Field>
        <Field label={copy.displayOrder}>
          <TextInput type="number" name="displayOrder" value={form.displayOrder} onChange={handleChange} />
        </Field>
        <Field label={copy.startTime}>
          <TextInput type="time" name="startTime" value={toTimeInput(form.startTime)} onChange={handleChange} />
        </Field>
        <Field label={copy.endTime}>
          <TextInput type="time" name="endTime" value={toTimeInput(form.endTime)} onChange={handleChange} />
        </Field>
        <div className="md:col-span-2">
          <Field label={copy.location}>
            <TextInput name="location" value={form.location} onChange={handleChange} />
          </Field>
        </div>
        <label className="flex items-start gap-3 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3 md:col-span-2">
          <input
            type="checkbox"
            name="addressInfoEnabled"
            checked={Boolean(form.addressInfoEnabled)}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
          />
          <span>
            <span className="block text-sm font-semibold text-swing-ink">{copy.addressInfoEnabled}</span>
            <span className="mt-1 block text-xs leading-5 text-swing-muted">{copy.addressInfoEnabledDesc}</span>
          </span>
        </label>
        {form.addressInfoEnabled ? (
          <>
            <Field label={copy.googleMapUrl}>
              <TextInput name="googleMapUrl" value={form.googleMapUrl} onChange={handleChange} />
            </Field>
            <Field label={copy.naverMapUrl}>
              <TextInput name="naverMapUrl" value={form.naverMapUrl} onChange={handleChange} />
            </Field>
          </>
        ) : null}
      </div>
      <div className="mt-5 border-t border-swing-border/30 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-swing-ink">{copy.languageInfo}</h3>
          <LanguageTabs activeLanguage={activeLanguage} onChange={setActiveLanguage} />
        </div>
        <div className="mt-4 grid gap-4">
          <Field label={activeLanguage === "ko" ? "한국어 제목" : "English Title"}>
            <TextInput name="title" value={activeTranslation.title} onChange={handleTranslationChange} />
          </Field>
          <Field label={activeLanguage === "ko" ? "한국어 간단 설명" : "English Short Description"}>
            <TextInput name="shortDescription" value={activeTranslation.shortDescription} onChange={handleTranslationChange} />
          </Field>
          <Field label={activeLanguage === "ko" ? "한국어 설명" : "English Description"}>
            <TextArea name="description" value={activeTranslation.description} onChange={handleTranslationChange} rows={5} />
          </Field>
        </div>
      </div>
      <PrimaryButton type="submit" disabled={isSaving} className="mt-5 w-full">
        {initialValue?.id ? copy.save : copy.create}
      </PrimaryButton>
    </form>
  );
}

function LessonForm({ langCd, teachers, parentEvent, initialValue, onSubmit, onCancel, isSaving }) {
  const copy = t(langCd);
  const isEditing = Boolean(initialValue?.id);
  const [form, setForm] = useState(initialValue || emptyLessonForm(parentEvent));
  const [activeLanguage, setActiveLanguage] = useState("ko");

  useEffect(() => {
    setForm(initialValue || emptyLessonForm(parentEvent));
  }, [parentEvent, initialValue]);

  const handleChange = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((current) => {
      const nextValue = type === "checkbox" ? checked : value;
      // Picking a level reloads that level's defaults, the way the event form
      // reloads on a type change. Only on a new lesson: reshaping something
      // already saved would throw away what the admin wrote.
      if (name === "lessonType" && !isEditing) {
        return emptyLessonForm(parentEvent, null, nextValue);
      }
      if (name === "scheduleType" && !isEditing) {
        const nextDefaults = emptyLessonForm(parentEvent, nextValue, current.lessonType);
        const nextStartDate = current.startDate || nextDefaults.startDate;
        const nextEndDate =
          nextValue === "PERIOD" ? lastDayOfMonthOf(nextStartDate) : nextStartDate;
        return {
          ...current,
          scheduleType: nextValue,
          startDate: nextStartDate,
          endDate: nextEndDate,
        };
      }
      if (name === "scheduleType") {
        return { ...current, scheduleType: nextValue };
      }
      if (name === "startDate") {
        // PERIOD: end date always snaps to the last day of the start's month (the user
        // can still override it afterwards). SINGLE_DAY: end mirrors the start.
        const nextEndDate =
          current.scheduleType === "PERIOD" ? lastDayOfMonthOf(nextValue) : nextValue;
        return { ...current, startDate: nextValue, endDate: nextEndDate };
      }
      return { ...current, [name]: nextValue };
    });
  };

  const handleTeacherToggle = (teacherUserId) => {
    setForm((current) => {
      const exists = current.teacherUserIds.includes(teacherUserId);
      return {
        ...current,
        teacherUserIds: exists
          ? current.teacherUserIds.filter((id) => id !== teacherUserId)
          : [...current.teacherUserIds, teacherUserId],
      };
    });
  };

  const handleTranslationChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [activeLanguage]: {
          ...current.translations[activeLanguage],
          [name]: value,
        },
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const shouldMirrorStartDate = form.scheduleType === "SINGLE_DAY" && parentEvent?.eventType !== "DIALOGUE_PARTY";
    onSubmit({
      ...form,
      endDate: shouldMirrorStartDate ? form.startDate : form.endDate,
      fee: Number(form.fee || 0),
      displayOrder: Number(form.displayOrder || 0),
      translations: normalizeLessonTranslations(form.translations),
    });
  };

  const activeTranslation = form.translations[activeLanguage];

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
        <h2 className="text-lg font-bold text-swing-ink">{initialValue?.id ? copy.editLesson : copy.addLesson}</h2>
        <SecondaryButton type="button" onClick={onCancel}>
          {copy.cancel}
        </SecondaryButton>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Field label={copy.lessonType}>
          <SelectInput name="lessonType" value={form.lessonType} onChange={handleChange}>
            {LESSON_TYPES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field label={copy.scheduleType}>
          <SelectInput name="scheduleType" value={form.scheduleType} onChange={handleChange}>
            <option value="SINGLE_DAY">SINGLE_DAY</option>
            <option value="PERIOD">PERIOD</option>
          </SelectInput>
        </Field>
        <Field label={copy.lessonStatus}>
          <SelectInput name="status" value={form.status} onChange={handleChange}>
            {LESSON_STATUSES.map((value) => (
              <option key={value} value={value}>
                {eventStatusLabel(value, langCd)}
              </option>
            ))}
          </SelectInput>
        </Field>
        <label className="flex items-start gap-3 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3 md:col-span-2">
          <input
            type="checkbox"
            name="roleSelectionEnabled"
            checked={Boolean(form.roleSelectionEnabled)}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-swing-border/60 text-swing-teal-deep focus:ring-swing-teal"
          />
          <span>
            <span className="block text-sm font-semibold text-swing-ink">{copy.roleSelectionEnabled}</span>
            <span className="mt-1 block text-xs leading-5 text-swing-muted">{copy.roleSelectionEnabledDesc}</span>
          </span>
        </label>
        <Field label={copy.lessonStartDate}>
          <TextInput type="date" name="startDate" value={form.startDate} onChange={handleChange} required />
        </Field>
        {form.scheduleType === "PERIOD" ? (
          <Field label={copy.lessonEndDate}>
            <TextInput
              type="date"
              name="endDate"
              value={form.endDate}
              min={form.startDate || undefined}
              disabled={!form.startDate}
              onChange={handleChange}
            />
          </Field>
        ) : null}
        <Field label={copy.startTime}>
          <TextInput type="time" name="startTime" value={toTimeInput(form.startTime)} onChange={handleChange} />
        </Field>
        <Field label={copy.endTime}>
          <TextInput type="time" name="endTime" value={toTimeInput(form.endTime)} onChange={handleChange} />
        </Field>
        <Field label={copy.fee}>
          <TextInput type="number" name="fee" value={form.fee} onChange={handleChange} />
        </Field>
        <Field label={copy.currency}>
          <TextInput name="currency" value={form.currency} onChange={handleChange} />
        </Field>
        <Field label={copy.displayOrder}>
          <TextInput type="number" name="displayOrder" value={form.displayOrder} onChange={handleChange} />
        </Field>
      </div>
      <div className="mt-5">
        <div className="text-xs font-semibold text-swing-muted">{copy.teachers}</div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {teachers.map((teacher) => (
            <label key={teacher.teacherUserId} className="flex items-center gap-2 rounded-lg border border-swing-border/30 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.teacherUserIds.includes(teacher.teacherUserId)}
                onChange={() => handleTeacherToggle(teacher.teacherUserId)}
              />
              <span className="font-semibold text-swing-ink">{teacher.teacherUserNm}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="mt-5 border-t border-swing-border/30 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-swing-ink">{copy.languageInfo}</h3>
          <LanguageTabs activeLanguage={activeLanguage} onChange={setActiveLanguage} />
        </div>
        <div className="mt-4 grid gap-4">
          <Field label={activeLanguage === "ko" ? "한국어 제목" : "English Title"}>
            <TextInput name="title" value={activeTranslation.title} onChange={handleTranslationChange} />
          </Field>
          <Field label={activeLanguage === "ko" ? "한국어 설명" : "English Description"}>
            <TextArea name="description" value={activeTranslation.description} onChange={handleTranslationChange} rows={5} />
          </Field>
        </div>
      </div>
      <PrimaryButton type="submit" disabled={isSaving} className="mt-5 w-full">
        {initialValue?.id ? copy.save : copy.create}
      </PrimaryButton>
    </form>
  );
}

/**
 * What one lesson looks like when opened from 강습조회: who applied and what has
 * been announced. It is a modal rather than a pane below the list because the
 * list is the screen — a lesson is looked at, dealt with, and closed, and on a
 * phone the old layout pushed the detail off the bottom of the index that
 * produced it.
 */
function LessonDetailModal({ token, lesson, copy, languageCode, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[70] flex items-start justify-center bg-swing-ink/40 p-4 sm:p-8"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Capped to the viewport with the body scrolling inside it: a lesson with
          thirty applicants and a notice thread is taller than a phone, and
          scrolling the whole card would carry the title and 닫기 off the top. */}
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-swing-border/30 bg-swing-paper shadow-lg">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-swing-border/30 p-5">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-swing-ink">{localizedTitle(lesson.lessonTitles, languageCode)}</h2>
            <div className="mt-1 text-sm text-swing-muted">{localizedTitle(lesson.eventTitles, languageCode)}</div>
            {/* Teachers and time share one line: the event, type, status and
                dates are all already on the row that got you here. */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-swing-muted">
              {lesson.teachers.length > 0 ? (
                <span>{lesson.teachers.map((teacher) => teacher.teacherUserNm).join(", ")}</span>
              ) : null}
              <Badge>
                {toTimeInput(lesson.startTime)}-{toTimeInput(lesson.endTime)}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg border border-swing-border/45 px-3 py-2 text-sm font-semibold text-swing-ink/80 transition hover:bg-swing-cream/50"
          >
            {copy.close}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          <ParticipantList participants={lesson.participants} copy={copy} onRemoveParticipant={null} />
          {/* Notices are writable here, teachers included — the server allows a
              teacher to manage notices on lessons they are assigned to. */}
          <LessonNoticePanel token={token} lessonId={lesson.lessonId} copy={copy} />
        </div>
      </div>
    </div>
  );
}

/**
 * 강습조회. Lesson-first rather than event-first: the row you pick is a lesson,
 * and what you get is who applied to it and what has been announced on it. The
 * event exists here only as the second half of a label, because that is the
 * only part of it this screen needs.
 *
 * Registration lives in EventManagementPanel; nothing here writes.
 */
export function LessonBoardPanel({ token, langCd }) {
  const copy = t(langCd);
  const languageCode = toManualLanguage(langCd);
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [isListOpen, setIsListOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // No date filter: the whole published schedule, which the server already
  // narrows to a teacher's own lessons when that is who is asking.
  const loadLessons = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await adminApi.findLessonBoard(token, { status: "PUBLISHED" });
      setLessons(list || []);
      setError("");
    } catch (nextError) {
      setLessons([]);
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const selectedLesson = lessons.find((lesson) => lesson.lessonId === selectedLessonId) || null;

  return (
    <section className="grid min-w-0 content-start gap-5 [&>*]:min-w-0">
      <aside className="rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm">
        {/* The list no longer collapses when a lesson is picked: the lesson
            opens over it in a modal, so the index it came from is still there
            underneath when the modal closes. */}
        <button
          type="button"
          onClick={() => setIsListOpen((current) => !current)}
          aria-expanded={isListOpen}
          className={`flex w-full flex-wrap items-center justify-between gap-2 text-left ${
            isListOpen ? "border-b border-swing-border/30 pb-3" : ""
          }`}
        >
          <h2 className="text-lg font-bold text-swing-ink">{copy.lessonBoard}</h2>
          <span className="text-xs font-semibold text-swing-muted">
            {lessons.length}
            <span className="ml-2 text-swing-muted/70">{isListOpen ? "▲" : "▼"}</span>
          </span>
        </button>

        <Notice>{error}</Notice>

        <div className={`mt-3 gap-2 sm:grid-cols-2 xl:grid-cols-3 ${isListOpen ? "grid" : "hidden"}`}>
          {!isLoading && lessons.length === 0 ? (
            <div className="py-6 text-center text-sm text-swing-muted sm:col-span-2 xl:col-span-3">
              {copy.noLessonsInRange}
            </div>
          ) : null}
          {lessons.map((lesson) => {
            const isActive = lesson.lessonId === selectedLessonId;

            return (
              <button
                key={lesson.lessonId}
                type="button"
                onClick={() => setSelectedLessonId(lesson.lessonId)}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                    : "border-swing-border/30 hover:bg-swing-cream/50"
                }`}
              >
                {/* Event names are long enough that they wrap anyway, so they
                    start on their own line rather than trailing off the end of
                    the lesson title. */}
                <div className="text-sm font-semibold">{localizedTitle(lesson.lessonTitles, languageCode)}</div>
                <div className={`text-xs ${isActive ? "text-swing-paper/70" : "text-swing-muted"}`}>
                  {localizedTitle(lesson.eventTitles, languageCode)}
                </div>
                <div className={`mt-1 text-xs ${isActive ? "text-swing-paper/60" : "text-swing-muted/80"}`}>
                  {formatDateRange(lesson.startDate, lesson.endDate)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {selectedLesson ? (
        <LessonDetailModal
          token={token}
          lesson={selectedLesson}
          copy={copy}
          languageCode={languageCode}
          onClose={() => setSelectedLessonId(null)}
        />
      ) : null}
    </section>
  );
}

// 이벤트/강습 등록. Reading is LessonBoardPanel's job, so this one always
// carries its write controls; the server still gates them by role.
export default function EventManagementPanel({ token, currentUser, langCd }) {
  const copy = t(langCd);
  const languageCode = toManualLanguage(langCd);
  const [filters, setFilters] = useState(() => emptyEventFilters());
  const [showEventFilters, setShowEventFilters] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [mode, setMode] = useState("detail");
  const [eventForm, setEventForm] = useState(null);
  const [lessonForm, setLessonForm] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);
  const [promotion, setPromotion] = useState({ templateId: "", languageCode, renderedText: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [removingParticipant, setRemovingParticipant] = useState(null);
  const [isRemovingParticipant, setIsRemovingParticipant] = useState(false);
  const canEdit = hasRole(currentUser, "SUPER_ADMIN") || hasRole(currentUser, "STAFF");
  const canDelete = canEdit && hasRole(currentUser, "SUPER_ADMIN");
  const canRemoveApplication = canEdit;

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await adminApi.findEvents(token, filters);
      setEvents(data);
      // Keep the current selection only while it is still in the list. Filtering
      // it away used to leave it selected, and since the detail pane fetches by
      // id rather than reading the list, the panel below went on showing the
      // lessons of an event the results no longer contained.
      setSelectedEventId((currentId) => {
        const stillListed = currentId !== null && data.some((event) => event.id === currentId);
        return stillListed ? currentId : data[0]?.id ?? null;
      });
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  }, [filters, token]);

  const loadSupportData = useCallback(async () => {
    try {
      const [nextTeachers, nextTemplates] = await Promise.all([
        adminApi.findActiveTeachers(token),
        adminApi.findMessageTemplates(token),
      ]);
      setTeachers(nextTeachers);
      setTemplates(nextTemplates.filter((template) => template.useYn === "Y"));
      setPromotion((current) => ({
        ...current,
        templateId: current.templateId || nextTemplates.find((template) => template.useYn === "Y")?.id || "",
      }));
    } catch (nextError) {
      setError(nextError.message);
    }
  }, [token]);

  const loadEventDetail = useCallback(async () => {
    if (!selectedEventId) {
      setSelectedEvent(null);
      return;
    }
    try {
      setSelectedEvent(await adminApi.findEvent(token, selectedEventId));
    } catch (nextError) {
      setError(nextError.message);
    }
  }, [selectedEventId, token]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadSupportData();
  }, [loadSupportData]);

  useEffect(() => {
    loadEventDetail();
  }, [loadEventDetail]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  const startCreateEvent = () => {
    setMode("eventForm");
    setEventForm(emptyEventForm());
    setShowEventFilters(false);
    setNotice("");
    setError("");
  };

  const startEditEvent = () => {
    if (!selectedEvent) {
      return;
    }
    setMode("eventForm");
    setEventForm(toEventForm(selectedEvent));
    setNotice("");
    setError("");
  };

  const saveEvent = async (payload) => {
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const { id, ...body } = payload;
      const saved = id ? await adminApi.updateEvent(token, id, body) : await adminApi.createEvent(token, body);
      setNotice(copy.eventSaved);
      setSelectedEventId(saved.id);
      setSelectedEvent(saved);
      setMode("detail");
      await loadEvents();
      await loadEventDetail();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteEvent = async () => {
    if (!selectedEvent || !window.confirm(copy.confirmDeleteEvent)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await adminApi.deleteEvent(token, selectedEvent.id);
      setNotice(copy.eventDeleted);
      setSelectedEventId(null);
      setSelectedEvent(null);
      await loadEvents();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const startCreateLesson = async () => {
    if (!selectedEvent) {
      return;
    }
    setError("");
    setNotice("");
    try {
      const freshEvent = await adminApi.findEvent(token, selectedEvent.id);
      setSelectedEvent(freshEvent);
      setMode("lessonForm");
      setEditingLessonId(null);
      setLessonForm(emptyLessonForm(freshEvent));
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const startEditLesson = (lesson) => {
    setMode("lessonForm");
    setEditingLessonId(lesson.id);
    setLessonForm(toLessonForm(lesson));
    setNotice("");
    setError("");
  };

  const saveLesson = async (payload) => {
    if (!selectedEvent) {
      return;
    }
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const { id, ...body } = payload;
      if (editingLessonId) {
        await adminApi.updateLesson(token, editingLessonId, body);
      } else {
        await adminApi.createLesson(token, selectedEvent.id, body);
      }
      setNotice(copy.lessonSaved);
      setMode("detail");
      await loadEventDetail();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLesson = async (lesson) => {
    if (!window.confirm(copy.confirmDeleteLesson)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await adminApi.deleteLesson(token, lesson.id);
      setNotice(copy.lessonDeleted);
      await loadEventDetail();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const startRemoveParticipant = (lesson, participant) => {
    setRemovingParticipant({ lesson, participant });
    setError("");
    setNotice("");
  };

  const cancelRemoveParticipant = () => {
    if (isRemovingParticipant) {
      return;
    }
    setRemovingParticipant(null);
  };

  const confirmRemoveParticipant = async () => {
    if (!removingParticipant?.participant) {
      return;
    }
    setIsRemovingParticipant(true);
    setError("");
    setNotice("");
    try {
      await adminApi.removeEventApplication(token, removingParticipant.participant.id, { reason: null });
      setNotice(copy.applicationRemoved);
      setRemovingParticipant(null);
      await loadEventDetail();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsRemovingParticipant(false);
    }
  };

  const renderPromotion = async () => {
    if (!selectedEvent || !promotion.templateId) {
      return;
    }
    setError("");
    setNotice("");
    try {
      const response = await adminApi.renderMessageTemplate(token, promotion.templateId, {
        eventId: selectedEvent.id,
        languageCode: promotion.languageCode,
      });
      setPromotion((current) => ({ ...current, renderedText: response.renderedText }));
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const copyPromotion = async () => {
    await navigator.clipboard.writeText(promotion.renderedText);
    setNotice(copy.copied);
  };

  const selectedTitle = selectedEvent ? eventTitle(selectedEvent, languageCode) : "";

  return (
    <section className="grid gap-5 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{copy.events}</h2>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={() => setShowEventFilters((current) => !current)}>
              {showEventFilters ? copy.hideFilters : copy.showFilters}
            </SecondaryButton>
            {canEdit ? (
              <PrimaryButton type="button" onClick={startCreateEvent}>
                {copy.createEvent}
              </PrimaryButton>
            ) : null}
          </div>
        </div>
        {showEventFilters ? (
          <div className="mt-4 grid gap-3">
            <Field label={copy.from}>
              <TextInput type="date" name="from" value={filters.from} onChange={handleFilterChange} />
            </Field>
            <Field label={copy.to}>
              <TextInput type="date" name="to" value={filters.to} onChange={handleFilterChange} />
            </Field>
            <Field label={copy.eventType}>
              <SelectInput name="eventType" value={filters.eventType} onChange={handleFilterChange}>
                <option value="">{copy.all}</option>
                {EVENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {eventTypeLabel(value, langCd)}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={copy.eventStatus}>
              <SelectInput name="status" value={filters.status} onChange={handleFilterChange}>
                <option value="">{copy.all}</option>
                {EVENT_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {eventStatusLabel(value, langCd)}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
        ) : null}
        <div className="mt-4 grid gap-2">
          {isLoading ? <div className="text-sm text-swing-muted">{copy.loading}</div> : null}
          {!isLoading && events.length === 0 ? <div className="text-sm text-swing-muted">{copy.noEvents}</div> : null}
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => {
                setSelectedEventId(event.id);
                setMode("detail");
              }}
              className={`rounded-lg border px-3 py-3 text-left transition ${
                selectedEventId === event.id
                  ? "border-swing-teal bg-swing-teal/10"
                  : "border-swing-border/30 bg-swing-paper hover:border-swing-border/45 hover:bg-swing-cream/50"
              }`}
            >
              <div className="text-sm font-bold text-swing-ink">{eventTitle(event, languageCode)}</div>
              <div className="mt-1 text-xs text-swing-muted">
                {formatDateRange(event.startDate, event.endDate)} / {eventTypeLabel(event.eventType, langCd)}
              </div>
              <div className="mt-2">
                <Badge>{eventStatusLabel(event.status, langCd)}</Badge>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <div className="grid gap-4">
        <Notice>{error}</Notice>
        <Notice type="success">{notice}</Notice>

        {mode === "eventForm" ? (
          <EventForm
            langCd={langCd}
            initialValue={eventForm}
            onSubmit={saveEvent}
            onCancel={() => setMode("detail")}
            isSaving={isSaving}
          />
        ) : null}

        {mode === "lessonForm" ? (
          <LessonForm
            langCd={langCd}
            teachers={teachers}
            parentEvent={selectedEvent}
            initialValue={lessonForm}
            onSubmit={saveLesson}
            onCancel={() => setMode("detail")}
            isSaving={isSaving}
          />
        ) : null}

        {mode === "promotion" && selectedEvent ? (
          <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
              <div>
                <h2 className="text-lg font-bold text-swing-ink">{copy.promotion}</h2>
                <div className="mt-1 text-sm text-swing-muted">{selectedTitle}</div>
              </div>
              <SecondaryButton type="button" onClick={() => setMode("detail")}>
                {copy.cancel}
              </SecondaryButton>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label={copy.templates}>
                <SelectInput
                  value={promotion.templateId}
                  onChange={(event) => setPromotion((current) => ({ ...current, templateId: event.target.value }))}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.templateName}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={copy.language}>
                <SelectInput
                  value={promotion.languageCode}
                  onChange={(event) => setPromotion((current) => ({ ...current, languageCode: event.target.value }))}
                >
                  <option value="ko">한국어</option>
                  <option value="en">English</option>
                </SelectInput>
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <PrimaryButton type="button" onClick={renderPromotion}>
                {copy.render}
              </PrimaryButton>
              <SecondaryButton type="button" onClick={copyPromotion} disabled={!promotion.renderedText}>
                {copy.copy}
              </SecondaryButton>
            </div>
            <pre className="mt-4 min-h-[240px] whitespace-pre-wrap rounded-lg border border-swing-border/30 bg-swing-cream/50 p-4 text-sm leading-6 text-swing-ink">
              {promotion.renderedText}
            </pre>
          </div>
        ) : null}

        {mode === "detail" ? (
          <EventDetail
            token={token}
            copy={copy}
            event={selectedEvent}
            langCd={langCd}
            languageCode={languageCode}
            canEdit={canEdit}
            canDelete={canDelete}
            onEditEvent={startEditEvent}
            onDeleteEvent={deleteEvent}
            onAddLesson={startCreateLesson}
            onEditLesson={startEditLesson}
            onDeleteLesson={deleteLesson}
            canRemoveApplication={canRemoveApplication}
            onRemoveParticipant={startRemoveParticipant}
            onPromotion={() => setMode("promotion")}
          />
        ) : null}
        {removingParticipant ? (
          <ConfirmDialog
            title={copy.removeApplicationTitle}
            body={copy.removeApplicationBody}
            cancelLabel={copy.cancel}
            confirmLabel={copy.removeApplicationConfirm}
            isSubmitting={isRemovingParticipant}
            onCancel={cancelRemoveParticipant}
            onConfirm={confirmRemoveParticipant}
          />
        ) : null}
      </div>
    </section>
  );
}

function EventDetail({
  token,
  copy,
  event,
  langCd,
  languageCode,
  canEdit,
  canDelete,
  onEditEvent,
  onDeleteEvent,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  canRemoveApplication,
  onRemoveParticipant,
  onPromotion,
}) {
  if (!event) {
    return (
      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-8 text-center text-sm text-swing-muted shadow-sm">
        {copy.selectEvent}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-swing-border/30 pb-4">
        <div>
          <h2 className="text-xl font-bold text-swing-ink">{eventTitle(event, languageCode)}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge>{eventTypeLabel(event.eventType, languageCode === "en" ? "Eng" : "Kor")}</Badge>
            <Badge>{eventStatusLabel(event.status, langCd)}</Badge>
            <Badge>{formatDateRange(event.startDate, event.endDate)}</Badge>
            <Badge>
              {toTimeInput(event.startTime)}-{toTimeInput(event.endTime)}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-swing-muted">{event.location}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <SecondaryButton type="button" onClick={onEditEvent}>
              {copy.edit}
            </SecondaryButton>
          ) : null}
          <SecondaryButton type="button" onClick={onPromotion}>
            {copy.promotion}
          </SecondaryButton>
          {canDelete ? (
            <DangerButton type="button" onClick={onDeleteEvent}>
              {copy.delete}
            </DangerButton>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {SUPPORTED_LANGUAGES.map((languageCode) => {
          const item = translation(event, languageCode);
          return (
            <section key={languageCode} className="rounded-lg border border-swing-border/30 p-4">
              <h3 className="text-sm font-bold text-swing-ink">{languageCode === "ko" ? "한국어" : "English"}</h3>
              <div className="mt-3 text-sm font-semibold text-swing-ink">{item.title}</div>
              <div className="mt-2 text-sm text-swing-muted">{item.shortDescription}</div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-swing-ink/80">{item.description}</p>
            </section>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3 border-b border-swing-border/30 pb-3">
          <h3 className="text-lg font-bold text-swing-ink">{copy.lessons}</h3>
          {canEdit ? (
            <PrimaryButton type="button" onClick={onAddLesson}>
              {copy.addLesson}
            </PrimaryButton>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3">
          {event.lessons.length === 0 ? <div className="text-sm text-swing-muted">{copy.noLessons}</div> : null}
          {event.lessons.map((lesson) => (
            <div key={lesson.id} className="rounded-lg border border-swing-border/30 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-[min(100%,280px)] flex-1">
                  <div className="text-base font-bold text-swing-ink">{lessonTitle(lesson, languageCode)}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge>{lesson.lessonType}</Badge>
                    <Badge>{lesson.scheduleType}</Badge>
                    <Badge>{eventStatusLabel(lesson.status, langCd)}</Badge>
                    {lesson.roleSelectionEnabled ? <Badge>{copy.roleSelectionEnabled}</Badge> : null}
                    <Badge>{formatDateRange(lesson.startDate, lesson.endDate)}</Badge>
                    <Badge>
                      {toTimeInput(lesson.startTime)}-{toTimeInput(lesson.endTime)}
                    </Badge>
                    <Badge>
                      <span>{lesson.fee} {lesson.currency}</span>
                      {Number(lesson.fee) > 0 ? (
                        <span className="ml-1 text-[10px] font-medium text-swing-muted/70">{copy.feePaymentNote}</span>
                      ) : null}
                    </Badge>
                  </div>
                  <div className="mt-3 text-sm text-swing-muted">
                    {lesson.teachers.map((teacher) => teacher.teacherUserNm).join(", ")}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {canEdit ? (
                    <SecondaryButton type="button" onClick={() => onEditLesson(lesson)}>
                      {copy.edit}
                    </SecondaryButton>
                  ) : null}
                  {canDelete ? (
                    <DangerButton type="button" onClick={() => onDeleteLesson(lesson)}>
                      {copy.delete}
                    </DangerButton>
                  ) : null}
                </div>
              </div>
              <ParticipantList
                participants={lesson.participants}
                copy={copy}
                onRemoveParticipant={canRemoveApplication ? (participant) => onRemoveParticipant(lesson, participant) : null}
              />
              <LessonNoticePanel token={token} lessonId={lesson.id} copy={copy} readOnly={!canEdit} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  body,
  cancelLabel,
  confirmLabel,
  isSubmitting,
  onCancel,
  onConfirm,
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-swing-ink/40 px-4">
      <div className="w-full max-w-md rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-xl">
        <h2 className="text-lg font-bold text-swing-ink">{title}</h2>
        <p className="mt-3 text-sm leading-6 text-swing-muted">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <SecondaryButton type="button" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </SecondaryButton>
          <DangerButton type="button" onClick={onConfirm} disabled={isSubmitting}>
            {confirmLabel}
          </DangerButton>
        </div>
      </div>
    </div>
  );
}

function TemplateVariableList({ className = "" }) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {TEMPLATE_VARIABLES.map((variable) => (
        <code key={variable} className="rounded-md border border-swing-border/30 bg-swing-cream/50 px-2 py-1 text-xs text-swing-ink/80">
          {variable}
        </code>
      ))}
    </div>
  );
}

// `readOnly` backs the 메시지 템플릿 조회 menu: the preview and its copy button
// stay, everything that writes goes away.
export function MessageTemplatePanel({ token, currentUser, langCd, readOnly = false }) {
  const copy = t(langCd);
  const [templates, setTemplates] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyTemplateForm());
  const [activeTemplateLanguage, setActiveTemplateLanguage] = useState(toManualLanguage(langCd));
  const [editingId, setEditingId] = useState(null);
  // The form lives in a modal: templates are a short, rarely-touched list, so a
  // permanent form column earned less than the space it took.
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [preview, setPreview] = useState({
    templateId: "",
    eventId: "",
    languageCode: toManualLanguage(langCd),
    renderedText: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  // Staff gained template authoring alongside super admins; teachers only read.
  const canManage = !readOnly && (hasRole(currentUser, "SUPER_ADMIN") || hasRole(currentUser, "STAFF"));

  const load = useCallback(async () => {
    try {
      const [nextTemplates, nextEvents] = await Promise.all([
        adminApi.findMessageTemplates(token),
        adminApi.findEvents(token, {}),
      ]);
      setTemplates(nextTemplates);
      setEvents(nextEvents);
      setPreview((current) => ({
        ...current,
        templateId: current.templateId || nextTemplates[0]?.id || "",
        eventId: current.eventId || nextEvents[0]?.id || "",
      }));
    } catch (nextError) {
      setError(nextError.message);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleContentChange = (event) => {
    const { value } = event.target;
    const contentKey = activeTemplateLanguage === "en" ? "contentEn" : "content";
    setForm((current) => ({ ...current, [contentKey]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      if (editingId) {
        await adminApi.updateMessageTemplate(token, editingId, form);
      } else {
        await adminApi.createMessageTemplate(token, form);
      }
      setForm(emptyTemplateForm());
      setActiveTemplateLanguage(toManualLanguage(langCd));
      setEditingId(null);
      setIsFormOpen(false);
      setNotice(copy.templateSaved);
      await load();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyTemplateForm());
    setActiveTemplateLanguage(toManualLanguage(langCd));
    setError("");
    setNotice("");
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingId(null);
    setForm(emptyTemplateForm());
    setActiveTemplateLanguage(toManualLanguage(langCd));
  };

  const editTemplate = (template) => {
    setEditingId(template.id);
    setIsFormOpen(true);
    setError("");
    setNotice("");
    setForm({
      templateName: template.templateName,
      templateType: template.templateType,
      content: template.content,
      contentEn: template.contentEn || "",
      useYn: template.useYn,
    });
    setActiveTemplateLanguage(toManualLanguage(langCd));
    setPreview((current) => ({ ...current, templateId: template.id, renderedText: "" }));
  };

  const activeTemplateContent = activeTemplateLanguage === "en" ? form.contentEn : form.content;

  const deleteTemplate = async (template) => {
    if (!window.confirm(copy.confirmDeleteTemplate)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      await adminApi.deleteMessageTemplate(token, template.id);
      setNotice(copy.templateDeleted);
      await load();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  const renderPreview = async () => {
    const templateId = preview.templateId || editingId;
    if (!templateId || !preview.eventId) {
      return;
    }
    setError("");
    try {
      const response = await adminApi.renderMessageTemplate(token, templateId, {
        eventId: preview.eventId,
        languageCode: preview.languageCode,
      });
      setPreview((current) => ({ ...current, renderedText: response.renderedText }));
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    <section className="grid min-w-0 gap-5">
      <Notice>{error}</Notice>
      <Notice type="success">{notice}</Notice>

      <div className="grid gap-5">
        {/* The two menus split the work: 메시지 템플릿 is where a template gets
            previewed and copied, 메시지 템플릿 등록 is where the list is
            maintained. Neither needs both halves. */}
        {readOnly ? null : (
        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-swing-ink">{copy.templates}</h2>
            {canManage ? (
              <PrimaryButton type="button" onClick={openCreateForm}>
                {copy.templateNew}
              </PrimaryButton>
            ) : null}
          </div>
          <div className="mt-4 grid gap-2">
            {templates.map((template) => (
              <div key={template.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-swing-border/30 p-3">
                <div>
                  <div className="font-semibold text-swing-ink">{template.templateName}</div>
                  <div className="mt-1 text-xs text-swing-muted">
                    {template.templateType} / {template.useYn}
                  </div>
                </div>
                <div className="flex gap-2">
                  {canManage ? (
                    <>
                      <SecondaryButton type="button" onClick={() => editTemplate(template)}>
                        {copy.edit}
                      </SecondaryButton>
                      <DangerButton type="button" onClick={() => deleteTemplate(template)}>
                        {copy.delete}
                      </DangerButton>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {readOnly ? (
        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          <h2 className="text-lg font-bold text-swing-ink">{copy.preview}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={copy.templates}>
              <SelectInput
                value={preview.templateId}
                onChange={(event) => setPreview((current) => ({ ...current, templateId: event.target.value }))}
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.templateName}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label={copy.event}>
              <SelectInput
                value={preview.eventId}
                onChange={(event) => setPreview((current) => ({ ...current, eventId: event.target.value }))}
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {eventTitle(event, toManualLanguage(langCd))}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label={copy.language}>
              <SelectInput
                value={preview.languageCode}
                onChange={(event) => setPreview((current) => ({ ...current, languageCode: event.target.value }))}
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </SelectInput>
            </Field>
          </div>
          <div className="mt-4 flex gap-2">
            <PrimaryButton type="button" onClick={renderPreview}>
              {copy.render}
            </PrimaryButton>
            <SecondaryButton
              type="button"
              disabled={!preview.renderedText}
              onClick={() => navigator.clipboard.writeText(preview.renderedText)}
            >
              {copy.copy}
            </SecondaryButton>
          </div>
          <pre className="mt-4 min-h-[180px] whitespace-pre-wrap rounded-lg border border-swing-border/30 bg-swing-cream/50 p-4 text-sm leading-6">
            {preview.renderedText}
          </pre>
        </div>
        ) : null}
        {/* The variable reference used to sit here as a third block. It belongs
            next to the field you type into, which is the register modal. */}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-swing-ink/40 px-3 py-4 sm:items-center sm:px-4">
          <form
            onSubmit={handleSubmit}
            className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-xl sm:p-5"
          >
            <h2 className="text-lg font-bold text-swing-ink">
              {editingId ? copy.templateEditTitle : copy.templateCreateTitle}
            </h2>
            <div className="mt-4 grid gap-4">
              <Field label={copy.templateName}>
                <TextInput name="templateName" value={form.templateName} onChange={handleChange} disabled={!canManage} />
              </Field>
              <Field label={copy.templateType}>
                <SelectInput name="templateType" value={form.templateType} onChange={handleChange} disabled={!canManage}>
                  {TEMPLATE_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label={copy.useYn}>
                <SelectInput name="useYn" value={form.useYn} onChange={handleChange} disabled={!canManage}>
                  <option value="Y">Y</option>
                  <option value="N">N</option>
                </SelectInput>
              </Field>
              <Field label={copy.content}>
                <div className="grid gap-3">
                  <LanguageTabs activeLanguage={activeTemplateLanguage} onChange={setActiveTemplateLanguage} />
                  <TextArea value={activeTemplateContent} onChange={handleContentChange} rows={10} disabled={!canManage} />
                </div>
              </Field>
            </div>

            {/* Kept next to the body field: the variables are what you reach for
                while writing it, not something to go looking for afterwards. */}
            <div className="mt-4 rounded-lg border border-swing-border/30 bg-swing-cream/50 p-3">
              <div className="text-xs font-semibold text-swing-muted">{copy.variables}</div>
              <TemplateVariableList className="mt-2" />
            </div>

            <Notice>{error}</Notice>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <SecondaryButton type="button" onClick={closeForm} disabled={isSaving} className="w-full sm:w-auto">
                {copy.cancel}
              </SecondaryButton>
              {canManage ? (
                <PrimaryButton type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {editingId ? copy.save : copy.create}
                </PrimaryButton>
              ) : null}
            </div>
          </form>
        </div>
      ) : null}
    </section>
  );
}

// Mirrors LessonBoardPanel (강습조회): a collapsible lesson index on the left,
// and the picked lesson's participants and notices on the right. The data is the
// teacher's own published lessons rather than the whole schedule, but the shape
// on screen is the same, so the two read alike.
export function TeacherDashboardPanel({ token, langCd }) {
  const copy = t(langCd);
  const languageCode = toManualLanguage(langCd);
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [isListOpen, setIsListOpen] = useState(true);
  const [error, setError] = useState("");

  const loadLessons = useCallback(async () => {
    try {
      // No filter controls: every published lesson assigned to this teacher,
      // which the server already scopes by permission.
      setLessons(await adminApi.findTeacherLessons(token, { status: "PUBLISHED" }));
      setError("");
    } catch (nextError) {
      setLessons([]);
      setError(nextError.message);
    }
  }, [token]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const selectedLesson = lessons.find((lesson) => lesson.lessonId === selectedLessonId) || null;

  return (
    <section className="grid min-w-0 content-start gap-5 [&>*]:min-w-0 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="rounded-lg border border-swing-border/30 bg-swing-paper p-4 shadow-sm">
        <button
          type="button"
          onClick={() => setIsListOpen((current) => !current)}
          aria-expanded={isListOpen}
          className={`flex w-full flex-wrap items-center justify-between gap-2 text-left ${
            isListOpen ? "border-b border-swing-border/30 pb-3" : ""
          }`}
        >
          <h2 className="text-lg font-bold text-swing-ink">{copy.teachingSchedule}</h2>
          <span className="text-xs font-semibold text-swing-muted">
            {lessons.length}
            <span className="ml-2 text-swing-muted/70">{isListOpen ? "▲" : "▼"}</span>
          </span>
        </button>

        <Notice>{error}</Notice>

        <div className={`mt-3 gap-2 ${isListOpen ? "grid" : "hidden"}`}>
          {lessons.length === 0 ? (
            <div className="py-6 text-center text-sm text-swing-muted">{copy.noLessons}</div>
          ) : null}
          {lessons.map((lesson) => {
            const isActive = lesson.lessonId === selectedLessonId;

            return (
              <button
                key={lesson.lessonId}
                type="button"
                onClick={() => {
                  setSelectedLessonId(lesson.lessonId);
                  setIsListOpen(false);
                }}
                className={`rounded-lg border px-3 py-2 text-left transition ${
                  isActive
                    ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                    : "border-swing-border/30 hover:bg-swing-cream/50"
                }`}
              >
                <div className="text-sm font-semibold">{localizedTitle(lesson.lessonTitle, languageCode)}</div>
                <div className={`text-xs ${isActive ? "text-swing-paper/70" : "text-swing-muted"}`}>
                  {localizedTitle(lesson.eventTitle, languageCode)}
                </div>
                <div className={`mt-1 text-xs ${isActive ? "text-swing-paper/60" : "text-swing-muted/80"}`}>
                  {formatDateRange(lesson.startDate, lesson.endDate)}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {selectedLesson ? (
        <div className="grid min-w-0 content-start gap-5">
          <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
            <h2 className="text-xl font-bold text-swing-ink">
              {localizedTitle(selectedLesson.lessonTitle, languageCode)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-swing-muted">
              {selectedLesson.teachers.length > 0 ? (
                <span>{selectedLesson.teachers.map((teacher) => teacher.name).join(", ")}</span>
              ) : null}
              <Badge>
                {toTimeInput(selectedLesson.startTime)}-{toTimeInput(selectedLesson.endTime)}
              </Badge>
            </div>

            <ParticipantList participants={selectedLesson.participants} copy={copy} onRemoveParticipant={null} />
            <LessonNoticePanel token={token} lessonId={selectedLesson.lessonId} copy={copy} />
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-8 text-center text-sm text-swing-muted shadow-sm">
          {copy.selectLesson}
        </div>
      )}
    </section>
  );
}

function toEventForm(event) {
  return {
    id: event.id,
    eventType: event.eventType,
    startDate: event.startDate,
    endDate: event.endDate,
    startTime: toTimeInput(event.startTime),
    endTime: toTimeInput(event.endTime),
    location: event.location,
    addressInfoEnabled: Boolean(event.addressInfoEnabled),
    googleMapUrl: event.googleMapUrl || "",
    naverMapUrl: event.naverMapUrl || "",
    status: event.status,
    displayOrder: event.displayOrder,
    translations: normalizeTranslations(event.translations),
  };
}

function toLessonForm(lesson) {
  return {
    id: lesson.id,
    lessonType: lesson.lessonType,
    scheduleType: lesson.scheduleType || "SINGLE_DAY",
    startDate: lesson.startDate || "",
    endDate: lesson.endDate || lesson.startDate || "",
    startTime: toTimeInput(lesson.startTime),
    endTime: toTimeInput(lesson.endTime),
    fee: lesson.fee,
    currency: lesson.currency,
    status: lesson.status,
    displayOrder: lesson.displayOrder,
    roleSelectionEnabled: Boolean(lesson.roleSelectionEnabled),
    teacherUserIds: lesson.teachers.map((teacher) => teacher.teacherUserId),
    translations: normalizeLessonTranslations(lesson.translations),
  };
}

function normalizeTranslations(translations = {}) {
  return SUPPORTED_LANGUAGES.reduce((next, languageCode) => {
    next[languageCode] = {
      title: translations[languageCode]?.title || "",
      shortDescription: translations[languageCode]?.shortDescription || "",
      description: translations[languageCode]?.description || "",
    };
    return next;
  }, {});
}

function normalizeLessonTranslations(translations = {}) {
  return SUPPORTED_LANGUAGES.reduce((next, languageCode) => {
    next[languageCode] = {
      title: translations[languageCode]?.title || "",
      description: translations[languageCode]?.description || "",
    };
    return next;
  }, {});
}
