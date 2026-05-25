const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(method, path, body = null) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw { status: res.status, message: err.detail || "Request failed" };
  }

  if (res.status === 204) return null;
  return res.json();
}


const auth = {
  async register(email, password, full_name = "") {
    return request("POST", "/auth/register", { email, password, full_name });
  },

  async login(email, password) {
    const data = await request("POST", "/auth/login", { email, password });
    localStorage.setItem("token", data.access_token);
    return data;
  },

  async me() {
    return request("GET", "/auth/me");
  },

  async updateMe(data) {
    return request("PUT", "/auth/me", data);
  },

  logout(redirectUrl = "/") {
    localStorage.removeItem("token");
    window.location.href = redirectUrl;
  },

  isAuthenticated() {
    return !!getToken();
  },
};


function makeEntity(path) {
  return {
    async list(sort = null) {
      const url = sort ? `/${path}?sort=${sort}` : `/${path}`;
      return request("GET", url);
    },

    async filter(params = {}) {
      const qs = new URLSearchParams(
        Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
      ).toString();
      return request("GET", `/${path}${qs ? "?" + qs : ""}`);
    },

    async get(id) {
      return request("GET", `/${path}/${id}`);
    },

    async create(data) {
      return request("POST", `/${path}`, data);
    },

    async update(id, data) {
      return request("PUT", `/${path}/${id}`, data);
    },

    async delete(id) {
      return request("DELETE", `/${path}/${id}`);
    },
  };
}


const entities = {
  Tournament: makeEntity("tournaments"),
  Player: makeEntity("players"),
  Match: makeEntity("matches"),
  Prediction: makeEntity("predictions"),
  User: makeEntity("users"),
};

export const api = { auth, entities };
