import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000/api",
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("kb_token");

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    /*
     * Do not redirect when the login request itself
     * returns 401. Login.jsx needs to display the error.
     */
    const requestUrl =
      error.config?.url || "";

    const isLoginRequest =
      requestUrl.includes("/auth/login");

    if (
      error.response?.status === 401 &&
      !isLoginRequest
    ) {
      localStorage.removeItem(
        "kb_token"
      );

      localStorage.removeItem(
        "kb_user"
      );

      if (
        !window.location.pathname.startsWith(
          "/login"
        )
      ) {
        window.location.href =
          "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default api;