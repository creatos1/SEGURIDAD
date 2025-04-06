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
        throw new Error(`${res.status}: ${res.statusText} - ${text}`); 
      }
    } catch (e) {
      throw new Error(`${res.status}: ${res.statusText} - Error parsing response`); 
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> { 
  const res = await fetch(url, {
    method,
    headers: {
      ...(data ? { "Content-Type": "application/json" } : {}),
      "Accept": "application/json"
    },
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  try {
      await throwIfResNotOk(res);
      const response = await res.json();
      return response;
    } catch (error) {
      console.error("API Request Error:", error);
      throw new Error(error instanceof Error ? error.message : 'Error en la solicitud');
    }
}

export async function post(url: string, data: unknown): Promise<any> {
  return await apiRequest("POST", url, data);
}