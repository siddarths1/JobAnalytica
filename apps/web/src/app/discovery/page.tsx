'use client';

import { useState, useEffect, useRef } from 'react';
import { ApiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Upload,
  ExternalLink,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
  Check,
  Building2,
  MapPin,
  Briefcase,
  Layers
} from 'lucide-react';

interface DiscoveryItem {
  id: string;
  sourcePlatform: string;
  screenshotUrl?: string;
  extractedCompany: string;
  extractedRole?: string;
  extractedLocation?: string;
  extractedSkills: string[];
  extractedExperience?: string;
  rawOcrText?: string;
  careerPageUrl?: string;
  atsProvider?: string;
  status: 'ACTIVE' | 'APPLIED' | 'DONE' | 'DISMISSED';
  matchScore: number;
  matchedProfileLabel?: string;
  isSoftDeleted: boolean;
  createdAt: string;
}

export default function VisualDiscoveryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [entries, setEntries] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, activeTab]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.request<any>('/discovery/visual');
      setEntries(res.entries || []);
    } catch (err: any) {
      console.error('Failed to load visual discovery entries:', err);
    } finally {
      setLoading(false);
    }
  };

  const processImageFile = async (file: File) => {
    try {
      setUploading(true);
      setUploadProgress('Extracting company & job details via OCR Vision...');

      const formData = new FormData();
      formData.append('screenshot', file);

      const res = await ApiClient.request<any>('/discovery/visual/upload', {
        method: 'POST',
        body: formData,
      });

      if (res && res.entry) {
        showToast('Discovered ' + res.entry.extractedCompany + '! Career portal resolved.');
        setEntries(prev => [res.entry, ...prev]);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to process screenshot.');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 uppercase tracking-wider">
              Autonomous Vision Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Ctrl+V Paste Enabled
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
            Visual Screenshot Discovery
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Upload or paste screenshots from <span className="font-semibold">Naukri</span>, <span className="font-semibold">LinkedIn</span>, and job boards. We extract company details and resolve official career portals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow transition disabled:opacity-50"
          >
            <Camera className="w-4 h-4" />
            Upload Screenshot
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processImageFile(e.target.files[0]);
              }
            }}
          />
        </div>
      </div>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="border-2 border-dashed border-indigo-200 dark:border-slate-700 hover:border-indigo-400 bg-indigo-50/40 dark:bg-slate-900/40 rounded-2xl p-8 text-center transition cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mb-3">
            {uploading ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
            )}
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {uploading ? uploadProgress : 'Drop Naukri / LinkedIn Screenshot or press Ctrl+V anywhere'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Supports PNG, JPG, WebP. OCR Vision automatically identifies company name, role, skills, and direct career portals.
          </p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entries.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {item.sourcePlatform}
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  {item.matchScore}% Match
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {item.extractedCompany}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {item.extractedRole || 'Software Engineer'}
                </p>
              </div>

              {item.careerPageUrl && (
                <a
                  href={item.careerPageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center py-2 px-3 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-lg hover:underline"
                >
                  Explore Career Portal ↗
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
