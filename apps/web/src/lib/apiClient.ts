// src/lib/apiClient.ts
"use client";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export async function fetchApi(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem("accessToken") : null;
  
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Unauthorized: Token might be expired or invalid.
    if (typeof window !== 'undefined' && !endpoint.includes('auth/login')) {
      localStorage.removeItem("accessToken");
      window.location.href = "/auth/login";
    }
  }

  // Allow returning raw response if we need it (e.g. for empty bodies)
  if (!response.ok) {
    let errorMsg = "API Error";
    try {
        const errorData = await response.json();
        errorMsg = errorData.message || errorData.error || errorMsg;
    } catch(e) {}
    throw new Error(errorMsg);
  }

  // Handle 204 No Content
  if (response.status === 204) {
      return null;
  }

  return response.json();
}
