
export const API_BASE_URL = '/api';

export async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    try {
      if (contentType && contentType.includes("application/json")) {
        const error = await res.json();
        throw new Error(error.message || `${res.status}: ${res.statusText}`);
      } else {
        const text = await res.text();
        throw new Error(`${res.status}: ${res.statusText}`);
      }
    } catch (e) {
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Accept": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}
