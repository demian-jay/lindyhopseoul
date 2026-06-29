const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Reference-only mock data kept for local UI experiments.
// The live Agora guestbook screen now uses the DB-backed API in src/api/agoraGuestbookMessages.js.
function toIsoOffset(now, days) {
  return new Date(now.getTime() + days * ONE_DAY_MS).toISOString();
}

export function createMockAgoraGuestbookMessages(now = new Date()) {
  return [
    {
      id: "guestbook-mock-welcome",
      memberId: "mock-member-1",
      nickname: "Mina",
      message: "오늘도 즐겁게 춤춰요!",
      createdAt: toIsoOffset(now, -1),
      expiresAt: toIsoOffset(now, 6),
      visible: true,
      hiddenByAdmin: false,
      type: "member",
    },
    {
      id: "guestbook-mock-hello",
      memberId: "mock-member-2",
      nickname: "Joon",
      message: "처음 오신 분들도 편하게 인사해요.",
      createdAt: toIsoOffset(now, -2),
      expiresAt: toIsoOffset(now, 5),
      visible: true,
      hiddenByAdmin: false,
      type: "member",
    },
  ];
}
