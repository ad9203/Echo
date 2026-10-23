const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Retrieve cached auth token for resilient cross-origin authentication
  let token = null;
  try {
    token = localStorage.getItem("echo_auth_token");
  } catch (e) {
    // LocalStorage unavailable in certain iframe sandboxes
  }

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers || {}),
    },
    credentials: "include", // Include HTTP-only cookie
  };

  // If body is FormData (e.g. for audio upload), delete Content-Type to let browser set boundary
  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      try {
        localStorage.removeItem("echo_auth_token");
      } catch (e) {}
    }
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const api = {
  // Auth
  register: (userData) => request("/auth/register", { method: "POST", body: JSON.stringify(userData) }),
  verifyOtp: (payload) => request("/auth/verify-otp", { method: "POST", body: JSON.stringify(payload) }),
  resendOtp: (email) => request("/auth/resend-otp", { method: "POST", body: JSON.stringify({ email }) }),
  login: (credentials) => request("/auth/login", { method: "POST", body: JSON.stringify(credentials) }),
  demoLogin: () => request("/auth/demo", { method: "POST" }),
  logout: () => request("/auth/logout", { method: "POST" }),
  getMe: () => request("/auth/me", { method: "GET" }),

  // Notes CRUD & Filtering
  getNotes: ({ status = "active", category = "All", search = "", favorite = false } = {}) => {
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (category && category !== "All") params.append("category", category);
    if (search) params.append("search", search);
    if (favorite) params.append("favorite", "true");

    return request(`/notes?${params.toString()}`);
  },

  getNoteById: (id) => request(`/notes/${id}`),

  createNote: (noteData) =>
    request("/notes", {
      method: "POST",
      body: JSON.stringify(noteData),
    }),

  updateNote: (id, noteData) =>
    request(`/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(noteData),
    }),

  // Note Lifecycle & Toggles
  togglePin: (id) => request(`/notes/${id}/pin`, { method: "PATCH" }),
  toggleFavorite: (id) => request(`/notes/${id}/favorite`, { method: "PATCH" }),
  toggleArchive: (id) => request(`/notes/${id}/archive`, { method: "PATCH" }),
  moveToTrash: (id) => request(`/notes/${id}/trash`, { method: "PATCH" }),
  restoreNote: (id) => request(`/notes/${id}/restore`, { method: "PATCH" }),
  permanentlyDeleteNote: (id) => request(`/notes/${id}`, { method: "DELETE" }),
  emptyTrash: () => request("/notes/trash/empty", { method: "DELETE" }),

  // AI Voice Dictation
  dictateAudio: (audioBlob, optionalText = "") => {
    const formData = new FormData();
    if (audioBlob) {
      formData.append("audio", audioBlob, "dictation.webm");
    }
    if (optionalText) {
      formData.append("rawText", optionalText);
    }
    return request("/notes/dictate", {
      method: "POST",
      body: formData,
    });
  },
};
