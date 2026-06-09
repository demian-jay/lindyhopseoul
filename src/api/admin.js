const DEFAULT_API_BASE_URL = "http://localhost:8080";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");

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
};
