import React, { useEffect, useMemo, useState } from "react";

import AdminApp from "./AdminApp";
import { memoApi } from "./api/memos";
import { publicScheduleApi } from "./api/publicSchedules";

const CONTENT = {
  ko: {
    nav: ["스윙팝", "스윙댄스", "스윙팝의 춤", "서울 씬", "일정 및 신청"],
    heroBadge: "SwingPop Community",
    heroTitle: "서울에서 만나는 따뜻한 스윙댄스 커뮤니티",
    heroDesc:
      "스윙팝은 한국인과 외국인이 함께 어울리며 춤과 음악, 사람 사이의 연결을 즐기는 스윙댄스 커뮤니티입니다. 처음 온 사람도 편안하게 분위기를 느끼고, 서울의 스윙 문화를 자연스럽게 만나볼 수 있도록 구성했습니다.",
    heroPrimary: "일정 보고 신청하기",
    heroSecondary: "커뮤니티 소개 보기",
    mobileApply: "일정 보고 신청하기",
    languageTitle: "언어를 선택해주세요",
    languageDesc: "Choose your preferred language to continue.",
    languageBannerTitle: "Language / 언어 선택",
    languageBannerDesc: "First time here? Choose your preferred language before exploring.",
    application: {
      scheduleEyebrow: "Schedule",
      applyEyebrow: "Apply",
      filtersTitle: "신청 가능한 일정",
      filters: [
        { id: "all", label: "전체" },
        { id: "beginner", label: "처음 추천" },
        { id: "regular", label: "정규수업" },
        { id: "workshop", label: "워크샵" },
        { id: "social", label: "Dialogue Party" },
        { id: "event", label: "특별 이벤트" },
      ],
      recommended: "처음 추천",
      scheduleButton: "일정으로 이동",
      applyButton: "신청하기",
      details: {
        date: "날짜",
        time: "시간",
        location: "장소",
        price: "가격",
        teacher: "강사",
        event: "이벤트",
      },
      noResults: "선택한 조건에 맞는 일정이 없습니다.",
      loading: "등록된 일정과 강습을 불러오는 중입니다.",
      empty: "현재 신청 가능한 공개 일정이 없습니다.",
      loadError: "등록된 일정과 강습을 불러오지 못했습니다.",
      free: "무료",
      toBeAnnounced: "추후 안내",
      levelNotice: "Level 2 이상 수업은 권장 경험 기준이 있습니다. 신청 시 안내 메시지로 한 번 더 확인할 예정입니다.",
    },
    applicationModal: {
      title: "신청 정보 입력",
      close: "닫기",
      nameLabel: "이름",
      namePlaceholder: "예: 홍길동",
      phoneLabel: "전화번호",
      phonePlaceholder: "예: 010-1234-5678",
      submit: "신청하기",
      submitting: "확인 중",
      required: "이름과 전화번호를 모두 입력해주세요.",
      successTitle: "신청 흐름이 확인되었습니다.",
      successBody: "실제 저장 기능은 다음 단계에서 연결됩니다. 지금은 신청 UX와 모달 흐름만 확인할 수 있습니다.",
      chooseAnother: "다른 일정 보기",
    },
    sections: [
      {
        id: "about",
        eyebrow: "1. 스윙팝 소개",
        title: "스윙팝은 어떤 커뮤니티인가요?",
        body: [
          "스윙팝은 춤을 잘 추는 사람만을 위한 공간이 아니라, 다양한 배경의 사람들이 함께 어울리고 연결되는 커뮤니티를 지향합니다.",
          "한국인과 외국인이 자연스럽게 섞여 춤추고 대화하며, 처음 방문한 사람도 부담 없이 참여할 수 있는 따뜻하고 열린 분위기를 중요하게 생각합니다.",
        ],
        stats: [
          { label: "분위기", value: "Welcoming" },
          { label: "커뮤니티", value: "International" },
          { label: "경험", value: "Beginner Friendly" },
        ],
      },
      {
        id: "swing",
        eyebrow: "2. 스윙댄스 소개",
        title: "스윙댄스는 무엇인가요?",
        body: [
          "스윙댄스는 재즈 음악과 함께 발전해온 소셜댄스로, 파트너와 호흡을 맞추며 자유롭게 리듬을 즐기는 춤입니다.",
          "정답을 외워서 추기보다 음악을 듣고 서로 반응하며 움직이는 재미가 크기 때문에, 처음 접하는 사람도 생각보다 빠르게 즐거움을 느낄 수 있습니다.",
        ],
        points: ["재즈와 함께하는 리듬감", "사람과 연결되는 소셜댄스", "초보자도 시작 가능한 구조"],
      },
      {
        id: "swingpop-style",
        eyebrow: "3. 스윙팝의 스윙댄스",
        title: "스윙팝에서는 어떻게 배우고 즐기나요?",
        body: [
          "스윙팝에서는 수업을 통해 기본기를 배우고, 소셜댄스 시간에는 다양한 사람들과 자유롭게 춤추며 익힌 내용을 자연스럽게 경험합니다.",
          "단순히 기술만 배우는 것이 아니라, 함께 인사하고 어울리고 음악을 즐기는 과정 전체를 커뮤니티 경험으로 중요하게 생각합니다.",
        ],
        cards: [
          {
            title: "Class",
            desc: "기초부터 차근차근 배우며 부담 없이 시작할 수 있습니다.",
          },
          {
            title: "Social Dance",
            desc: "여러 사람과 춤추며 실제 스윙댄스의 재미를 경험합니다.",
          },
          {
            title: "Community",
            desc: "춤뿐 아니라 대화와 교류를 통해 자연스럽게 연결됩니다.",
          },
        ],
      },
      {
        id: "seoul-scene",
        eyebrow: "4. 서울 스윙댄스 씬 소개",
        title: "서울에서 스윙댄스를 즐긴다는 것",
        body: [
          "서울에는 오랫동안 이어져 온 활발한 스윙댄스 문화가 있으며, 다양한 댄스홀과 행사, 소셜 파티를 통해 여러 스타일과 사람들을 만날 수 있습니다.",
          "처음에는 하나의 커뮤니티에서 시작하더라도, 점차 서울 전체의 스윙 씬을 경험하며 더 넓은 세계를 발견하는 즐거움이 있습니다.",
        ],
        highlight: "서울은 스윙댄스를 배우고 즐기기에 매력적인 도시이며, 스윙팝은 그 입구가 되어줄 수 있습니다.",
      },
      {
        id: "schedule",
        eyebrow: "5. 일정 및 신청",
        title: "다가오는 수업과 이벤트를 보고 바로 신청하세요",
        body: [
          "날짜순으로 일정을 확인하고, 원하는 카드에서 바로 신청할 수 있습니다.",
          "처음이라면 Level 1을 먼저 추천합니다. 기존 회원은 필터로 정규수업, 워크샵, Dialogue Party, 특별 이벤트를 빠르게 좁혀볼 수 있습니다.",
        ],
      },
    ],
    memoDemo: {
      eyebrow: "API 연동 예시",
      title: "메모",
      description: "Spring Boot API와 MariaDB에 저장되는 간단한 메모입니다.",
      formTitle: "메모 작성",
      editFormTitle: "메모 수정",
      titleLabel: "제목",
      titlePlaceholder: "예: 오늘 배운 리듬",
      contentLabel: "내용",
      contentPlaceholder: "짧은 메모를 남겨보세요.",
      createButton: "저장",
      updateButton: "수정 완료",
      cancelButton: "취소",
      editButton: "수정",
      deleteButton: "삭제",
      listTitle: "저장된 메모",
      loading: "메모를 불러오는 중...",
      emptyTitle: "아직 저장된 메모가 없습니다.",
      emptyDescription: "백엔드를 실행한 뒤 첫 메모를 저장해보세요.",
      requiredMessage: "제목과 내용을 모두 입력해주세요.",
      createdMessage: "메모가 저장되었습니다.",
      updatedMessage: "메모가 수정되었습니다.",
      deletedMessage: "메모가 삭제되었습니다.",
    },
    footer: "SwingPop · Dance, Music, Community",
  },
  en: {
    nav: ["SwingPop", "Swing Dance", "Our Style", "Seoul Scene", "Schedule & Apply"],
    heroBadge: "SwingPop Community",
    heroTitle: "A warm swing dance community in Seoul",
    heroDesc:
      "SwingPop is a swing dance community where Koreans and internationals connect through dance, music, and shared experiences. This page is designed to help first-time visitors quickly understand who we are and why Seoul’s swing dance culture is worth exploring.",
    heroPrimary: "View & Apply",
    heroSecondary: "About the Community",
    mobileApply: "View & Apply",
    languageTitle: "Choose your language",
    languageDesc: "Select Korean or English to continue.",
    languageBannerTitle: "Language / 언어 선택",
    languageBannerDesc: "First time here? Choose your preferred language before exploring.",
    application: {
      scheduleEyebrow: "Schedule",
      applyEyebrow: "Apply",
      filtersTitle: "Open schedules",
      filters: [
        { id: "all", label: "All" },
        { id: "beginner", label: "First-timer" },
        { id: "regular", label: "Regular Class" },
        { id: "workshop", label: "Workshop" },
        { id: "social", label: "Dialogue Party" },
        { id: "event", label: "Special Event" },
      ],
      recommended: "Recommended first",
      scheduleButton: "Go to schedule",
      applyButton: "Apply",
      details: {
        date: "Date",
        time: "Time",
        location: "Location",
        price: "Price",
        teacher: "Teacher",
        event: "Event",
      },
      noResults: "No schedules match this filter.",
      loading: "Loading registered schedules and lessons.",
      empty: "There are no open public schedules right now.",
      loadError: "Could not load registered schedules and lessons.",
      free: "Free",
      toBeAnnounced: "TBA",
      levelNotice: "Level 2+ classes have recommended experience guidelines. A reminder message can be shown during application later.",
    },
    applicationModal: {
      title: "Enter application details",
      close: "Close",
      nameLabel: "Name",
      namePlaceholder: "E.g. Alex Kim",
      phoneLabel: "Phone number",
      phonePlaceholder: "E.g. 010-1234-5678",
      submit: "Apply",
      submitting: "Checking",
      required: "Please enter both your name and phone number.",
      successTitle: "Application flow confirmed.",
      successBody: "The save step will be connected later. For now, this verifies the UX and modal flow only.",
      chooseAnother: "Choose another schedule",
    },
    sections: [
      {
        id: "about",
        eyebrow: "1. About SwingPop",
        title: "What kind of community is SwingPop?",
        body: [
          "SwingPop is not only for experienced dancers. It is a community where people from different backgrounds can meet, connect, and enjoy time together through dance.",
          "We value a warm and open atmosphere where Koreans and internationals naturally mix, and where first-time visitors can feel comfortable joining without pressure.",
        ],
        stats: [
          { label: "Mood", value: "Welcoming" },
          { label: "Community", value: "International" },
          { label: "Experience", value: "Beginner Friendly" },
        ],
      },
      {
        id: "swing",
        eyebrow: "2. About Swing Dance",
        title: "What is swing dance?",
        body: [
          "Swing dance is a social dance that grew with jazz music. It is about sharing rhythm with a partner and enjoying music in a lively, expressive way.",
          "Rather than memorizing fixed answers, you listen, respond, and move with another person. That is why even beginners can quickly discover its fun and charm.",
        ],
        points: ["Rhythm rooted in jazz", "A social dance built on connection", "Accessible for beginners"],
      },
      {
        id: "swingpop-style",
        eyebrow: "3. Swing Dance at SwingPop",
        title: "How do people learn and enjoy dance at SwingPop?",
        body: [
          "At SwingPop, people learn the basics in class and then experience the real joy of swing dance during social dancing with many different partners.",
          "We care not only about technique, but also about greeting people, enjoying music, and building real connection through the full community experience.",
        ],
        cards: [
          {
            title: "Class",
            desc: "Start step by step with a structure that feels approachable.",
          },
          {
            title: "Social Dance",
            desc: "Dance with different people and feel the real energy of swing.",
          },
          {
            title: "Community",
            desc: "Meet people naturally through conversation, music, and dance.",
          },
        ],
      },
      {
        id: "seoul-scene",
        eyebrow: "4. The Seoul Swing Dance Scene",
        title: "Why is swing dance in Seoul special?",
        body: [
          "Seoul has a long-running and active swing dance culture, with dance halls, events, and social parties where you can discover many people and styles.",
          "You may begin with one community, but over time you can explore the wider Seoul scene and enjoy an even bigger world of dance and connection.",
        ],
        highlight: "Seoul is an exciting city for learning and enjoying swing dance, and SwingPop can be your welcoming starting point.",
      },
      {
        id: "schedule",
        eyebrow: "5. Schedule & Apply",
        title: "View upcoming classes and events, then apply",
        body: [
          "Check the date-based list and apply directly from the class or event card you want.",
          "If you are new, Level 1 is the recommended starting point. Returning members can use filters for regular classes, workshops, Dialogue Party, and special events.",
        ],
      },
    ],
    memoDemo: {
      eyebrow: "API Demo",
      title: "Memos",
      description: "Simple memos persisted through the Spring Boot API and MariaDB.",
      formTitle: "Write a memo",
      editFormTitle: "Edit memo",
      titleLabel: "Title",
      titlePlaceholder: "E.g. Rhythm from today",
      contentLabel: "Content",
      contentPlaceholder: "Leave a short memo.",
      createButton: "Save",
      updateButton: "Update",
      cancelButton: "Cancel",
      editButton: "Edit",
      deleteButton: "Delete",
      listTitle: "Saved memos",
      loading: "Loading memos...",
      emptyTitle: "No memos yet.",
      emptyDescription: "Start the backend, then save your first memo.",
      requiredMessage: "Please enter both title and content.",
      createdMessage: "Memo saved.",
      updatedMessage: "Memo updated.",
      deletedMessage: "Memo deleted.",
    },
    footer: "SwingPop · Dance, Music, Community",
  },
};

const SECTION_IDS = ["about", "swing", "swingpop-style", "seoul-scene", "schedule"];
const STORAGE_KEY = "swingpop-language";

function validateContentShape(content) {
  const locales = Object.keys(content);

  if (!locales.includes("ko") || !locales.includes("en")) {
    throw new Error("CONTENT must include both 'ko' and 'en' locales.");
  }

  locales.forEach((localeKey) => {
    const locale = content[localeKey];

    if (!Array.isArray(locale.nav) || locale.nav.length !== SECTION_IDS.length) {
      throw new Error(`Locale '${localeKey}' must have ${SECTION_IDS.length} nav items.`);
    }

    if (!Array.isArray(locale.sections) || locale.sections.length !== SECTION_IDS.length) {
      throw new Error(`Locale '${localeKey}' must have ${SECTION_IDS.length} sections.`);
    }

    locale.sections.forEach((section, index) => {
      if (section.id !== SECTION_IDS[index]) {
        throw new Error(`Locale '${localeKey}' section order is invalid at index ${index}.`);
      }
    });
  });

  return true;
}

function runComponentTests() {
  validateContentShape(CONTENT);

  if (!CONTENT.ko.sections.some((section) => section.id === "schedule") || !CONTENT.en.sections.some((section) => section.id === "schedule")) {
    throw new Error("Schedule section is required in both languages.");
  }

  if (!CONTENT.ko.mobileApply || !CONTENT.en.mobileApply) {
    throw new Error("Mobile sticky CTA label is required in both languages.");
  }

  if (!CONTENT.ko.application?.filters?.length || !CONTENT.en.application?.filters?.length) {
    throw new Error("Application filters are required in both languages.");
  }

  if (!CONTENT.ko.application.filters.some((filter) => filter.id === "beginner")) {
    throw new Error("A beginner filter is required.");
  }

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, "ko");
    if (window.localStorage.getItem(STORAGE_KEY) !== "ko") {
      throw new Error("Language preference must be saved to localStorage.");
    }
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return true;
}

runComponentTests();

function ImagePlaceholder({ label = "Image Placeholder", height = "h-72" }) {
  return (
    <div
      className={`flex w-full items-center justify-center rounded-3xl border border-dashed border-blue-200 bg-blue-50/60 text-sm text-blue-900/60 ${height}`}
    >
      {label}
    </div>
  );
}

function SectionWrapper({ id, children, className = "" }) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className="mx-auto max-w-6xl px-6 py-20 md:px-8">{children}</div>
    </section>
  );
}

function LanguageSelectionModal({ title, description, onSelect }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-blue-950/45 px-5 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="language-modal-title"
      aria-describedby="language-modal-description"
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-blue-100 bg-white p-6 shadow-2xl sm:p-7">
        <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-800">
          Language Selection
        </div>
        <h2 id="language-modal-title" className="text-2xl font-semibold tracking-tight text-blue-950">
          {title}
        </h2>
        <p id="language-modal-description" className="mt-3 text-sm leading-6 text-blue-950/70">
          {description}
        </p>

        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => onSelect("ko")}
            className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="한국어 선택"
          >
            <div>
              <div className="text-base font-semibold text-blue-950">한국어</div>
              <div className="mt-1 text-sm text-blue-950/65">한국어로 페이지 보기</div>
            </div>
            <span className="text-blue-700">→</span>
          </button>

          <button
            type="button"
            onClick={() => onSelect("en")}
            className="flex w-full items-center justify-between rounded-2xl border border-blue-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Choose English"
          >
            <div>
              <div className="text-base font-semibold text-blue-950">English</div>
              <div className="mt-1 text-sm text-blue-950/65">View the page in English</div>
            </div>
            <span className="text-blue-700">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function scrollToHash(hash) {
  if (!hash?.startsWith("#")) {
    return;
  }

  const target = document.querySelector(hash);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function MobileStickyCta({ label, onClick }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-blue-900/10 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <button
        type="button"
        onClick={onClick}
        className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={label}
      >
        {label}
      </button>
    </div>
  );
}

function createEmptyMemoForm() {
  return {
    title: "",
    content: "",
  };
}

function formatMemoDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function MemoBoard({ labels }) {
  const [memos, setMemos] = useState([]);
  const [form, setForm] = useState(createEmptyMemoForm);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isEditing = editingId !== null;

  const loadMemos = async () => {
    setIsLoading(true);
    setError("");

    try {
      const nextMemos = await memoApi.findAll();
      setMemos(nextMemos);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMemos();
  }, []);

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setForm(createEmptyMemoForm());
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
    };

    if (!payload.title || !payload.content) {
      setError(labels.requiredMessage);
      return;
    }

    setIsSaving(true);

    try {
      if (isEditing) {
        await memoApi.update(editingId, payload);
        setNotice(labels.updatedMessage);
      } else {
        await memoApi.create(payload);
        setNotice(labels.createdMessage);
      }

      resetForm();
      await loadMemos();
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (memo) => {
    setEditingId(memo.id);
    setForm({
      title: memo.title,
      content: memo.content,
    });
    setError("");
    setNotice("");
  };

  const handleDelete = async (memoId) => {
    setError("");
    setNotice("");

    try {
      await memoApi.remove(memoId);
      if (editingId === memoId) {
        resetForm();
      }
      setNotice(labels.deletedMessage);
      await loadMemos();
    } catch (nextError) {
      setError(nextError.message);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
          {labels.eyebrow}
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
          {labels.title}
        </h2>
        <p className="mt-4 max-w-xl text-base leading-8 text-blue-950/70">
          {labels.description}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-blue-950">
            {isEditing ? labels.editFormTitle : labels.formTitle}
          </h3>

          <label className="mt-5 block text-sm font-medium text-blue-950/75" htmlFor="memo-title">
            {labels.titleLabel}
          </label>
          <input
            id="memo-title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleFormChange}
            placeholder={labels.titlePlaceholder}
            className="mt-2 min-h-[48px] w-full rounded-2xl border border-blue-200 px-4 text-sm text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <label className="mt-4 block text-sm font-medium text-blue-950/75" htmlFor="memo-content">
            {labels.contentLabel}
          </label>
          <textarea
            id="memo-content"
            name="content"
            value={form.content}
            onChange={handleFormChange}
            placeholder={labels.contentPlaceholder}
            rows={5}
            className="mt-2 w-full resize-none rounded-2xl border border-blue-200 px-4 py-3 text-sm leading-6 text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isEditing ? labels.updateButton : labels.createButton}
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50"
              >
                {labels.cancelButton}
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-xl font-semibold text-blue-950">{labels.listTitle}</h3>
          {isLoading ? <span className="text-sm text-blue-950/50">{labels.loading}</span> : null}
        </div>

        <div className="mt-4 space-y-3" aria-live="polite">
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
              {error}
            </div>
          ) : null}
          {notice ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
              {notice}
            </div>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4">
          {!isLoading && memos.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-blue-200 bg-blue-50/70 p-6">
              <div className="text-base font-semibold text-blue-950">{labels.emptyTitle}</div>
              <p className="mt-2 text-sm leading-6 text-blue-950/65">{labels.emptyDescription}</p>
            </div>
          ) : null}

          {memos.map((memo) => (
            <article key={memo.id} className="rounded-3xl border border-blue-100 bg-blue-50/50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="text-lg font-semibold text-blue-950">{memo.title}</h4>
                  <p className="mt-1 text-xs text-blue-950/45">{formatMemoDate(memo.updatedAt)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(memo)}
                    className="rounded-full border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-950 transition hover:bg-blue-50"
                  >
                    {labels.editButton}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(memo.id)}
                    className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    {labels.deleteButton}
                  </button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-blue-950/70">{memo.content}</p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-900/45">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-blue-950/75">{value}</dd>
    </div>
  );
}

const EVENT_TYPE_LABELS = {
  ko: {
    REGULAR_CLASS: "정규수업",
    PARTY: "특별 이벤트",
    DIALOGUE_PARTY: "Dialogue Party",
  },
  en: {
    REGULAR_CLASS: "Regular Class",
    PARTY: "Special Event",
    DIALOGUE_PARTY: "Dialogue Party",
  },
};

function getScheduleTranslation(item, language) {
  return item.translations?.[language] || item.translations?.ko || {};
}

function getFilterIds(item) {
  const filters = new Set();

  if (item.eventType === "REGULAR_CLASS") {
    filters.add("regular");
  }

  if (item.eventType === "DIALOGUE_PARTY") {
    filters.add("social");
    filters.add("event");
  }

  if (item.eventType === "PARTY") {
    filters.add("event");
  }

  if (item.lessonType === "LEVEL1") {
    filters.add("beginner");
    filters.add("regular");
  }

  if (["LEVEL2", "LEVEL3", "LEVEL4"].includes(item.lessonType)) {
    filters.add("regular");
  }

  if (item.lessonType === "WORKSHOP") {
    filters.add("workshop");
  }

  return Array.from(filters);
}

function formatDateRange(startDate, endDate, language) {
  if (!startDate) {
    return "";
  }

  const locale = language === "en" ? "en-US" : "ko-KR";
  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  });
  const formattedStart = formatter.format(new Date(`${startDate}T00:00:00`));

  if (!endDate || endDate === startDate) {
    return formattedStart;
  }

  return `${formattedStart} - ${formatter.format(new Date(`${endDate}T00:00:00`))}`;
}

function formatTimeRange(startTime, endTime) {
  const trimTime = (value) => (value ? value.slice(0, 5) : "");
  const start = trimTime(startTime);
  const end = trimTime(endTime);

  if (!start && !end) {
    return "";
  }
  if (!end) {
    return start;
  }
  return `${start}-${end}`;
}

function formatPrice(fee, currency, labels, language) {
  if (fee === null || fee === undefined) {
    return labels.toBeAnnounced;
  }

  const amount = Number(fee);
  if (amount === 0) {
    return labels.free;
  }

  if (currency === "KRW") {
    const formatted = new Intl.NumberFormat(language === "en" ? "en-US" : "ko-KR").format(amount);
    return language === "en" ? `KRW ${formatted}` : `${formatted}원`;
  }

  return `${amount.toLocaleString()} ${currency || ""}`.trim();
}

function formatTeachers(teachers, labels) {
  if (!Array.isArray(teachers) || teachers.length === 0) {
    return labels.toBeAnnounced;
  }

  return teachers.map((teacher) => teacher.teacherUserNm).filter(Boolean).join(", ") || labels.toBeAnnounced;
}

function toApplicationItem(item, language, labels) {
  const translation = getScheduleTranslation(item, language);
  const eventTypeLabel = EVENT_TYPE_LABELS[language]?.[item.eventType] || item.eventType;

  return {
    id: item.id,
    target: {
      eventId: item.eventId,
      lessonId: item.lessonId,
      lessonType: item.lessonType,
    },
    filterIds: getFilterIds(item),
    isRecommended: item.recommendedForBeginners,
    requiresLevelNotice: item.requiresLevelNotice,
    eventType: eventTypeLabel,
    title: translation.title || translation.eventTitle || eventTypeLabel,
    date: formatDateRange(item.startDate, item.endDate, language),
    time: formatTimeRange(item.startTime, item.endTime) || labels.toBeAnnounced,
    location: item.location || labels.toBeAnnounced,
    price: formatPrice(item.fee, item.currency, labels, language),
    teacher: formatTeachers(item.teachers, labels),
    description: translation.description || translation.shortDescription || "",
  };
}

function ApplicationCard({ item, language, labels, onApply }) {
  return (
    <article
      className={`grid gap-5 rounded-3xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        item.isRecommended ? "border-amber-300 ring-2 ring-amber-100" : "border-blue-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-900">
              {item.eventType}
            </span>
            {item.isRecommended ? (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                {labels.recommended}
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-xl font-semibold tracking-tight text-blue-950">{item.title}</h3>
          <p className="mt-3 text-sm leading-7 text-blue-950/70">{item.description}</p>
        </div>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow label={labels.details.date} value={item.date} />
        <DetailRow label={labels.details.time} value={item.time} />
        <DetailRow label={labels.details.location} value={item.location} />
        <DetailRow label={labels.details.price} value={item.price} />
        <DetailRow label={labels.details.teacher} value={item.teacher} />
      </dl>

      {item.requiresLevelNotice ? (
        <p className="rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
          {labels.levelNotice}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => onApply(item)}
        className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {labels.applyButton}
      </button>
    </article>
  );
}

function ScheduleAndApplicationSection({
  language,
  scheduleSection,
  labels,
  items,
  isLoading,
  error,
  activeFilter,
  onFilterChange,
  onApply,
}) {
  const filteredItems =
    activeFilter === "all" ? items : items.filter((item) => item.filterIds.includes(activeFilter));
  const hasItems = items.length > 0;

  return (
    <div>
      <div className="max-w-3xl">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">{scheduleSection.eyebrow}</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">{scheduleSection.title}</h2>
        <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
          {scheduleSection.body.map((paragraph) => (
            <p key={`${language}-schedule-${paragraph}`}>{paragraph}</p>
          ))}
        </div>
      </div>

      <div className="scroll-mt-24">
        <div className="mt-8">
          <div className="mb-3 text-sm font-semibold text-blue-950">{labels.filtersTitle}</div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {labels.filters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => onFilterChange(filter.id)}
                className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeFilter === filter.id
                    ? "border-blue-700 bg-blue-700 text-white"
                    : "border-blue-200 bg-white text-blue-950 hover:bg-blue-50"
                }`}
                aria-pressed={activeFilter === filter.id}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="mt-6 rounded-3xl border border-blue-200 bg-white px-5 py-8 text-center text-sm text-blue-950/65">
            {labels.loading}
          </div>
        ) : null}

        {!isLoading && error ? (
          <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-8 text-center text-sm leading-6 text-red-700">
            {labels.loadError}
          </div>
        ) : null}

        {!isLoading && !error && filteredItems.length > 0 ? (
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {filteredItems.map((item) => (
              <ApplicationCard key={item.id} item={item} language={language} labels={labels} onApply={onApply} />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && filteredItems.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-blue-200 bg-white px-5 py-8 text-center text-sm text-blue-950/65">
            {hasItems ? labels.noResults : labels.empty}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ApplicationModal({ item, language, labels, detailLabels, onClose }) {
  const [form, setForm] = useState({ name: "", phone: "" });
  const [error, setError] = useState("");
  const [submittedApplication, setSubmittedApplication] = useState(null);

  useEffect(() => {
    setForm({ name: "", phone: "" });
    setError("");
    setSubmittedApplication(null);
  }, [item]);

  useEffect(() => {
    if (!item) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  if (!item) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.phone.trim()) {
      setError(labels.required);
      return;
    }

    setSubmittedApplication({
      target: item.target,
      applicantName: form.name.trim(),
      phoneNumber: form.phone.trim(),
      languageCode: language,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center bg-blue-950/55 px-4 py-4 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="application-modal-title"
    >
      <div className="max-h-[calc(100vh-32px)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-blue-100 bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-900/45">
              {item.eventType}
            </p>
            <h2 id="application-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-blue-950">
              {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-sm font-semibold text-blue-950 transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={labels.close}
          >
            X
          </button>
        </div>

        <dl className="mt-6 grid gap-4 rounded-3xl border border-blue-200 bg-blue-50/70 p-5 sm:grid-cols-2">
          <DetailRow label={detailLabels.details.date} value={item.date} />
          <DetailRow label={detailLabels.details.time} value={item.time} />
          <DetailRow label={detailLabels.details.location} value={item.location} />
          <DetailRow label={detailLabels.details.price} value={item.price} />
          <DetailRow label={detailLabels.details.teacher} value={item.teacher} />
        </dl>

        <p className="mt-5 text-sm leading-7 text-blue-950/70">{item.description}</p>

        {item.requiresLevelNotice ? (
          <p className="mt-4 rounded-2xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm leading-6 text-teal-900">
            {detailLabels.levelNotice}
          </p>
        ) : null}

        {submittedApplication ? (
          <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
            <h3 className="text-lg font-semibold text-emerald-950">{labels.successTitle}</h3>
            <p className="mt-2 text-sm leading-7 text-emerald-900/75">{labels.successBody}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-auto"
            >
              {labels.chooseAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-blue-950/75">{labels.nameLabel}</span>
                <input
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder={labels.namePlaceholder}
                  className="mt-2 min-h-[48px] w-full rounded-2xl border border-blue-200 px-4 text-sm text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-blue-950/75">{labels.phoneLabel}</span>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={labels.phonePlaceholder}
                  className="mt-2 min-h-[48px] w-full rounded-2xl border border-blue-200 px-4 text-sm text-blue-950 outline-none transition placeholder:text-blue-950/35 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>

            {error ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-blue-200 bg-white px-5 text-sm font-semibold text-blue-950 shadow-sm transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {labels.close}
              </button>
              <button
                type="submit"
                className="inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {labels.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function PublicApp() {
  const [language, setLanguage] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [scheduleItems, setScheduleItems] = useState([]);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedLanguage = window.localStorage.getItem(STORAGE_KEY);
    if (savedLanguage === "ko" || savedLanguage === "en") {
      setLanguage(savedLanguage);
    }
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    setIsScheduleLoading(true);
    setScheduleError("");

    publicScheduleApi
      .findOpenSchedules()
      .then((items) => {
        if (isMounted) {
          setScheduleItems(Array.isArray(items) ? items : []);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setScheduleItems([]);
          setScheduleError(nextError.message);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsScheduleLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLanguageSelect = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    }
  };

  const t = useMemo(() => CONTENT[language] ?? CONTENT.ko, [language]);
  const activeLanguage = language === "en" ? "en" : "ko";
  const applicationItems = useMemo(
    () => scheduleItems.map((item) => toApplicationItem(item, activeLanguage, t.application)),
    [activeLanguage, scheduleItems, t.application]
  );

  return (
    <>
      {hasHydrated && !language ? (
        <LanguageSelectionModal
          title={t.languageTitle}
          description={t.languageDesc}
          onSelect={handleLanguageSelect}
        />
      ) : null}

      <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-200/60 to-white text-neutral-900">
        <header className="top-0 z-40 border-b border-blue-900/10 bg-[rgb(222,240,255)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 md:px-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-lg font-semibold tracking-tight text-blue-950">SwingPop</div>
                <div className="text-xs text-blue-900/60">Introductory Landing Page</div>
              </div>

              <div className="hidden items-center gap-6 md:flex">
                {t.nav.map((item, index) => (
                  <a
                    key={`${language ?? "ko"}-${item}`}
                    href={`#${SECTION_IDS[index]}`}
                    className="text-sm text-blue-950/70 transition hover:text-blue-950"
                  >
                    {item}
                  </a>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 px-4 py-3 shadow-sm">
              <div>
                <div className="text-sm font-semibold text-blue-950">{t.languageBannerTitle}</div>
                <div className="text-xs text-blue-900/65">{t.languageBannerDesc}</div>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-full border border-blue-200 bg-white p-1.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => handleLanguageSelect("ko")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    language === "ko"
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-blue-900/75 hover:bg-blue-50"
                  }`}
                  aria-pressed={language === "ko"}
                >
                  한국어
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSelect("en")}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    language === "en"
                      ? "bg-blue-700 text-white shadow-sm"
                      : "text-blue-900/75 hover:bg-blue-50"
                  }`}
                  aria-pressed={language === "en"}
                >
                  English
                </button>
              </div>
            </div>
          </div>
        </header>

        <main aria-hidden={hasHydrated && !language ? true : undefined}>
          <SectionWrapper id="top" className="pt-4">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-white px-4 py-2 text-sm text-blue-900/70 shadow-sm">
                  {t.heroBadge}
                </div>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-blue-950 md:text-6xl">
                  {t.heroTitle}
                </h1>
                <p className="mt-6 max-w-2xl text-base leading-8 text-blue-950/70 md:text-lg">
                  {t.heroDesc}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#schedule"
                    onClick={() => setActiveFilter("all")}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-700 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:translate-y-[-1px]"
                  >
                    {t.heroPrimary}
                  </a>
                  <a
                    href="#about"
                    className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 py-3 text-sm font-medium text-blue-950 shadow-sm transition hover:translate-y-[-1px] hover:bg-blue-50"
                  >
                    {t.heroSecondary}
                  </a>
                </div>
              </div>
              <div>
                <ImagePlaceholder label="Hero Image Placeholder" height="h-[420px]" />
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="about">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <ImagePlaceholder label="Community Image Placeholder" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                  {t.sections[0].eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                  {t.sections[0].title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
                  {t.sections[0].body.map((paragraph) => (
                    <p key={`${language ?? "ko"}-about-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {t.sections[0].stats.map((stat) => (
                    <div key={`${language ?? "ko"}-${stat.label}`} className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
                      <div className="text-xs uppercase tracking-[0.2em] text-blue-900/45">{stat.label}</div>
                      <div className="mt-2 text-lg font-semibold text-blue-950">{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="swing" className="bg-white/75">
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                  {t.sections[1].eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                  {t.sections[1].title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
                  {t.sections[1].body.map((paragraph) => (
                    <p key={`${language ?? "ko"}-swing-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {t.sections[1].points.map((point) => (
                    <span
                      key={`${language ?? "ko"}-${point}`}
                      className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-950/80"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <ImagePlaceholder label="Swing Dance Image Placeholder" />
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="swingpop-style">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                {t.sections[2].eyebrow}
              </p>
              <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                {t.sections[2].title}
              </h2>
              <div className="mx-auto mt-6 max-w-3xl space-y-4 text-base leading-8 text-blue-950/70">
                {t.sections[2].body.map((paragraph) => (
                  <p key={`${language ?? "ko"}-style-${paragraph}`}>{paragraph}</p>
                ))}
              </div>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div className="grid gap-4 md:grid-cols-3">
                {t.sections[2].cards.map((card) => (
                  <div key={`${language ?? "ko"}-${card.title}`} className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm">
                    <div className="text-lg font-semibold text-blue-950">{card.title}</div>
                    <p className="mt-3 text-sm leading-7 text-blue-950/70">{card.desc}</p>
                  </div>
                ))}
              </div>
              <div>
                <ImagePlaceholder label="Class / Social Dance Image Placeholder" />
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="seoul-scene" className="bg-white/75">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <ImagePlaceholder label="Seoul Swing Scene Image Placeholder" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-900/60">
                  {t.sections[3].eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-blue-950 md:text-5xl">
                  {t.sections[3].title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-blue-950/70">
                  {t.sections[3].body.map((paragraph) => (
                    <p key={`${language ?? "ko"}-scene-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
                <div className="mt-8 rounded-3xl border border-blue-200 bg-gradient-to-r from-blue-50 to-sky-50 p-6 text-base leading-8 text-blue-950/80 shadow-sm">
                  {t.sections[3].highlight}
                </div>
              </div>
            </div>
          </SectionWrapper>

          <SectionWrapper id="schedule" className="bg-white/75">
            <ScheduleAndApplicationSection
              language={activeLanguage}
              scheduleSection={t.sections[4]}
              labels={t.application}
              items={applicationItems}
              isLoading={isScheduleLoading}
              error={scheduleError}
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              onApply={setSelectedApplication}
            />
          </SectionWrapper>
        </main>

        <footer className="border-t border-blue-900/10">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-blue-900/60 md:px-8">{t.footer}</div>
        </footer>

        <div className="h-28 md:hidden" aria-hidden="true" />
        <MobileStickyCta
          label={t.mobileApply}
          onClick={() => scrollToHash("#schedule")}
        />
        <ApplicationModal
          item={selectedApplication}
          language={activeLanguage}
          labels={t.applicationModal}
          detailLabels={t.application}
          onClose={() => setSelectedApplication(null)}
        />
      </div>
    </>
  );
}

export default function App() {
  const isAdminPath = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  if (isAdminPath) {
    return <AdminApp />;
  }

  return <PublicApp />;
}
