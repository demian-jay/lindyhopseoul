import React, { useCallback, useEffect, useMemo, useState } from "react";

import { adminApi } from "./api/admin";
import {
  Field,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  TextArea,
  TextInput,
} from "./EventManagementPanel";

const EVENT_TYPES = ["REGULAR_CLASS", "PARTY", "DIALOGUE_PARTY"];
const LESSON_TYPES = ["LEVEL1", "LEVEL2", "LEVEL3", "LEVEL4", "WORKSHOP", "EXPERIENCE"];
const LESSON_SCHEDULE_TYPES = ["SINGLE_DAY", "PERIOD"];
const SUPPORTED_LANGUAGES = ["ko", "en"];
// Sunday is 0, matching Date#getDay and how the backend stores it.
const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6];

const COPY = {
  Kor: {
    title: "등록 기본값",
    intro:
      "이벤트와 수업을 새로 등록할 때 양식이 미리 채워지는 값입니다. 여기서 바꾸면 이후 등록부터 적용되고, 이미 등록된 이벤트와 수업은 바뀌지 않습니다.",
    eventTypes: { REGULAR_CLASS: "정규수업", PARTY: "파티", DIALOGUE_PARTY: "Dialogue 소셜댄스" },
    lessonTypes: {
      LEVEL1: "레벨 1",
      LEVEL2: "레벨 2",
      LEVEL3: "레벨 3",
      LEVEL4: "레벨 4",
      WORKSHOP: "워크샵",
      EXPERIENCE: "체험",
    },
    scheduleTypes: { SINGLE_DAY: "하루", PERIOD: "기간" },
    weekdays: ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"],
    noWeekday: "반복 없음 (일회성)",
    noDefaultLesson: "지정 안 함",
    eventSection: "이벤트 기본값",
    copySection: "이벤트 소개 문구",
    lessonSection: "수업 기본값",
    weekday: "반복 요일",
    displayOrder: "표시 순서",
    startTime: "시작 시각",
    endTime: "종료 시각",
    location: "장소",
    googleMapUrl: "구글 지도 URL",
    naverMapUrl: "네이버 지도 URL",
    addressInfoEnabled: "주소 정보 표시",
    defaultLessonType: "기본 수업 타입",
    scheduleType: "일정 유형",
    fee: "수강료",
    roleSelectionEnabled: "리드/팔로우 선택 사용",
    languageKo: "한국어",
    languageEn: "English",
    copyTitle: "제목",
    copyShort: "짧은 설명",
    copyDescription: "설명",
    save: "저장",
    saving: "저장 중…",
    reset: "되돌리기",
    saved: "저장했습니다.",
    loading: "불러오는 중…",
    loadError: "기본값을 불러오지 못했습니다.",
    timeHint: "HH:MM",
    unsaved: "저장하지 않은 변경이 있습니다.",
  },
  Eng: {
    title: "Registration Defaults",
    intro:
      "What the form pre-fills when you register a new event or lesson. Changes apply to later registrations; events and lessons already saved are untouched.",
    eventTypes: { REGULAR_CLASS: "Regular Classes", PARTY: "Party", DIALOGUE_PARTY: "Dialogue Social" },
    lessonTypes: {
      LEVEL1: "Level 1",
      LEVEL2: "Level 2",
      LEVEL3: "Level 3",
      LEVEL4: "Level 4",
      WORKSHOP: "Workshop",
      EXPERIENCE: "Experience",
    },
    scheduleTypes: { SINGLE_DAY: "Single day", PERIOD: "Period" },
    weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    noWeekday: "Does not recur (one-off)",
    noDefaultLesson: "None",
    eventSection: "Event defaults",
    copySection: "Event copy",
    lessonSection: "Lesson defaults",
    weekday: "Recurring weekday",
    displayOrder: "Display order",
    startTime: "Start time",
    endTime: "End time",
    location: "Location",
    googleMapUrl: "Google Maps URL",
    naverMapUrl: "Naver Map URL",
    addressInfoEnabled: "Show address info",
    defaultLessonType: "Default lesson type",
    scheduleType: "Schedule type",
    fee: "Fee",
    roleSelectionEnabled: "Lead/follow selection",
    languageKo: "Korean",
    languageEn: "English",
    copyTitle: "Title",
    copyShort: "Short description",
    copyDescription: "Description",
    save: "Save",
    saving: "Saving…",
    reset: "Revert",
    saved: "Saved.",
    loading: "Loading…",
    loadError: "Could not load the defaults.",
    timeHint: "HH:MM",
    unsaved: "You have unsaved changes.",
  },
};

function t(langCd) {
  return COPY[langCd] || COPY.Kor;
}

/**
 * The API's response for one event type, flattened into the shape the form
 * holds: every field a controlled string, and a row per lesson type whether or
 * not the server had one, so a level nobody has filled in is still editable.
 */
function toForm(eventType) {
  const lessonsByType = new Map((eventType.lessons || []).map((lesson) => [lesson.lessonType, lesson]));

  return {
    eventType: eventType.eventType,
    weekday: eventType.weekday === null || eventType.weekday === undefined ? "" : String(eventType.weekday),
    displayOrder: String(eventType.displayOrder ?? 0),
    startTime: eventType.startTime || "",
    endTime: eventType.endTime || "",
    location: eventType.location || "",
    addressInfoEnabled: Boolean(eventType.addressInfoEnabled),
    googleMapUrl: eventType.googleMapUrl || "",
    naverMapUrl: eventType.naverMapUrl || "",
    defaultLessonType: eventType.defaultLessonType || "",
    translations: SUPPORTED_LANGUAGES.reduce((translations, languageCode) => {
      const copy = eventType.translations?.[languageCode] || {};
      translations[languageCode] = {
        title: copy.title || "",
        shortDescription: copy.shortDescription || "",
        description: copy.description || "",
      };
      return translations;
    }, {}),
    lessons: LESSON_TYPES.reduce((lessons, lessonType) => {
      const lesson = lessonsByType.get(lessonType) || {};
      lessons[lessonType] = {
        scheduleType: lesson.scheduleType || "SINGLE_DAY",
        startTime: lesson.startTime || "",
        endTime: lesson.endTime || "",
        fee: lesson.fee ?? "0",
        displayOrder: String(lesson.displayOrder ?? 10),
        roleSelectionEnabled: Boolean(lesson.roleSelectionEnabled),
        translations: SUPPORTED_LANGUAGES.reduce((translations, languageCode) => {
          const copy = lesson.translations?.[languageCode] || {};
          translations[languageCode] = {
            title: copy.title || "",
            description: copy.description || "",
          };
          return translations;
        }, {}),
      };
      return lessons;
    }, {}),
  };
}

function toPayload(form) {
  return {
    weekday: form.weekday === "" ? null : Number(form.weekday),
    displayOrder: Number(form.displayOrder) || 0,
    startTime: form.startTime,
    endTime: form.endTime,
    location: form.location,
    addressInfoEnabled: form.addressInfoEnabled,
    googleMapUrl: form.googleMapUrl,
    naverMapUrl: form.naverMapUrl,
    defaultLessonType: form.defaultLessonType || null,
    translations: form.translations,
    lessons: LESSON_TYPES.map((lessonType) => ({
      lessonType,
      ...form.lessons[lessonType],
      displayOrder: Number(form.lessons[lessonType].displayOrder) || 0,
    })),
  };
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-swing-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-swing-border/70 text-swing-teal-deep focus:ring-swing-teal/40"
      />
      <span>{label}</span>
    </label>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-swing-border/50 bg-swing-paper p-4">
      <h3 className="text-sm font-bold text-swing-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function EventDefaultsPanel({ token, langCd }) {
  const copy = t(langCd);
  const [forms, setForms] = useState(null);
  const [loaded, setLoaded] = useState(null);
  const [activeEventType, setActiveEventType] = useState(EVENT_TYPES[0]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const data = await adminApi.getEventDefaults(token);
      const next = {};
      (data.eventTypes || []).forEach((eventType) => {
        next[eventType.eventType] = toForm(eventType);
      });
      setForms(next);
      setLoaded(JSON.stringify(next));
    } catch (nextError) {
      setError(nextError.message || copy.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [copy.loadError, token]);

  useEffect(() => {
    load();
  }, [load]);

  const form = forms?.[activeEventType] || null;
  const isDirty = useMemo(
    () => Boolean(forms) && loaded !== null && JSON.stringify(forms) !== loaded,
    [forms, loaded]
  );

  const patch = (changes) => {
    setNotice("");
    setForms((current) => ({
      ...current,
      [activeEventType]: { ...current[activeEventType], ...changes },
    }));
  };

  const patchCopy = (languageCode, changes) => {
    setNotice("");
    setForms((current) => {
      const target = current[activeEventType];
      return {
        ...current,
        [activeEventType]: {
          ...target,
          translations: {
            ...target.translations,
            [languageCode]: { ...target.translations[languageCode], ...changes },
          },
        },
      };
    });
  };

  const patchLesson = (lessonType, changes) => {
    setNotice("");
    setForms((current) => {
      const target = current[activeEventType];
      return {
        ...current,
        [activeEventType]: {
          ...target,
          lessons: {
            ...target.lessons,
            [lessonType]: { ...target.lessons[lessonType], ...changes },
          },
        },
      };
    });
  };

  const patchLessonCopy = (lessonType, languageCode, changes) => {
    setNotice("");
    setForms((current) => {
      const target = current[activeEventType];
      const lesson = target.lessons[lessonType];
      return {
        ...current,
        [activeEventType]: {
          ...target,
          lessons: {
            ...target.lessons,
            [lessonType]: {
              ...lesson,
              translations: {
                ...lesson.translations,
                [languageCode]: { ...lesson.translations[languageCode], ...changes },
              },
            },
          },
        },
      };
    });
  };

  const handleSave = async () => {
    if (!form) {
      return;
    }
    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const saved = await adminApi.updateEventDefaults(token, activeEventType, toPayload(form));
      // Re-seed from the response rather than trusting the local copy: the server
      // trims blanks to null and normalises the fee, and the form should show
      // what was actually stored.
      setForms((current) => {
        const next = { ...current, [activeEventType]: toForm(saved) };
        setLoaded(JSON.stringify(next));
        return next;
      });
      setNotice(copy.saved);
    } catch (nextError) {
      setError(nextError.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-swing-muted">{copy.loading}</p>;
  }

  if (!form) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-swing-rust">{error || copy.loadError}</p>
        <SecondaryButton type="button" onClick={load}>
          {copy.reset}
        </SecondaryButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-lg font-bold text-swing-ink">{copy.title}</h2>
        <p className="text-sm text-swing-muted">{copy.intro}</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {EVENT_TYPES.map((eventType) => (
          <button
            key={eventType}
            type="button"
            onClick={() => setActiveEventType(eventType)}
            className={`min-h-[36px] rounded-lg border px-3 text-sm font-semibold transition ${
              eventType === activeEventType
                ? "border-swing-teal-deep bg-swing-teal-deep text-swing-paper"
                : "border-swing-border/55 bg-swing-paper text-swing-ink/80 hover:bg-swing-cream/50"
            }`}
          >
            {copy.eventTypes[eventType]}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-swing-rust">{error}</p> : null}
      {notice ? <p className="text-sm text-swing-teal-deep">{notice}</p> : null}
      {isDirty && !notice ? <p className="text-sm text-swing-muted">{copy.unsaved}</p> : null}

      <Section title={copy.eventSection}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label={copy.weekday}>
            <SelectInput value={form.weekday} onChange={(event) => patch({ weekday: event.target.value })}>
              <option value="">{copy.noWeekday}</option>
              {WEEKDAYS.map((weekday) => (
                <option key={weekday} value={String(weekday)}>
                  {copy.weekdays[weekday]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={copy.displayOrder}>
            <TextInput
              type="number"
              min="0"
              value={form.displayOrder}
              onChange={(event) => patch({ displayOrder: event.target.value })}
            />
          </Field>
          <Field label={copy.defaultLessonType}>
            <SelectInput
              value={form.defaultLessonType}
              onChange={(event) => patch({ defaultLessonType: event.target.value })}
            >
              <option value="">{copy.noDefaultLesson}</option>
              {LESSON_TYPES.map((lessonType) => (
                <option key={lessonType} value={lessonType}>
                  {copy.lessonTypes[lessonType]}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label={`${copy.startTime} (${copy.timeHint})`}>
            <TextInput type="time" value={form.startTime} onChange={(event) => patch({ startTime: event.target.value })} />
          </Field>
          <Field label={`${copy.endTime} (${copy.timeHint})`}>
            <TextInput type="time" value={form.endTime} onChange={(event) => patch({ endTime: event.target.value })} />
          </Field>
          <Field label={copy.location}>
            <TextInput value={form.location} onChange={(event) => patch({ location: event.target.value })} />
          </Field>
          <Field label={copy.googleMapUrl}>
            <TextInput value={form.googleMapUrl} onChange={(event) => patch({ googleMapUrl: event.target.value })} />
          </Field>
          <Field label={copy.naverMapUrl}>
            <TextInput value={form.naverMapUrl} onChange={(event) => patch({ naverMapUrl: event.target.value })} />
          </Field>
        </div>
        <div className="mt-3">
          <Toggle
            label={copy.addressInfoEnabled}
            checked={form.addressInfoEnabled}
            onChange={(checked) => patch({ addressInfoEnabled: checked })}
          />
        </div>
      </Section>

      <Section title={copy.copySection}>
        <div className="grid gap-4 lg:grid-cols-2">
          {SUPPORTED_LANGUAGES.map((languageCode) => (
            <div key={languageCode} className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wide text-swing-muted">
                {languageCode === "ko" ? copy.languageKo : copy.languageEn}
              </p>
              <Field label={copy.copyTitle}>
                <TextInput
                  value={form.translations[languageCode].title}
                  onChange={(event) => patchCopy(languageCode, { title: event.target.value })}
                />
              </Field>
              <Field label={copy.copyShort}>
                <TextInput
                  value={form.translations[languageCode].shortDescription}
                  onChange={(event) => patchCopy(languageCode, { shortDescription: event.target.value })}
                />
              </Field>
              <Field label={copy.copyDescription}>
                <TextArea
                  rows={5}
                  value={form.translations[languageCode].description}
                  onChange={(event) => patchCopy(languageCode, { description: event.target.value })}
                />
              </Field>
            </div>
          ))}
        </div>
      </Section>

      <Section title={copy.lessonSection}>
        <div className="space-y-3">
          {LESSON_TYPES.map((lessonType) => {
            const lesson = form.lessons[lessonType];
            return (
              <details key={lessonType} className="rounded-lg border border-swing-border/45 bg-swing-cream/40 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-swing-ink">
                  {copy.lessonTypes[lessonType]}
                </summary>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Field label={copy.scheduleType}>
                    <SelectInput
                      value={lesson.scheduleType}
                      onChange={(event) => patchLesson(lessonType, { scheduleType: event.target.value })}
                    >
                      {LESSON_SCHEDULE_TYPES.map((scheduleType) => (
                        <option key={scheduleType} value={scheduleType}>
                          {copy.scheduleTypes[scheduleType]}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                  <Field label={copy.startTime}>
                    <TextInput
                      type="time"
                      value={lesson.startTime}
                      onChange={(event) => patchLesson(lessonType, { startTime: event.target.value })}
                    />
                  </Field>
                  <Field label={copy.endTime}>
                    <TextInput
                      type="time"
                      value={lesson.endTime}
                      onChange={(event) => patchLesson(lessonType, { endTime: event.target.value })}
                    />
                  </Field>
                  <Field label={copy.fee}>
                    <TextInput
                      type="number"
                      min="0"
                      value={lesson.fee}
                      onChange={(event) => patchLesson(lessonType, { fee: event.target.value })}
                    />
                  </Field>
                  <Field label={copy.displayOrder}>
                    <TextInput
                      type="number"
                      min="0"
                      value={lesson.displayOrder}
                      onChange={(event) => patchLesson(lessonType, { displayOrder: event.target.value })}
                    />
                  </Field>
                  <div className="flex items-end">
                    <Toggle
                      label={copy.roleSelectionEnabled}
                      checked={lesson.roleSelectionEnabled}
                      onChange={(checked) => patchLesson(lessonType, { roleSelectionEnabled: checked })}
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-4 lg:grid-cols-2">
                  {SUPPORTED_LANGUAGES.map((languageCode) => (
                    <div key={languageCode} className="space-y-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-swing-muted">
                        {languageCode === "ko" ? copy.languageKo : copy.languageEn}
                      </p>
                      <Field label={copy.copyTitle}>
                        <TextInput
                          value={lesson.translations[languageCode].title}
                          onChange={(event) =>
                            patchLessonCopy(lessonType, languageCode, { title: event.target.value })
                          }
                        />
                      </Field>
                      <Field label={copy.copyDescription}>
                        <TextArea
                          rows={4}
                          value={lesson.translations[languageCode].description}
                          onChange={(event) =>
                            patchLessonCopy(lessonType, languageCode, { description: event.target.value })
                          }
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </Section>

      <div className="flex flex-wrap gap-2">
        <PrimaryButton type="button" onClick={handleSave} disabled={isSaving || !isDirty}>
          {isSaving ? copy.saving : copy.save}
        </PrimaryButton>
        <SecondaryButton type="button" onClick={load} disabled={isSaving || !isDirty}>
          {copy.reset}
        </SecondaryButton>
      </div>
    </div>
  );
}
