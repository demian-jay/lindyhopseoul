import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { agoraGuestbookApi } from "./api/agoraGuestbookMessages";
import { agoraNoticeApi } from "./api/agoraNotices";
import { agoraParticipantAvatarApi } from "./api/agoraParticipantAvatars";
import "./SwingpopAgora.css";

const AGORA_BGM_SRC = "/audio/swingpop-agora-bgm.mp3";
const AGORA_GUESTBOOK_MAX_LENGTH = 120;
const AGORA_GUESTBOOK_VISIBLE_LIMIT = 5;

const AGORA_COPY = {
  ko: {
    eyebrow: "Swingpop Agora",
    title: "스윙팝 아고라",
    description: "작은 댄스홀 맵에서 운영진 공지와 회원들의 짧은 인사를 확인하세요.",
    staffName: "Swingpop 운영진",
    latestPrefix: "Latest",
    openPanel: "공지 펼치기",
    closePanel: "공지 접기",
    noticesTitle: "운영진 공지",
    important: "중요",
    noticeLoading: "공지 확인 중",
    noticeLoadError: "공지를 불러오지 못했습니다.",
    emptyTitle: "표시할 공지가 없습니다.",
    emptyBody: "새 공지가 등록되면 이곳에 나타납니다.",
    musicOn: "BGM 켜짐",
    musicOff: "BGM 꺼짐",
    musicUnavailable: "BGM 준비 중",
    guestbookTitle: "아고라에 짧은 인사를 남겨보세요.",
    guestbookDescription: "7일 동안 아고라에 말풍선으로 표시됩니다.",
    guestbookLabel: "메시지 입력",
    guestbookPlaceholder: "오늘의 인사나 응원을 짧게 남겨주세요.",
    guestbookSubmit: "남기기",
    guestbookPosting: "남기는 중",
    guestbookLoading: "방명록 확인 중",
    guestbookLoadError: "방명록을 불러오지 못했습니다.",
    guestbookSubmitError: "방명록을 남기지 못했습니다.",
    guestbookEmptyError: "메시지를 입력해주세요.",
    guestbookLengthError: "120자 이하로 입력해주세요.",
    guestbookEmpty: "아직 떠 있는 회원 인사가 없습니다.",
    guestbookExpires: "7일 후 사라져요",
    participantLoading: "신청 회원 확인 중",
    participantLoadError: "신청 회원 아바타를 불러오지 못했습니다.",
    participantMore: (count) => `+${count}명 더`,
    mapLabel: "스윙팝 아고라 미니맵",
    mainHall: "Dance Hall",
    staffArea: "Notice",
    guestbookArea: "Guestbook",
    socialFloor: "Social Floor",
  },
  en: {
    eyebrow: "Swingpop Agora",
    title: "Swingpop Agora",
    description: "Step into a small dance hall map for staff notices and quick member hellos.",
    staffName: "Swingpop Staff",
    latestPrefix: "Latest",
    openPanel: "Open notices",
    closePanel: "Close notices",
    noticesTitle: "Staff Notices",
    important: "Important",
    noticeLoading: "Loading notices",
    noticeLoadError: "Could not load notices.",
    emptyTitle: "No visible notices.",
    emptyBody: "New staff notices will appear here.",
    musicOn: "BGM On",
    musicOff: "BGM Off",
    musicUnavailable: "BGM Pending",
    guestbookTitle: "Leave a short hello in the Agora.",
    guestbookDescription: "Your bubble will stay here for 7 days.",
    guestbookLabel: "Message",
    guestbookPlaceholder: "Leave a quick hello or cheer for the room.",
    guestbookSubmit: "Post",
    guestbookPosting: "Posting",
    guestbookLoading: "Loading guestbook",
    guestbookLoadError: "Could not load guestbook messages.",
    guestbookSubmitError: "Could not post your message.",
    guestbookEmptyError: "Please enter a message.",
    guestbookLengthError: "Please keep it under 120 characters.",
    guestbookEmpty: "No member bubbles are floating yet.",
    guestbookExpires: "Stays for 7 days",
    participantLoading: "Loading dancers",
    participantLoadError: "Could not load class participant avatars.",
    participantMore: (count) => `+${count} more`,
    mapLabel: "Swingpop Agora mini map",
    mainHall: "Dance Hall",
    staffArea: "Notice",
    guestbookArea: "Guestbook",
    socialFloor: "Social Floor",
  },
};

const STAFF_AVATAR = {
  id: "swingpop-staff",
  role: "staff",
  position: { top: "22%", left: "22%" },
  messageType: "notice",
};

const GUESTBOOK_SLOTS = [
  { top: "58%", left: "22%" },
  { top: "64%", left: "48%" },
  { top: "51%", left: "61%" },
  { top: "76%", left: "34%" },
  { top: "73%", left: "62%" },
];

const PARTICIPANT_SLOTS = [
  { top: "32%", left: "37%" },
  { top: "43%", left: "35%" },
  { top: "43%", left: "48%" },
  { top: "44%", left: "61%" },
  { top: "54%", left: "39%" },
  { top: "55%", left: "54%" },
  { top: "63%", left: "35%" },
  { top: "64%", left: "66%" },
  { top: "35%", left: "66%" },
  { top: "58%", left: "75%" },
  { top: "68%", left: "78%" },
  { top: "39%", left: "75%" },
];

function sortNoticesByLatest(notices) {
  return [...notices].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function localizedNoticeText(notice, language, field) {
  if (!notice) {
    return "";
  }

  const suffix = language === "en" ? "En" : "Ko";
  const fallbackSuffix = language === "en" ? "Ko" : "En";
  return notice[`${field}${suffix}`] || notice[`${field}${fallbackSuffix}`] || "";
}

function formatAgoraDate(value, language) {
  if (!value) {
    return "";
  }

  try {
    return new Intl.DateTimeFormat(language === "en" ? "en-US" : "ko-KR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function sortGuestbookByLatest(messages) {
  return [...messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function isGuestbookMessageVisible(message, now = new Date()) {
  if (!message?.visible || message.hiddenByAdmin) {
    return false;
  }

  if (!message.expiresAt) {
    return true;
  }

  return new Date(message.expiresAt).getTime() > now.getTime();
}

function nicknameInitial(nickname) {
  const normalized = typeof nickname === "string" ? nickname.trim() : "";
  return normalized ? normalized.slice(0, 1).toUpperCase() : "?";
}

export default function SwingpopAgora({
  language = "ko",
  notices = null,
  bgmSrc = AGORA_BGM_SRC,
  variant = "card",
  currentMember = null,
}) {
  const labels = AGORA_COPY[language] ?? AGORA_COPY.ko;
  const audioRef = useRef(null);
  const [titleLanguage, setTitleLanguage] = useState("ko");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [musicState, setMusicState] = useState("off");
  const [staffNotices, setStaffNotices] = useState([]);
  const [noticeLoadState, setNoticeLoadState] = useState("idle");
  const [noticeLoadError, setNoticeLoadError] = useState("");
  const [guestbookMessages, setGuestbookMessages] = useState([]);
  const [isGuestbookLoading, setIsGuestbookLoading] = useState(false);
  const [guestbookLoadError, setGuestbookLoadError] = useState("");
  const [isGuestbookSubmitting, setIsGuestbookSubmitting] = useState(false);
  const [participantAvatars, setParticipantAvatars] = useState([]);
  const [participantAdditionalCount, setParticipantAdditionalCount] = useState(0);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);
  const [participantLoadError, setParticipantLoadError] = useState("");
  const [guestbookMessage, setGuestbookMessage] = useState("");
  const [guestbookError, setGuestbookError] = useState("");
  const fallbackNotices = useMemo(() => (Array.isArray(notices) ? notices : []), [notices]);

  const visibleNotices = useMemo(
    () => sortNoticesByLatest(staffNotices.filter((notice) => notice.visible !== false)),
    [staffNotices]
  );
  const latestNotice = visibleNotices[0] ?? null;
  const isNoticeLoading = noticeLoadState === "loading";

  useEffect(() => {
    if (!latestNotice) {
      return undefined;
    }

    setTitleLanguage("ko");
    const titleTimer = window.setInterval(() => {
      setTitleLanguage((currentLanguage) => (currentLanguage === "ko" ? "en" : "ko"));
    }, 3800);

    return () => window.clearInterval(titleTimer);
  }, [latestNotice?.id]);

  useEffect(() => {
    let isMounted = true;

    setNoticeLoadState("loading");
    setNoticeLoadError("");

    agoraNoticeApi
      .findVisibleNotices()
      .then((nextNotices) => {
        if (!isMounted) {
          return;
        }

        setStaffNotices(Array.isArray(nextNotices) ? nextNotices : []);
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setStaffNotices(fallbackNotices);
        setNoticeLoadError(labels.noticeLoadError);
      })
      .finally(() => {
        if (isMounted) {
          setNoticeLoadState("ready");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackNotices, labels.noticeLoadError]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const loadGuestbookMessages = useCallback(async () => {
    setIsGuestbookLoading(true);
    setGuestbookLoadError("");

    try {
      const nextMessages = await agoraGuestbookApi.findVisibleMessages();
      setGuestbookMessages(Array.isArray(nextMessages) ? nextMessages : []);
    } catch {
      setGuestbookMessages([]);
      setGuestbookLoadError(labels.guestbookLoadError);
    } finally {
      setIsGuestbookLoading(false);
    }
  }, [labels.guestbookLoadError]);

  useEffect(() => {
    loadGuestbookMessages();
  }, [loadGuestbookMessages]);

  const loadParticipantAvatars = useCallback(async () => {
    setIsParticipantsLoading(true);
    setParticipantLoadError("");

    try {
      const response = await agoraParticipantAvatarApi.findParticipantAvatars();
      setParticipantAvatars(Array.isArray(response?.avatars) ? response.avatars : []);
      setParticipantAdditionalCount(Number(response?.additionalCount) || 0);
    } catch {
      setParticipantAvatars([]);
      setParticipantAdditionalCount(0);
      setParticipantLoadError(labels.participantLoadError);
    } finally {
      setIsParticipantsLoading(false);
    }
  }, [labels.participantLoadError]);

  useEffect(() => {
    loadParticipantAvatars();
  }, [loadParticipantAvatars]);

  const bubbleTitle = latestNotice
    ? titleLanguage === "ko"
      ? latestNotice.titleKo
      : latestNotice.titleEn
    : isNoticeLoading
      ? labels.noticeLoading
    : labels.emptyTitle;
  const isMusicPlaying = musicState === "on";
  const isMusicUnavailable = musicState === "unavailable";
  const musicLabel = isMusicUnavailable ? labels.musicUnavailable : isMusicPlaying ? labels.musicOn : labels.musicOff;
  const visibleGuestbookMessages = useMemo(
    () =>
      sortGuestbookByLatest(
        guestbookMessages.filter((message) => isGuestbookMessageVisible(message))
      )
        .slice(0, AGORA_GUESTBOOK_VISIBLE_LIMIT)
        .map((message, index) => ({
          ...message,
          initial: nicknameInitial(message.nickname),
          position: GUESTBOOK_SLOTS[index % GUESTBOOK_SLOTS.length],
        })),
    [guestbookMessages]
  );
  const visibleParticipantAvatars = useMemo(
    () =>
      participantAvatars.slice(0, PARTICIPANT_SLOTS.length).map((avatar, index) => ({
        ...avatar,
        initial: avatar.initial || nicknameInitial(avatar.nickname),
        position: PARTICIPANT_SLOTS[index % PARTICIPANT_SLOTS.length],
      })),
    [participantAvatars]
  );
  const visibleParticipantAdditionalCount =
    participantAdditionalCount + Math.max(0, participantAvatars.length - PARTICIPANT_SLOTS.length);
  const guestbookCharactersLeft = AGORA_GUESTBOOK_MAX_LENGTH - guestbookMessage.length;

  const handleMusicToggle = async () => {
    const audio = audioRef.current;

    if (!audio || !bgmSrc || isMusicUnavailable) {
      setMusicState("unavailable");
      return;
    }

    if (isMusicPlaying) {
      audio.pause();
      setMusicState("off");
      return;
    }

    try {
      audio.volume = 0.35;
      audio.loop = true;
      await audio.play();
      setMusicState("on");
    } catch {
      setMusicState("unavailable");
    }
  };

  const handleGuestbookChange = (event) => {
    const nextMessage = event.target.value;

    if (nextMessage.length > AGORA_GUESTBOOK_MAX_LENGTH) {
      setGuestbookError(labels.guestbookLengthError);
      return;
    }

    setGuestbookMessage(nextMessage);
    setGuestbookError("");
  };

  const handleGuestbookSubmit = async (event) => {
    event.preventDefault();

    const trimmedMessage = guestbookMessage.trim();

    if (!trimmedMessage) {
      setGuestbookError(labels.guestbookEmptyError);
      return;
    }

    if (trimmedMessage.length > AGORA_GUESTBOOK_MAX_LENGTH) {
      setGuestbookError(labels.guestbookLengthError);
      return;
    }

    setIsGuestbookSubmitting(true);
    setGuestbookError("");

    try {
      const createdMessage = await agoraGuestbookApi.createMessage({
        message: trimmedMessage,
      });
      setGuestbookMessages((currentMessages) => sortGuestbookByLatest([createdMessage, ...currentMessages]));
      setGuestbookMessage("");
    } catch (error) {
      setGuestbookError(error?.message || labels.guestbookSubmitError);
    } finally {
      setIsGuestbookSubmitting(false);
    }
  };

  const rootClassName = variant === "page" ? "swingpop-agora swingpop-agora--page" : "swingpop-agora";

  return (
    <section className={rootClassName} aria-labelledby="swingpop-agora-title">
      <div className="swingpop-agora__ambient" aria-hidden="true">
        <span className="swingpop-agora__spotlight swingpop-agora__spotlight--left" />
        <span className="swingpop-agora__spotlight swingpop-agora__spotlight--right" />
        <span className="swingpop-agora__wall-glow" />
      </div>
      <audio
        ref={audioRef}
        preload="none"
        onEnded={() => setMusicState("off")}
        onError={() => setMusicState("unavailable")}
      >
        {bgmSrc ? <source src={bgmSrc} type="audio/mpeg" /> : null}
      </audio>

      <div className="swingpop-agora__header">
        <div>
          <p className="swingpop-agora__eyebrow">{labels.eyebrow}</p>
          <h2 id="swingpop-agora-title" className="swingpop-agora__title">
            {labels.title}
          </h2>
          <p className="swingpop-agora__description">{labels.description}</p>
        </div>
        <button
          type="button"
          onClick={handleMusicToggle}
          disabled={isMusicUnavailable}
          className="swingpop-agora__music-button"
          aria-pressed={isMusicPlaying}
        >
          <span className="swingpop-agora__music-icon" aria-hidden="true">
            ♪
          </span>
          <span>{musicLabel}</span>
        </button>
      </div>

      <div className="swingpop-agora__map" aria-label={labels.mapLabel}>
        <div className="swingpop-agora__map-sky" aria-hidden="true" />
        <div className="swingpop-agora__map-path swingpop-agora__map-path--main" aria-hidden="true" />
        <div className="swingpop-agora__map-path swingpop-agora__map-path--side" aria-hidden="true" />

        <div className="swingpop-agora__map-zone swingpop-agora__map-zone--hall">
          <span>{labels.mainHall}</span>
        </div>
        <div className="swingpop-agora__map-zone swingpop-agora__map-zone--notice">
          <span>{labels.staffArea}</span>
        </div>
        <div className="swingpop-agora__map-zone swingpop-agora__map-zone--guestbook">
          <span>{labels.guestbookArea}</span>
        </div>
        <div className="swingpop-agora__map-zone swingpop-agora__map-zone--social">
          <span>{labels.socialFloor}</span>
        </div>

        <div className="swingpop-agora__participant-layer" aria-live="polite">
          {isParticipantsLoading ? (
            <p className="swingpop-agora__participant-note">{labels.participantLoading}</p>
          ) : participantLoadError ? (
            <p className="swingpop-agora__participant-note">{participantLoadError}</p>
          ) : (
            <>
              {visibleParticipantAvatars.map((avatar, index) => (
                <article
                  key={avatar.id || `${avatar.memberId}-${index}`}
                  className="swingpop-agora__participant-avatar-card"
                  style={{
                    "--avatar-top": avatar.position.top,
                    "--avatar-left": avatar.position.left,
                    "--avatar-delay": `${index * 70}ms`,
                  }}
                  title={avatar.classTitle || avatar.nickname}
                  aria-label={avatar.nickname}
                >
                  <div
                    className="swingpop-agora__participant-avatar"
                    data-role={avatar.role || "dancer"}
                    aria-hidden="true"
                  >
                    {avatar.initial}
                  </div>
                  <div className="swingpop-agora__participant-name">{avatar.nickname}</div>
                </article>
              ))}
              {visibleParticipantAdditionalCount > 0 ? (
                <div
                  className="swingpop-agora__participant-more"
                  style={{
                    "--avatar-top": "69%",
                    "--avatar-left": "50%",
                  }}
                >
                  {labels.participantMore(visibleParticipantAdditionalCount)}
                </div>
              ) : null}
            </>
          )}
        </div>

        <div
          className="swingpop-agora__staff-node"
          style={{
            "--avatar-top": STAFF_AVATAR.position.top,
            "--avatar-left": STAFF_AVATAR.position.left,
          }}
        >
          <div className="swingpop-agora__staff-wrap">
            <div className="swingpop-agora__staff" aria-label={labels.staffName} role="img">
              <span className="swingpop-agora__staff-face">
                <span className="swingpop-agora__staff-eye swingpop-agora__staff-eye--left" />
                <span className="swingpop-agora__staff-eye swingpop-agora__staff-eye--right" />
                <span className="swingpop-agora__staff-smile" />
              </span>
              <span className="swingpop-agora__staff-badge" aria-hidden="true" />
            </div>
            <span className="swingpop-agora__staff-shadow" aria-hidden="true" />
          </div>

          <button
            type="button"
            className="swingpop-agora__bubble"
            onClick={() => setIsPanelOpen((current) => !current)}
            aria-expanded={isPanelOpen}
            aria-controls="swingpop-agora-panel"
          >
            <span className="swingpop-agora__bubble-meta">
              {isNoticeLoading ? labels.noticeLoading : labels.latestPrefix}
            </span>
            <span
              key={`${latestNotice?.id || "empty"}-${titleLanguage}`}
              className="swingpop-agora__bubble-title"
            >
              {bubbleTitle}
            </span>
            <span className="swingpop-agora__bubble-action">
              {isPanelOpen ? labels.closePanel : labels.openPanel}
            </span>
          </button>
        </div>

        <div className="swingpop-agora__member-cloud" aria-live="polite">
          {isGuestbookLoading ? (
            <p className="swingpop-agora__member-empty">{labels.guestbookLoading}</p>
          ) : visibleGuestbookMessages.length === 0 ? (
            <p className="swingpop-agora__member-empty">{guestbookLoadError || labels.guestbookEmpty}</p>
          ) : (
            visibleGuestbookMessages.map((message, index) => (
              <article
                key={message.id}
                className="swingpop-agora__member-bubble-card"
                style={{
                  "--avatar-top": message.position.top,
                  "--avatar-left": message.position.left,
                  "--bubble-delay": `${index * 120}ms`,
                }}
              >
                <div className="swingpop-agora__member-avatar" aria-hidden="true">
                  {message.initial}
                </div>
                <div className="swingpop-agora__member-speech">
                  <div className="swingpop-agora__member-name">{message.nickname}</div>
                  <p>{message.message}</p>
                  <span>{labels.guestbookExpires}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {variant === "page" ? (
        <section className="swingpop-agora__guestbook" aria-labelledby="swingpop-agora-guestbook-title">
          <div className="swingpop-agora__guestbook-form-wrap">
            <div>
              <p className="swingpop-agora__guestbook-kicker">Member Bubbles</p>
              <h3 id="swingpop-agora-guestbook-title" className="swingpop-agora__guestbook-title">
                {labels.guestbookTitle}
              </h3>
              <p className="swingpop-agora__guestbook-description">{labels.guestbookDescription}</p>
            </div>

            <form className="swingpop-agora__guestbook-form" onSubmit={handleGuestbookSubmit}>
              <label className="swingpop-agora__guestbook-label" htmlFor="swingpop-agora-guestbook-message">
                {labels.guestbookLabel}
              </label>
              <div className="swingpop-agora__guestbook-input-row">
                <textarea
                  id="swingpop-agora-guestbook-message"
                  value={guestbookMessage}
                  onChange={handleGuestbookChange}
                  maxLength={AGORA_GUESTBOOK_MAX_LENGTH}
                  rows={2}
                  placeholder={labels.guestbookPlaceholder}
                  className="swingpop-agora__guestbook-input"
                />
                <button
                  type="submit"
                  className="swingpop-agora__guestbook-submit"
                  disabled={isGuestbookSubmitting}
                >
                  {isGuestbookSubmitting ? labels.guestbookPosting : labels.guestbookSubmit}
                </button>
              </div>
              <div className="swingpop-agora__guestbook-meta-row">
                <span className={guestbookError ? "swingpop-agora__guestbook-error" : ""}>
                  {guestbookError || labels.guestbookDescription}
                </span>
                <span>{guestbookCharactersLeft}</span>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      {isPanelOpen ? (
        <div id="swingpop-agora-panel" className="swingpop-agora__panel">
          <div className="swingpop-agora__panel-header">
            <h3 className="swingpop-agora__panel-title">{labels.noticesTitle}</h3>
            <button
              type="button"
              onClick={() => setIsPanelOpen(false)}
              className="swingpop-agora__panel-close"
              aria-label={labels.closePanel}
            >
              X
            </button>
          </div>

          {isNoticeLoading ? (
            <div className="swingpop-agora__empty">
              <strong>{labels.noticeLoading}</strong>
              <span>{labels.emptyBody}</span>
            </div>
          ) : visibleNotices.length === 0 ? (
            <div className="swingpop-agora__empty">
              <strong>{labels.emptyTitle}</strong>
              <span>{noticeLoadError || labels.emptyBody}</span>
            </div>
          ) : (
            <div className="swingpop-agora__notice-list">
              {visibleNotices.map((notice) => (
                <article key={notice.id} className="swingpop-agora__notice">
                  <div className="swingpop-agora__notice-topline">
                    {notice.important ? (
                      <span className="swingpop-agora__important">{labels.important}</span>
                    ) : null}
                    <time dateTime={notice.createdAt}>{formatAgoraDate(notice.createdAt, language)}</time>
                  </div>
                  <h4>{localizedNoticeText(notice, language, "title")}</h4>
                  <p>{localizedNoticeText(notice, language, "content")}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
