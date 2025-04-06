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
  console.log(`Making ${method} request to ${url}`);
  if (data) {
    console.log('Request data:', data);
  }

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
    console.log(`Response status: ${res.status}`);
    console.log('Response headers:', Object.fromEntries(res.headers.entries()));
    
    await throwIfResNotOk(res);
    
    const contentType = res.headers.get('content-type');
    console.log('Content-Type:', contentType);
    
    const text = await res.text();
    console.log('Raw response:', text);
    
    try {
      const response = JSON.parse(text);
      console.log('Parsed response:', response);
      return response;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      console.error('Failed to parse:', text);
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Full API Request Error:", {
      url,
      method,
      status: res.status,
      statusText: res.statusText,
      error
    });
    throw error;
  }
}

export async function post(url: string, data: unknown): Promise<any> {
  return await apiRequest("POST", url, data);
}