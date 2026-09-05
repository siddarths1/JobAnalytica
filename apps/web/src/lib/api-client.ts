const API_URL = typeof window !== 'undefined'
  ? '/api/v1'
  : (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1');

export class ApiClient {
  private static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('jobanalytica_token');
  }

  static setToken(token: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobanalytica_token', token);
    }
  }

  static clearToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jobanalytica_token');
      localStorage.removeItem('jobanalytica_user');
    }
  }

  static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {};

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }

    const response = await fetch(API_URL + endpoint, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred while processing the request.');
    }

    return data as T;
  }

  // Visual Discovery API helpers
  static async uploadVisualScreenshot(formData: FormData) {
    return this.request<{ success: boolean; entry: any; match: any }>('/discovery/visual/upload', {
      method: 'POST',
      body: formData,
    });
  }

  static async uploadVisualBase64(base64Image: string, mimeType: string) {
    return this.request<{ success: boolean; entry: any; match: any }>('/discovery/visual/upload', {
      method: 'POST',
      body: JSON.stringify({ base64Image, mimeType }),
    });
  }

  static async uploadVisualText(rawText: string, platform: 'NAUKRI' | 'LINKEDIN' | 'OTHER' = 'NAUKRI') {
    return this.request<{ success: boolean; entry: any; match: any }>('/discovery/visual/upload', {
      method: 'POST',
      body: JSON.stringify({ rawText, platform }),
    });
  }

  static async getVisualDiscoveries(filter: 'ACTIVE' | 'ARCHIVED' | 'ALL' = 'ACTIVE') {
    return this.request<{ success: boolean; count: number; entries: any[] }>(`/discovery/visual?filter=${filter}`);
  }

  static async updateVisualDiscoveryStatus(id: string, status: 'APPLIED' | 'DONE' | 'DISMISSED' | 'ACTIVE') {
    return this.request<{ success: boolean; entry: any; message: string }>(`/discovery/visual/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  static async restoreVisualDiscovery(id: string) {
    return this.request<{ success: boolean; entry: any; message: string }>(`/discovery/visual/${id}/restore`, {
      method: 'POST',
    });
  }

  static async deleteVisualDiscovery(id: string) {
    return this.request<{ success: boolean; message: string }>(`/discovery/visual/${id}`, {
      method: 'DELETE',
    });
  }
}
