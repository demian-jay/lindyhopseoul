import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";
import MemberNameLabel from "./MemberNameLabel";

const SUPPORTED_LANGUAGES = ["ko", "en"];
const EVENT_TYPES = ["REGULAR_CLASS", "PARTY", "DIALOGUE_PARTY"];
const EVENT_STATUSES = ["PUBLISHED", "FINISHED"];
const LESSON_TYPES = ["LEVEL1", "LEVEL2", "LEVEL3", "LEVEL4", "WORKSHOP", "EXPERIENCE"];
const LESSON_STATUSES = ["PUBLISHED", "FINISHED"];
const TEMPLATE_TYPES = ["EVENT_PROMOTION", "PARTY_PROMOTION", "REGULAR_CLASS_PROMOTION", "LESSON_PROMOTION"];
const ROLE_ORDER = ["SUPER_ADMIN", "STAFF", "TEACHER", "MEMBER"];
const REGULAR_CLASS_GOOGLE_MAP_URL = "https://maps.app.goo.gl/ypA9zfFkKVqwJoT96";
const REGULAR_CLASS_NAVER_MAP_URL = "https://naver.me/x2jQH2Tt";
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
    DIALOGUE_PARTY: "Dialogue 파티",
  },
  Eng: {
    REGULAR_CLASS: "Regular Class",
    PARTY: "Party",
    DIALOGUE_PARTY: "Dialogue Party",
  },
};

const EVENT_TYPE_DEFAULTS = {
  REGULAR_CLASS: {
    startTime: "16:00",
    endTime: "22:00",
    location: "KP DANCE HALL, 서울 강남구 학동로 166 지하 1층",
    addressInfoEnabled: true,
    googleMapUrl: REGULAR_CLASS_GOOGLE_MAP_URL,
    naverMapUrl: REGULAR_CLASS_NAVER_MAP_URL,
    translations: {
      ko: {
        title: "스윙팝 정규수업",
        shortDescription: "학동역 KP 댄스홀에서 음악에 맞춰 즐겁게 배우는 스윙댄스 정규수업을 진행합니다.",
        description:
          "학동역 KP 댄스홀에서 스윙댄스 정규수업을 진행합니다. 기본 스텝부터 파트너와 함께 추는 연결 동작까지, 음악에 맞춰 자연스럽게 움직이며 스윙댄스의 즐거움을 배워가는 수업입니다. 수업은 4주간 매주 토요일에 진행되며, 자세한 수업 시간은 각 수업별 정보를 확인해주세요.",
      },
      en: {
        title: "SwingPop Regular Class",
        shortDescription:
          "Join our regular swing dance class at KP Dance Hall near Hakdong Station and learn to dance with the music.",
        description:
          "SwingPop regular swing dance classes are held at KP Dance Hall near Hakdong Station. From basic steps to partner connection, you'll learn how to move naturally with the music and enjoy the fun of swing dancing. The class runs every Saturday for 4 weeks. Please check each class listing for the detailed schedule.",
      },
    },
  },
  PARTY: {
    startTime: "16:00",
    endTime: "22:00",
    location: "KP DANCE HALL, 서울 강남구 학동로 166 지하 1층",
    addressInfoEnabled: false,
  },
  DIALOGUE_PARTY: {
    startTime: "19:30",
    endTime: "22:00",
    location: "Dialogue, 서울 용산구 신흥로 31 지하1층",
    addressInfoEnabled: false,
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

function defaultTeacherLessonFilters() {
  return {
    from: toDateInput(new Date()),
    to: "",
    status: "PUBLISHED",
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
  }, "REGULAR_CLASS", eventDefaultFieldKeys("REGULAR_CLASS"));
}

function eventDefaultFieldKeys(eventType) {
  const defaults = EVENT_TYPE_DEFAULTS[eventType] || {};
  const keys = [];
  if (defaults.startTime !== undefined) {
    keys.push("startTime");
  }
  if (defaults.endTime !== undefined) {
    keys.push("endTime");
  }
  if (defaults.location !== undefined) {
    keys.push("location");
  }
  if (defaults.addressInfoEnabled !== undefined) {
    keys.push("addressInfoEnabled");
  }
  if (defaults.googleMapUrl !== undefined) {
    keys.push("googleMapUrl");
  }
  if (defaults.naverMapUrl !== undefined) {
    keys.push("naverMapUrl");
  }
  SUPPORTED_LANGUAGES.forEach((languageCode) => {
    const translation = defaults.translations?.[languageCode];
    if (translation?.title !== undefined) {
      keys.push(`translations.${languageCode}.title`);
    }
    if (translation?.shortDescription !== undefined) {
      keys.push(`translations.${languageCode}.shortDescription`);
    }
    if (translation?.description !== undefined) {
      keys.push(`translations.${languageCode}.description`);
    }
  });
  return new Set(keys);
}

function applyEventTypeDefaults(form, eventType, autoDefaultFields = new Set()) {
  const defaults = EVENT_TYPE_DEFAULTS[eventType] || {};
  const applyTextDefault = (fieldKey, currentValue, nextValue) => {
    if (!currentValue || autoDefaultFields.has(fieldKey)) {
      return nextValue || "";
    }
    return currentValue;
  };

  return {
    ...form,
    eventType,
    startTime: applyTextDefault("startTime", form.startTime, defaults.startTime),
    endTime: applyTextDefault("endTime", form.endTime, defaults.endTime),
    location: applyTextDefault("location", form.location, defaults.location),
    addressInfoEnabled:
      eventType === "REGULAR_CLASS"
        ? true
        : autoDefaultFields.has("addressInfoEnabled")
          ? Boolean(defaults.addressInfoEnabled)
          : Boolean(form.addressInfoEnabled),
    googleMapUrl: form.googleMapUrl || defaults.googleMapUrl || "",
    naverMapUrl: form.naverMapUrl || defaults.naverMapUrl || "",
    translations: SUPPORTED_LANGUAGES.reduce((translations, languageCode) => {
      const currentTranslation = form.translations?.[languageCode] || {};
      const defaultTranslation = defaults.translations?.[languageCode] || {};
      translations[languageCode] = {
        title: applyTextDefault(
          `translations.${languageCode}.title`,
          currentTranslation.title,
          defaultTranslation.title
        ),
        shortDescription: applyTextDefault(
          `translations.${languageCode}.shortDescription`,
          currentTranslation.shortDescription,
          defaultTranslation.shortDescription
        ),
        description: applyTextDefault(
          `translations.${languageCode}.description`,
          currentTranslation.description,
          defaultTranslation.description
        ),
      };
      return translations;
    }, {}),
  };
}

function applyRegularClassAddressDefaults(form, eventType) {
  if (eventType !== "REGULAR_CLASS") {
    return { ...form, eventType };
  }

  return {
    ...form,
    eventType,
    addressInfoEnabled: true,
    googleMapUrl: form.googleMapUrl || REGULAR_CLASS_GOOGLE_MAP_URL,
    naverMapUrl: form.naverMapUrl || REGULAR_CLASS_NAVER_MAP_URL,
  };
}

function defaultLessonScheduleType(event = null) {
  return event?.eventType === "REGULAR_CLASS" ? "PERIOD" : "SINGLE_DAY";
}

function defaultLessonFee(event = null) {
  return event?.eventType === "DIALOGUE_PARTY" ? "15000" : "0";
}

function defaultLessonStartTime(event = null) {
  return event?.eventType === "DIALOGUE_PARTY" ? "19:30" : "";
}

function defaultLessonEndTime(event = null) {
  return event?.eventType === "DIALOGUE_PARTY" ? "20:00" : "";
}

function emptyLessonForm(event = null, scheduleType = defaultLessonScheduleType(event)) {
  const eventStartDate = event?.startDate || "";
  const eventEndDate = event?.endDate || eventStartDate;
  return {
    lessonType: "LEVEL1",
    scheduleType,
    startDate: eventStartDate,
    endDate: scheduleType === "PERIOD" || event?.eventType === "DIALOGUE_PARTY" ? eventEndDate : eventStartDate,
    startTime: defaultLessonStartTime(event),
    endTime: defaultLessonEndTime(event),
    fee: defaultLessonFee(event),
    currency: "KRW",
    status: "PUBLISHED",
    displayOrder: 10,
    roleSelectionEnabled: false,
    teacherUserIds: [],
    translations: {
      ko: { title: "", description: "" },
      en: { title: "", description: "" },
    },
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

function LessonNoticePanel({ token, lessonId, copy }) {
  const [notices, setNotices] = useState([]);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  return (
    <section className="mt-4 rounded-lg border border-swing-border/30 bg-swing-paper p-3">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-xs font-semibold text-swing-muted">{copy.notices}</h4>
        {isLoading ? <span className="text-xs text-swing-muted/70">{copy.loading}</span> : null}
      </div>
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
      {notices.length > 0 ? (
        <div className="mt-3 grid gap-2">
          {notices.map((notice) => (
            <article key={notice.id} className="rounded-md border border-swing-border/30 bg-swing-cream/50 px-3 py-2">
              <div className="text-xs font-semibold text-swing-muted">
                {noticeAuthorLabel(notice, copy)} · {formatNoticeDate(notice.createdAt)}
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-swing-ink">{notice.content}</p>
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
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
          ? applyEventTypeDefaults(current, value, eventDefaultFieldKeys(value))
          : applyRegularClassAddressDefaults(current, value)
      );
      return;
    }
    if (name === "addressInfoEnabled") {
      setForm((current) => ({
        ...current,
        addressInfoEnabled: checked,
        googleMapUrl:
          checked && current.eventType === "REGULAR_CLASS" && !current.googleMapUrl
            ? REGULAR_CLASS_GOOGLE_MAP_URL
            : current.googleMapUrl,
        naverMapUrl:
          checked && current.eventType === "REGULAR_CLASS" && !current.naverMapUrl
            ? REGULAR_CLASS_NAVER_MAP_URL
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
                {value}
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
      if (name === "scheduleType" && !isEditing) {
        const previousDefaults = emptyLessonForm(parentEvent, current.scheduleType);
        const nextDefaults = emptyLessonForm(parentEvent, nextValue);
        const nextStartDate =
          !current.startDate || current.startDate === previousDefaults.startDate ? nextDefaults.startDate : current.startDate;
        const nextEndDate =
          !current.endDate || current.endDate === previousDefaults.endDate ? nextDefaults.endDate : current.endDate;
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
      if (name === "startDate" && current.scheduleType === "SINGLE_DAY") {
        return { ...current, startDate: nextValue, endDate: nextValue };
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
                {value}
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
          <TextInput type="date" name="startDate" value={form.startDate} onChange={handleChange} />
        </Field>
        {form.scheduleType === "PERIOD" ? (
          <Field label={copy.lessonEndDate}>
            <TextInput type="date" name="endDate" value={form.endDate} onChange={handleChange} />
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
  const canDelete = hasRole(currentUser, "SUPER_ADMIN");
  const canRemoveApplication = hasRole(currentUser, "SUPER_ADMIN") || hasRole(currentUser, "STAFF");

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await adminApi.findEvents(token, filters);
      setEvents(data);
      setSelectedEventId((currentId) => currentId || data[0]?.id || null);
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
    <section className="grid gap-5 xl:grid-cols-[330px_1fr]">
      <aside className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{copy.events}</h2>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton type="button" onClick={() => setShowEventFilters((current) => !current)}>
              {showEventFilters ? copy.hideFilters : copy.showFilters}
            </SecondaryButton>
            <PrimaryButton type="button" onClick={startCreateEvent}>
              {copy.createEvent}
            </PrimaryButton>
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
                    {value}
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
                <Badge>{event.status}</Badge>
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
            languageCode={languageCode}
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
  languageCode,
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
            <Badge>{event.status}</Badge>
            <Badge>{formatDateRange(event.startDate, event.endDate)}</Badge>
            <Badge>
              {toTimeInput(event.startTime)}-{toTimeInput(event.endTime)}
            </Badge>
          </div>
          <div className="mt-2 text-sm text-swing-muted">{event.location}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <SecondaryButton type="button" onClick={onEditEvent}>
            {copy.edit}
          </SecondaryButton>
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
          <PrimaryButton type="button" onClick={onAddLesson}>
            {copy.addLesson}
          </PrimaryButton>
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
                    <Badge>{lesson.status}</Badge>
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
                  <SecondaryButton type="button" onClick={() => onEditLesson(lesson)}>
                    {copy.edit}
                  </SecondaryButton>
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
              <LessonNoticePanel token={token} lessonId={lesson.id} copy={copy} />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-swing-ink/40 px-4">
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

export function MessageTemplatePanel({ token, currentUser, langCd }) {
  const copy = t(langCd);
  const [templates, setTemplates] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyTemplateForm());
  const [activeTemplateLanguage, setActiveTemplateLanguage] = useState(toManualLanguage(langCd));
  const [editingId, setEditingId] = useState(null);
  const [preview, setPreview] = useState({
    templateId: "",
    eventId: "",
    languageCode: toManualLanguage(langCd),
    renderedText: "",
  });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const canManage = hasRole(currentUser, "SUPER_ADMIN");

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
      setNotice(copy.templateSaved);
      await load();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const editTemplate = (template) => {
    setEditingId(template.id);
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
    <section className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <form onSubmit={handleSubmit} className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{copy.templates}</h2>
          {editingId ? (
            <SecondaryButton
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(emptyTemplateForm());
                setActiveTemplateLanguage(toManualLanguage(langCd));
              }}
            >
              {copy.cancel}
            </SecondaryButton>
          ) : null}
        </div>
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
        <Notice>{error}</Notice>
        <Notice type="success">{notice}</Notice>
        {canManage ? (
          <PrimaryButton type="submit" disabled={isSaving} className="mt-4 w-full">
            {editingId ? copy.save : copy.create}
          </PrimaryButton>
        ) : null}
      </form>

      <div className="grid gap-5">
        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          <h2 className="text-lg font-bold text-swing-ink">{copy.templates}</h2>
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
                  <SecondaryButton type="button" onClick={() => editTemplate(template)}>
                    {copy.edit}
                  </SecondaryButton>
                  {canManage ? (
                    <DangerButton type="button" onClick={() => deleteTemplate(template)}>
                      {copy.delete}
                    </DangerButton>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>

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

        <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
          <h2 className="text-lg font-bold text-swing-ink">{copy.variables}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {TEMPLATE_VARIABLES.map((variable) => (
              <code key={variable} className="rounded-md border border-swing-border/30 bg-swing-cream/50 px-2 py-1 text-xs text-swing-ink/80">
                {variable}
              </code>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TeacherDashboardPanel({ token, langCd }) {
  const copy = t(langCd);
  const languageCode = toManualLanguage(langCd);
  const [filters, setFilters] = useState(() => defaultTeacherLessonFilters());
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState("");

  const loadLessons = useCallback(async () => {
    try {
      setLessons(await adminApi.findTeacherLessons(token, filters));
      setError("");
    } catch (nextError) {
      setError(nextError.message);
    }
  }, [filters, token]);

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => {
      if (name === "status" && value === "FINISHED" && current.status !== "FINISHED") {
        const currentMonth = monthRange();
        return { ...current, status: value, from: currentMonth.from, to: toDateInput(new Date()) };
      }
      if (name === "status" && value === "PUBLISHED" && current.status !== "PUBLISHED") {
        return { ...current, status: value, from: toDateInput(new Date()), to: "" };
      }
      return { ...current, [name]: value };
    });
  };

  return (
    <section className="grid gap-5">
      <Notice>{error}</Notice>
      <div className="rounded-lg border border-swing-border/30 bg-swing-paper p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-swing-border/30 pb-4">
          <h2 className="text-lg font-bold text-swing-ink">{copy.teachingSchedule}</h2>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-nowrap sm:items-end">
            <div className="sm:w-36">
              <Field label={copy.lessonStatusFilter}>
                <SelectInput name="status" value={filters.status} onChange={handleFilterChange}>
                  {LESSON_STATUSES.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>
            <div className="sm:w-[150px]">
              <Field label={copy.from}>
                <TextInput type="date" name="from" value={filters.from} onChange={handleFilterChange} />
              </Field>
            </div>
            <div className="sm:w-[150px]">
              <Field label={copy.to}>
                <TextInput type="date" name="to" value={filters.to} onChange={handleFilterChange} />
              </Field>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <LessonDashboardRows lessons={lessons} copy={copy} languageCode={languageCode} token={token} />
        </div>
      </div>
    </section>
  );
}

function LessonDashboardRows({ lessons, copy, languageCode, token }) {
  if (lessons.length === 0) {
    return <div className="text-sm text-swing-muted">{copy.noLessons}</div>;
  }

  return (
    <div className="grid gap-3">
      {lessons.map((lesson) => (
        <div key={lesson.lessonId} className="rounded-lg border border-swing-border/30 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-[min(100%,280px)] flex-1">
              <div className="text-base font-bold text-swing-ink">{localizedTitle(lesson.lessonTitle, languageCode)}</div>
              <div className="mt-1 text-sm text-swing-muted">{localizedTitle(lesson.eventTitle, languageCode)}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{formatDateRange(lesson.startDate, lesson.endDate)}</Badge>
                <Badge>{lesson.status}</Badge>
                <Badge>{lesson.lessonDisplayStatus}</Badge>
                <Badge>{lesson.scheduleType}</Badge>
                <Badge>{lesson.lessonType}</Badge>
                <Badge>
                  {toTimeInput(lesson.startTime)}-{toTimeInput(lesson.endTime)}
                </Badge>
              </div>
              <div className="mt-3 text-sm text-swing-muted">
                {copy.teachers}: {lesson.teachers.map((teacher) => teacher.name).join(", ")}
              </div>
            </div>
          </div>
          <ParticipantList participants={lesson.participants} copy={copy} />
          <LessonNoticePanel token={token} lessonId={lesson.lessonId} copy={copy} />
        </div>
      ))}
    </div>
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
