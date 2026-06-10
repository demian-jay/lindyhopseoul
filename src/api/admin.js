const DEFAULT_API_BASE_URL = "http://localhost:8080";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

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
    throw new Error(error?.message || `API request failed with status ${response.status}.`);
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
  findTeacherDashboard(token) {
    return request("/api/teacher/dashboard", { token });
  },
  findTeacherLessons(token, params) {
    return request(`/api/teacher/dashboard/my-lessons${buildQuery(params)}`, { token });
  },
};
