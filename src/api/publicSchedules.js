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
  const { body, ...fetchOptions } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

  return response.json();
}

export const publicScheduleApi = {
  findOpenSchedules(params = {}) {
    return request(`/api/public/schedules${buildQuery(params)}`);
  },
  createApplication(payload) {
    return request("/api/public/applications", {
      method: "POST",
      body: payload,
    });
  },
};
