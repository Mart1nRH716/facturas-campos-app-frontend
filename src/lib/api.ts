import { env } from "../config/env";

export type ApiError = Error & { status?: number; details?: unknown };

function errorMessage(detail: unknown, fallback: string) {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item
          ? String(item.msg)
          : "Revisa los datos",
      )
      .join(". ");
  }
  return fallback;
}

export function getStoredToken() {
  return sessionStorage.getItem("facturas_token");
}

export function setStoredToken(token: string) {
  sessionStorage.setItem("facturas_token", token);
}

export function clearStoredToken() {
  sessionStorage.removeItem("facturas_token");
}

export async function request<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers);
  const token = getStoredToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.body && !headers.has("Content-Type")) {
    if (options.body instanceof FormData) {
      // El navegador define multipart/form-data con su boundary.
    } else if (options.body instanceof URLSearchParams) {
      headers.set("Content-Type", "application/x-www-form-urlencoded");
    } else {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await fetch(`${env.apiUrl}${path}`, { ...options, headers });
  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("json")
    ? await response.json()
    : await response.blob();
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("auth-expired"));
    const error = new Error(
      errorMessage(payload?.detail, `Error ${response.status}`),
    ) as ApiError;
    error.status = response.status;
    error.details = payload;
    throw error;
  }
  return payload as T;
}

export type User = { id_usuario: number; username: string; is_active: boolean };
export type TokenResponse = { access_token: string; token_type: string };
export type CatalogItem = { id: number; nombre: string; codigo: string };
export type Entity = { id_entidad: number; nombre: string; codigo: string };
export type Provider = { id_proveedor: number; nombre: string; codigo: string };
export type BatchMetadata = {
  filename: string;
  xmls_encontrados: number;
  xmls_procesados: number;
  errores: number;
  lista_errores_xml: string[];
  content_type: string;
};
