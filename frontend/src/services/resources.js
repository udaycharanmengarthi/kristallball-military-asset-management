import api from "./api";

export const authApi = {
  login: (username, password) => api.post("/auth/login", { username, password }),
  me: () => api.get("/auth/me"),
};

export const baseApi = {
  list: () => api.get("/bases"),
  get: (id) => api.get(`/bases/${id}`),
  create: (data) => api.post("/bases", data),
};

export const equipmentApi = {
  list: () => api.get("/equipment-types"),
  create: (data) => api.post("/equipment-types", data),
};

export const assetApi = {
  list: (params) => api.get("/assets", { params }),
  metrics: (params) => api.get("/assets/metrics", { params }),
};

export const purchaseApi = {
  list: (params) => api.get("/purchases", { params }),
  create: (data) => api.post("/purchases", data),
};

export const transferApi = {
  list: (params) => api.get("/transfers", { params }),
  create: (data) => api.post("/transfers", data),
};

export const assignmentApi = {
  list: (params) => api.get("/assignments", { params }),
  create: (data) => api.post("/assignments", data),
};

export const expenditureApi = {
  list: (params) => api.get("/expenditures", { params }),
  create: (data) => api.post("/expenditures", data),
};

export const auditApi = {
  list: (params) => api.get("/audit-logs", { params }),
};
