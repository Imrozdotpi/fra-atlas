// fra-atlas/frontend/src/lib/auth.js
export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fra_token");
}

export function setToken(token) {
  if (typeof window !== "undefined") localStorage.setItem("fra_token", token);
}

export function removeToken() {
  if (typeof window !== "undefined") localStorage.removeItem("fra_token");
}
