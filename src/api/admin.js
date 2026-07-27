const DEFAULT_API_BASE_URL = "http://localhost:8080";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, value);
    }
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

async function request(path, options = {}) {
  const { token, body, headers, ...fetchOptions } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...fetchOptions,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => null);

    // The backend uses this code, not a sentence, when an account still owes a
    // password change. Announce it so the app can switch to the change screen,
    // and never let the bare code surface as if it were a message a person
    // should read. This is a safety net; the normal path is the login response
    // flagging the account before any other call is made.
    if (response.status === 403 && error?.message === "PASSWORD_CHANGE_REQUIRED") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("swingpop:password-change-required"));
      }
      const guardError = new Error("PASSWORD_CHANGE_REQUIRED");
      guardError.code = "PASSWORD_CHANGE_REQUIRED";
      throw guardError;
    }

    const requestError = new Error(error?.message || `API request failed with status ${response.status}.`);
    requestError.status = response.status;
    throw requestError;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const adminApi = {
  login(payload) {
    return request("/api/admin/auth/login", {
      method: "POST",
      body: payload,
    });
  },
  me(token) {
    return request("/api/admin/auth/me", { token });
  },
  logout(token) {
    return request("/api/admin/auth/logout", {
      method: "POST",
      token,
    });
  },
  changeOwnPassword(token, payload) {
    return request("/api/admin/auth/me/password", {
      method: "POST",
      token,
      body: payload,
    });
  },
  checkLoginIdAvailable(token, loginId) {
    return request(`/api/admin/auth/me/login-id/available${buildQuery({ loginId })}`, { token });
  },
  changeOwnLoginId(token, payload) {
    return request("/api/admin/auth/me/login-id", {
      method: "POST",
      token,
      body: payload,
    });
  },
  changeOwnLanguage(token, payload) {
    return request("/api/admin/auth/me/language", {
      method: "POST",
      token,
      body: payload,
    });
  },
  getPushVapidPublicKey(token) {
    return request("/api/admin/push/vapid-public-key", { token });
  },
  savePushSubscription(token, subscription) {
    return request("/api/admin/push/subscriptions", {
      method: "POST",
      token,
      body: subscription,
    });
  },
  deletePushSubscription(token, endpoint) {
    return request("/api/admin/push/subscriptions", {
      method: "DELETE",
      token,
      body: { endpoint },
    });
  },
  getPushSettings(token) {
    return request("/api/admin/push/settings", { token });
  },
  updatePushSettings(token, payload) {
    return request("/api/admin/push/settings", {
      method: "PUT",
      token,
      body: payload,
    });
  },
  findAdmins(token) {
    return request("/api/admin/users/admins", { token });
  },
  createAdmin(token, payload) {
    return request("/api/admin/users/admins", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateAdmin(token, adminUserCd, payload) {
    return request(`/api/admin/users/admins/${adminUserCd}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deactivateAdmin(token, adminUserCd) {
    return request(`/api/admin/users/admins/${adminUserCd}/deactivate`, {
      method: "PATCH",
      token,
    });
  },
  findMembers(token, params = {}) {
    return request(`/api/admin/members${buildQuery(params)}`, { token });
  },
  suspendMember(token, memberId, payload) {
    return request(`/api/admin/members/${memberId}/suspend`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  reactivateMember(token, memberId, payload) {
    return request(`/api/admin/members/${memberId}/reactivate`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  findMemberActionLogs(token, params = {}) {
    return request(`/api/admin/member-action-logs${buildQuery(params)}`, { token });
  },
  findOperationCheckAssignees(token) {
    return request("/api/admin/operation-checks/assignees", { token });
  },
  findOperationCheckSummary(token) {
    return request("/api/admin/operation-checks/summary", { token });
  },
  findOperationChecks(token, params = {}) {
    return request(`/api/admin/operation-checks${buildQuery(params)}`, { token });
  },
  createOperationCheck(token, payload) {
    return request("/api/admin/operation-checks", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateOperationCheck(token, id, payload) {
    return request(`/api/admin/operation-checks/${id}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  createOperationCheckComment(token, id, payload) {
    return request(`/api/admin/operation-checks/${id}/comments`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  completeOperationCheck(token, id, payload) {
    return request(`/api/admin/operation-checks/${id}/done`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  findTeachers(token) {
    return request("/api/admin/users/teachers", { token });
  },
  createTeacher(token, payload) {
    return request("/api/admin/users/teachers", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateTeacher(token, teacherUserCd, payload) {
    return request(`/api/admin/users/teachers/${teacherUserCd}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deactivateTeacher(token, teacherUserCd) {
    return request(`/api/admin/users/teachers/${teacherUserCd}/deactivate`, {
      method: "PATCH",
      token,
    });
  },
  bootstrapKnowledgeBase(token) {
    return request("/api/admin/knowledge-base/bootstrap", { token });
  },
  findKnowledgeCategories(token) {
    return request("/api/admin/knowledge-categories", { token });
  },
  createKnowledgeCategory(token, payload) {
    return request("/api/admin/knowledge-categories", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateKnowledgeCategory(token, id, payload) {
    return request(`/api/admin/knowledge-categories/${id}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deleteKnowledgeCategory(token, id) {
    return request(`/api/admin/knowledge-categories/${id}`, {
      method: "DELETE",
      token,
    });
  },
  findKnowledgeItems(token) {
    return request("/api/admin/knowledge-items", { token });
  },
  findKnowledgeItem(token, id) {
    return request(`/api/admin/knowledge-items/${id}`, { token });
  },
  createKnowledgeItem(token, payload) {
    return request("/api/admin/knowledge-items", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateKnowledgeItem(token, id, payload) {
    return request(`/api/admin/knowledge-items/${id}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deleteKnowledgeItem(token, id) {
    return request(`/api/admin/knowledge-items/${id}`, {
      method: "DELETE",
      token,
    });
  },
  findEvents(token, params = {}) {
    return request(`/api/admin/events${buildQuery(params)}`, { token });
  },
  findEvent(token, eventId) {
    return request(`/api/admin/events/${eventId}`, { token });
  },
  // What the event and lesson registration forms open with. Readable by anyone
  // who may register; only super admins may write, which is enforced server-side.
  getEventDefaults(token) {
    return request("/api/admin/event-defaults", { token });
  },
  updateEventDefaults(token, eventType, payload) {
    return request(`/api/admin/event-defaults/${eventType}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  createEvent(token, payload) {
    return request("/api/admin/events", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateEvent(token, eventId, payload) {
    return request(`/api/admin/events/${eventId}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deleteEvent(token, eventId) {
    return request(`/api/admin/events/${eventId}`, {
      method: "DELETE",
      token,
    });
  },
  // Lessons across every event in a range, for the lesson-first 강습조회 screen.
  findLessonBoard(token, params = {}) {
    return request(`/api/admin/lessons${buildQuery(params)}`, { token });
  },
  findEventLessons(token, eventId) {
    return request(`/api/admin/events/${eventId}/lessons`, { token });
  },
  createLesson(token, eventId, payload) {
    return request(`/api/admin/events/${eventId}/lessons`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateLesson(token, lessonId, payload) {
    return request(`/api/admin/lessons/${lessonId}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deleteLesson(token, lessonId) {
    return request(`/api/admin/lessons/${lessonId}`, {
      method: "DELETE",
      token,
    });
  },
  findLessonNotices(token, lessonId) {
    return request(`/api/admin/lessons/${lessonId}/notices`, { token });
  },
  createLessonNotice(token, lessonId, payload) {
    return request(`/api/admin/lessons/${lessonId}/notices`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateLessonNotice(token, lessonId, noticeId, payload) {
    return request(`/api/admin/lessons/${lessonId}/notices/${noticeId}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deleteLessonNotice(token, lessonId, noticeId) {
    return request(`/api/admin/lessons/${lessonId}/notices/${noticeId}`, {
      method: "DELETE",
      token,
    });
  },
  removeEventApplication(token, applicationId, payload = {}) {
    return request(`/api/admin/event-applications/${applicationId}/remove`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  findActiveTeachers(token) {
    return request("/api/admin/teachers/active", { token });
  },
  findMessageTemplates(token) {
    return request("/api/admin/message-templates", { token });
  },
  findMessageTemplate(token, templateId) {
    return request(`/api/admin/message-templates/${templateId}`, { token });
  },
  createMessageTemplate(token, payload) {
    return request("/api/admin/message-templates", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateMessageTemplate(token, templateId, payload) {
    return request(`/api/admin/message-templates/${templateId}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },
  deleteMessageTemplate(token, templateId) {
    return request(`/api/admin/message-templates/${templateId}`, {
      method: "DELETE",
      token,
    });
  },
  renderMessageTemplate(token, templateId, payload) {
    return request(`/api/admin/message-templates/${templateId}/render`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  findMemberMessageThreads(token) {
    return request("/api/admin/message-threads", { token });
  },
  findMemberMessageUnreadCount(token) {
    return request("/api/admin/message-threads/unread-count", { token });
  },
  findMemberMessageThread(token, threadId) {
    return request(`/api/admin/message-threads/${threadId}`, { token });
  },
  createMemberMessageReply(token, threadId, payload) {
    return request(`/api/admin/message-threads/${threadId}/messages`, {
      method: "POST",
      token,
      body: payload,
    });
  },
  sendMemberMessages(token, payload) {
    return request("/api/admin/member-messages/send", {
      method: "POST",
      token,
      body: payload,
    });
  },
  findCorkboards(token, params = {}) {
    return request(`/api/admin/agora/corkboards${buildQuery(params)}`, { token });
  },
  findCorkboardPeriods(token) {
    return request("/api/admin/agora/corkboard-periods", { token });
  },
  findCurrentCorkboardPeriod(token) {
    return request("/api/admin/agora/corkboard-periods/current", { token });
  },
  createCorkboardPeriod(token, payload) {
    return request("/api/admin/agora/corkboard-periods", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateCorkboardPeriod(token, periodKey, payload) {
    return request(`/api/admin/agora/corkboard-periods/${periodKey}`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  archiveCorkboardPeriod(token, periodKey) {
    return request(`/api/admin/agora/corkboard-periods/${periodKey}/archive`, {
      method: "PATCH",
      token,
    });
  },
  createOfficialCorkboardNote(token, payload) {
    return request("/api/admin/agora/corkboard-notes", {
      method: "POST",
      token,
      body: payload,
    });
  },
  updateCorkboardNoteHidden(token, noteId, payload) {
    return request(`/api/admin/agora/corkboard-notes/${noteId}/hidden`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  updateCorkboardNotePosition(token, noteId, payload) {
    return request(`/api/admin/agora/corkboard-notes/${noteId}/position`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  updateCorkboardNoteContent(token, noteId, payload) {
    return request(`/api/admin/agora/corkboard-notes/${noteId}/content`, {
      method: "PATCH",
      token,
      body: payload,
    });
  },
  findTeacherDashboard(token) {
    return request("/api/teacher/dashboard", { token });
  },
  findTeacherLessons(token, params) {
    return request(`/api/teacher/dashboard/my-lessons${buildQuery(params)}`, { token });
  },
};
