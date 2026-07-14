import { API_URL } from "@/config";

const TOKEN_KEY = "financas.auth_token";
const USER_KEY = "financas.user";
let cachedPaymentMethods = null;

export const getStoredUser = () => {
  const value = sessionStorage.getItem(USER_KEY);
  return value ? JSON.parse(value) : null;
};

export const isAuthenticated = () => Boolean(sessionStorage.getItem(TOKEN_KEY));

export const saveSession = ({ token, user }) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  cachedPaymentMethods = null;
};

export const getPaymentMethods = async ({ force = false } = {}) => {
  if (!force && cachedPaymentMethods) return cachedPaymentMethods;

  const response = await api("/payment-methods");
  cachedPaymentMethods = response.data;
  return cachedPaymentMethods;
};

export const setCachedPaymentMethods = (paymentMethods) => {
  cachedPaymentMethods = paymentMethods;
};

export async function api(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => ({}));

  if (response.status === 401) {
    clearSession();
  }

  if (!response.ok) {
    const firstError = Object.values(payload.errors || {}).flat()[0];
    throw new Error(firstError || payload.message || "Não foi possível concluir a solicitação.");
  }

  return payload;
}
