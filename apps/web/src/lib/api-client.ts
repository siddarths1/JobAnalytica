import {
  AuthResponseDto,
  CandidateProfileDto,
  JobMatchDto,
  ApplicationDto,
  SourceHealthDto,
  UserPreferenceDto,
  UserDto,
} from '@jobanalytica/shared-types';

const API_BASE = '/api/v1';

function authHeader() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeader(),
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = 'An unexpected error occurred';
    try {
      const errorData = await res.json();
      errorMsg = errorData.message || errorMsg;
    } catch {}
    throw new Error(errorMsg);
  }

  return res.json();
}

// Auth
export const registerUser = (email: string, pass: string, fullName: string) =>
  request<AuthResponseDto>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass, fullName }),
  });

export const loginUser = (email: string, pass: string) =>
  request<AuthResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: pass }),
  });

export const getMe = () => request<UserDto>('/auth/me');

// Profiles / Resumes
export const getCandidateProfiles = () => request<CandidateProfileDto[]>('/resumes');

export const createCandidateProfile = (data: {
  label: string;
  totalExperience: number;
  headline?: string;
  summary?: string;
  targetRoles: string[];
  skills: string[];
  primaryLanguages?: string[];
  frameworks?: string[];
  domains?: string[];
  isPrimary?: boolean;
}) =>
  request<CandidateProfileDto>('/resumes/profile', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const deleteCandidateProfile = (id: string) =>
  request<{ success: boolean }>(`/resumes/${id}`, { method: 'DELETE' });

export const setPrimaryProfile = (id: string) =>
  request<CandidateProfileDto>(`/resumes/${id}/primary`, { method: 'PATCH' });

// Jobs & Matching Feed
export const getJobFeed = (params?: { tier?: string; hubId?: string }) => {
  const q = new URLSearchParams();
  if (params?.tier && params.tier !== 'ALL') q.set('tier', params.tier);
  if (params?.hubId && params.hubId !== 'ALL') q.set('hubId', params.hubId);
  return request<{ matches: JobMatchDto[]; total: number }>(`/jobs/feed?${q.toString()}`);
};

export const recalculateMatches = () => request<{ success: boolean; totalMatches: number }>('/jobs/match/recalculate', { method: 'POST' });

// Tech Hubs & Geo Discovery
export const getTechHubs = () => request<any[]>('/discovery/hubs');
export const crawlTechHubs = (body: { hubId?: string; tier?: string }) => request<any>('/discovery/crawl', { method: 'POST', body: JSON.stringify(body) });
export const validatePostings = () => request<any>('/discovery/validate', { method: 'POST' });

// Visual Screenshot Discovery
export const uploadVisualScreenshot = (file: File) => {
  const form = new FormData();
  form.append('screenshot', file);
  return fetch(`${API_BASE}/discovery/visual/upload`, {
    method: 'POST',
    headers: { ...authHeader() },
    body: form,
  }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.message || 'Failed to process screenshot');
    }
    return r.json();
  });
};

export const uploadVisualBase64 = (base64Image: string, mimeType = 'image/png') =>
  request<any>('/discovery/visual/upload', {
    method: 'POST',
    body: JSON.stringify({ base64Image, mimeType }),
  });

export const uploadVisualText = (rawText: string, platform?: string) =>
  request<any>('/discovery/visual/upload', {
    method: 'POST',
    body: JSON.stringify({ rawText, platform }),
  });

export const getVisualDiscoveries = (filter = 'ACTIVE') =>
  request<{ success: boolean; count: number; entries: any[] }>(`/discovery/visual?filter=${filter}`);

export const updateVisualDiscoveryStatus = (id: string, status: 'APPLIED' | 'DONE' | 'DISMISSED') =>
  request<any>(`/discovery/visual/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const restoreVisualDiscovery = (id: string) =>
  request<any>(`/discovery/visual/${id}/restore`, { method: 'POST' });

export const deleteVisualDiscovery = (id: string) =>
  request<any>(`/discovery/visual/${id}`, { method: 'DELETE' });

// Applications & Kanban Tracker
export const getApplications = () => request<ApplicationDto[]>('/applications');

export const trackApplication = (jobId: string, status = 'APPLIED', resumeLabel?: string) =>
  request<ApplicationDto>('/applications', {
    method: 'POST',
    body: JSON.stringify({ jobId, status, resumeLabel }),
  });

export const updateApplicationStatus = (id: string, status: string, notes?: string) =>
  request<ApplicationDto>(`/applications/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });

// Sources & Exporter
export const getSources = () => request<SourceHealthDto[]>('/sources');
export const syncSource = (code: string) => request<any>(`/sources/${code}/sync`, { method: 'POST' });
export const exportApplicationsCsv = () => `${API_BASE}/exports/csv`;
