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
    apiError.code = error?.message || "";
    apiError.payload = error;
    throw apiError;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const corkboardApi = {
  findCurrent() {
    return request("/api/agora/corkboards/current");
  },
  findArchivePeriods() {
    return request("/api/agora/corkboards/archive");
  },
  findByPeriod(periodKey) {
    return request(`/api/agora/corkboards${buildQuery({ periodKey })}`);
  },
  createNote(payload) {
    return request("/api/agora/corkboard-notes", {
      method: "POST",
      body: payload,
    });
  },
  updateNotePosition(noteId, payload) {
    return request(`/api/agora/corkboard-notes/${noteId}/position`, {
      method: "PATCH",
      body: payload,
    });
  },
  updateNoteContent(noteId, payload) {
    return request(`/api/agora/corkboard-notes/${noteId}/content`, {
      method: "PATCH",
      body: payload,
    });
  },
  deleteNote(noteId) {
    return request(`/api/agora/corkboard-notes/${noteId}`, {
      method: "DELETE",
    });
  },
};
