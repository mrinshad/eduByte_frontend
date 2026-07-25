function getApiUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  return apiUrl;
}

export async function apiFetch(
  endpoint: string,
  options?: RequestInit
) {
  const response = await fetch(`${getApiUrl()}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    let message = `API Error: ${response.status}`;

    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // response body wasn't JSON (e.g. HTML error page, empty body) — keep the generic message
    }

    throw new Error(message);
  }

  return response.json();
}