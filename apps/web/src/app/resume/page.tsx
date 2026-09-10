'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Trash2,
  Star,
  Save,
  Sparkles,
  Check,
} from 'lucide-react';

interface Resume {
  id: string;
  fileName: string;
  isPrimary: boolean;
  skills: string;
  experienceYears: number;
  summary: string;
  createdAt: string;
}

export default function ResumePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchResumes();
    }
  }, [user, authLoading, router]);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.request<Resume[]>('/resumes');
      setResumes(data || []);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setMessage({ type: 'error', text: 'Please upload a valid PDF resume.' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage(null);

    try {
      await ApiClient.request('/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      await fetchResumes();
      setMessage({ type: 'success', text: 'Resume uploaded and parsed successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to upload resume.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (resumeId: string) => {
    try {
      await ApiClient.request(`/resumes/${resumeId}/primary`, { method: 'PATCH' });
      await fetchResumes();
      setMessage({ type: 'success', text: 'Primary resume updated!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update primary resume.' });
    }
  };

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await ApiClient.request(`/resumes/${resumeId}`, { method: 'DELETE' });
      await fetchResumes();
      setMessage({ type: 'success', text: 'Resume deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to delete resume.' });
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Multi-Resume Manager</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload tailored resumes for specialized roles to optimize match scores.
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          {uploading ? 'Parsing...' : 'Upload PDF Resume'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {resumes.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <UploadCloud className="w-12 h-12 text-indigo-500 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Resumes Uploaded Yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Upload your PDF resume to auto-extract skills, calculate match grades, and get personalized job recommendations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resumes.map((resume) => {
            let parsedSkills: string[] = [];
            try {
              parsedSkills = JSON.parse(resume.skills || '[]');
            } catch {}

            return (
              <div
                key={resume.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                      {resume.fileName}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {resume.experienceYears} Years Exp • Uploaded {new Date(resume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {resume.isPrimary && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      PRIMARY
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                  {resume.summary}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {parsedSkills.slice(0, 6).map((skill, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {parsedSkills.length > 6 && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs">
                      +{parsedSkills.length - 6}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  {!resume.isPrimary ? (
                    <button
                      onClick={() => handleSetPrimary(resume.id)}
                      className="text-xs font-semibold text-indigo-600 hover:underline"
                    >
                      ★ Set as Primary
                    </button>
                  ) : <span className="text-xs text-slate-400">Default for matching</span>}

                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="text-xs font-semibold text-rose-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
