
import { useAuth } from './use-auth';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export function useApi() {
  const { user } = useAuth();

  const apiRequest = async <T>(
    method: Method,
    endpoint: string,
    body?: any
  ): Promise<T> => {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  };

  return {
    get: <T>(endpoint: string) => apiRequest<T>('GET', endpoint),
    post: <T>(endpoint: string, data: any) => apiRequest<T>('POST', endpoint, data),
    put: <T>(endpoint: string, data: any) => apiRequest<T>('PUT', endpoint, data),
    del: <T>(endpoint: string) => apiRequest<T>('DELETE', endpoint),
  };
}
