import React, { useEffect, useMemo, useState } from "react";

const CONTENT = {
  ko: {
    nav: ["스윙팝", "스윙댄스", "스윙팝의 춤", "서울 씬", "수업 등록"],
    heroBadge: "SwingPop Community",
    heroTitle: "서울에서 만나는 따뜻한 스윙댄스 커뮤니티",
    heroDesc:
      "스윙팝은 한국인과 외국인이 함께 어울리며 춤과 음악, 사람 사이의 연결을 즐기는 스윙댄스 커뮤니티입니다. 처음 온 사람도 편안하게 분위기를 느끼고, 서울의 스윙 문화를 자연스럽게 만나볼 수 있도록 구성했습니다.",
    heroPrimary: "수업 보러가기",
    heroSecondary: "커뮤니티 소개 보기",
    mobileApply: "지금 신청하기",
    languageTitle: "언어를 선택해주세요",
    languageDesc: "Choose your preferred language to continue.",
    languageBannerTitle: "Language / 언어 선택",
    languageBannerDesc: "First time here? Choose your preferred language before exploring.",
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
        id: "register",
        eyebrow: "5. 수업 등록",
        title: "이제 직접 경험해보세요",
        body: [
          "처음이어도 괜찮습니다. 수업과 커뮤니티를 통해 춤, 음악, 사람을 함께 만나는 경험을 시작해보세요.",
          "아래 버튼과 링크 영역은 나중에 실제 신청 페이지로 연결할 수 있도록 비워두었습니다.",
        ],
        ctaPrimary: "수업 신청 링크",
        ctaSecondary: "문의하기",
      },
    ],
    footer: "SwingPop · Dance, Music, Community",
  },
  en: {
    nav: ["SwingPop", "Swing Dance", "Our Style", "Seoul Scene", "Register"],
    heroBadge: "SwingPop Community",
    heroTitle: "A warm swing dance community in Seoul",
    heroDesc:
      "SwingPop is a swing dance community where Koreans and internationals connect through dance, music, and shared experiences. This page is designed to help first-time visitors quickly understand who we are and why Seoul’s swing dance culture is worth exploring.",
    heroPrimary: "View Classes",
    heroSecondary: "About the Community",
    mobileApply: "Apply Now",
    languageTitle: "Choose your language",
    languageDesc: "Select Korean or English to continue.",
    languageBannerTitle: "Language / 언어 선택",
    languageBannerDesc: "First time here? Choose your preferred language before exploring.",
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
        id: "register",
        eyebrow: "5. Register for Class",
        title: "Come experience it for yourself",
        body: [
          "It is okay if this is your first time. Through class and community, you can begin meeting dance, music, and people all at once.",
          "The button and link area below are left ready for you to connect to a real registration page later.",
        ],
        ctaPrimary: "Class Registration Link",
        ctaSecondary: "Contact Us",
      },
    ],
    footer: "SwingPop · Dance, Music, Community",
  },
};

const SECTION_IDS = ["about", "swing", "swingpop-style", "seoul-scene", "register"];
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

  const koRegister = CONTENT.ko.sections.find((section) => section.id === "register");
  const enRegister = CONTENT.en.sections.find((section) => section.id === "register");

  if (!koRegister?.ctaPrimary || !enRegister?.ctaPrimary) {
    throw new Error("Register section CTA labels are required in both languages.");
  }

  if (!CONTENT.ko.mobileApply || !CONTENT.en.mobileApply) {
    throw new Error("Mobile sticky CTA label is required in both languages.");
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

function MobileStickyApplyButton({ label, href = "#register", onClick }) {
  const handleClick = (event) => {
    if (onClick) {
      onClick(event);
      return;
    }

    if (href?.startsWith("#")) {
      event.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-blue-900/10 bg-white/90 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur md:hidden">
      <a
        href={href}
        onClick={handleClick}
        className="flex min-h-[56px] w-full items-center justify-center rounded-2xl bg-blue-700 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={label}
      >
        {label}
      </a>
    </div>
  );
}

export default function App() {
  const [language, setLanguage] = useState(null);
  const [hasHydrated, setHasHydrated] = useState(false);

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

  const handleLanguageSelect = (nextLanguage) => {
    setLanguage(nextLanguage);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    }
  };

  const t = useMemo(() => CONTENT[language] ?? CONTENT.ko, [language]);

  return (
    <>
      {hasHydrated && !language ? (
        <LanguageSelectionModal
          title={t.languageTitle}
          description={t.languageDesc}
          onSelect={handleLanguageSelect}
        />
      ) : null}

      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-blue-50/40 to-white text-neutral-900">
        <header className="sticky top-0 z-40 border-b border-blue-900/10 bg-white/85 backdrop-blur">
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
                    href="#register"
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

          <SectionWrapper id="register">
            <div className="grid gap-10 rounded-[2rem] border border-blue-800/20 bg-gradient-to-br from-blue-900 via-blue-800 to-sky-800 px-6 py-10 text-white shadow-xl md:px-10 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/60">
                  {t.sections[4].eyebrow}
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">
                  {t.sections[4].title}
                </h2>
                <div className="mt-6 space-y-4 text-base leading-8 text-white/75">
                  {t.sections[4].body.map((paragraph) => (
                    <p key={`${language ?? "ko"}-register-${paragraph}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto">
                <a
                  href="#"
                  className="inline-flex min-w-[220px] items-center justify-center rounded-2xl bg-white px-6 py-3 text-sm font-medium text-blue-950 transition hover:translate-y-[-1px] hover:bg-blue-50"
                >
                  {t.sections[4].ctaPrimary}
                </a>
                <a
                  href="#"
                  className="inline-flex min-w-[220px] items-center justify-center rounded-2xl border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:translate-y-[-1px]"
                >
                  {t.sections[4].ctaSecondary}
                </a>
              </div>
            </div>
          </SectionWrapper>
        </main>

        <footer className="border-t border-blue-900/10">
          <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-blue-900/60 md:px-8">{t.footer}</div>
        </footer>

        <div className="h-28 md:hidden" aria-hidden="true" />
        <MobileStickyApplyButton label={t.mobileApply} href="#register" />
      </div>
    </>
  );
}
