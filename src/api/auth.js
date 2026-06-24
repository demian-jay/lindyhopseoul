const DEFAULT_API_BASE_URL = "http://localhost:8080";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

async function request(path, options = {}) {
  const { body, headers, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const apiError = new Error(error?.message || `API request failed with status ${response.status}.`);
    apiError.status = response.status;
    throw apiError;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const authApi = {
  googleLoginUrl() {
    return `${API_BASE_URL}/oauth2/authorization/google`;
  },
  me() {
    return request("/api/auth/me");
  },
  logout() {
    return request("/api/auth/logout", {
      method: "POST",
    });
  },
  getSettings() {
    return request("/api/members/me/settings");
  },
  updateSettings(payload) {
    return request("/api/members/me/settings", {
      method: "PATCH",
      body: payload,
    });
  },
  withdraw() {
    return request("/api/members/me", {
      method: "DELETE",
    });
  },
  getMyMessages() {
    return request("/api/members/me/messages");
  },
  getMyMessageUnreadCount() {
    return request("/api/members/me/messages/unread-count");
  },
  sendMyMessage(payload) {
    return request("/api/members/me/messages", {
      method: "POST",
      body: payload,
    });
  },
  getMyClassApplications(language) {
    const query = language ? `?language=${encodeURIComponent(language)}` : "";
    return request(`/api/members/me/class-applications${query}`);
  },
  getMyLessonNotices(lessonId) {
    return request(`/api/members/me/lessons/${lessonId}/notices`);
  },
  getMyLessonNoticeUnreadCount() {
    return request("/api/members/me/lesson-notices/unread-count");
  },
  markMyLessonNoticesRead(lessonId) {
    return request(`/api/members/me/lessons/${lessonId}/notices/read`, {
      method: "PATCH",
    });
  },
  getAppliedClassIds() {
    return request("/api/members/me/applied-class-ids");
  },
  getAppliedScheduleItemIds() {
    return request("/api/members/me/applied-schedule-item-ids");
  },
};
