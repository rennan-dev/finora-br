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
  if(!force && cachedPaymentMethods) return cachedPaymentMethods;

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
  if(options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if(token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if(response.status === 401) {
    clearSession();
  }

  let bodyText = "";
  try {
    bodyText = await response.text();
  }catch (e) {
    console.warn("Não foi possível ler o corpo da resposta.", e);
  }

  let payload = {};
  try {
    payload = JSON.parse(bodyText);
  }catch (e) { }

  if(!response.ok) {
    let errorMessage = "Não foi possível concluir a solicitação.";
    
    if(payload) {
      if(payload.errors && typeof payload.errors === 'object') {
        const errorsList = Object.values(payload.errors).flat();
        if(errorsList.length > 0) {
          errorMessage = errorsList[0];
        }
      }else if(payload.message) {
        errorMessage = payload.message;
      }
    }
    
    const customError = new Error(errorMessage);
    customError.response = { data: payload };
    throw customError;
  }

  return payload;
}
