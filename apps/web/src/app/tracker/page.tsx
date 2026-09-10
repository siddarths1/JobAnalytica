'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import {
  CheckCircle2,
  Download,
  Building,
  MapPin,
  ExternalLink,
  Trash2,
  Loader2,
  Calendar,
} from 'lucide-react';

const STATUS_COLUMNS = [
  { key: 'SAVED', label: 'Saved', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  { key: 'APPLIED', label: 'Applied', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  { key: 'ASSESSMENT', label: 'Assessment', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  { key: 'INTERVIEW', label: 'Interview', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  { key: 'OFFER', label: 'Offer', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
];

export default function TrackerPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchApplications();
    }
  }, [user, authLoading, router]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.request<any[]>('/applications');
      setApplications(data || []);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: string) => {
    try {
      await ApiClient.request(`/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (appId: string) => {
    try {
      await ApiClient.request(`/applications/${appId}`, {
        method: 'DELETE',
      });
      await fetchApplications();
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const handleExportCsv = async () => {
    const token = localStorage.getItem('jobanalytica_token');
    const url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1') + '/exports/csv';

    const res = await fetch(url, {
      headers: { Authorization: 'Bearer ' + token },
    });
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'jobanalytica_applications.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Application Lifecycle Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your pipeline from Saved to Interview and Offer with automatic history auditing.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition shadow-sm"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Export to CSV
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STATUS_COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.key);

          return (
            <div
              key={col.key}
              className="bg-slate-100/70 border border-slate-200 rounded-2xl p-4 flex flex-col min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${col.color}`}>
                  {col.label}
                </span>
                <span className="text-xs font-semibold text-slate-500">{colApps.length}</span>
              </div>

              <div className="space-y-3 flex-1">
                {colApps.map((app) => (\r\n                  <div
                    key={app.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow transition space-y-3"
                  >
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {app.job.title}
                      </h4>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-slate-400" />
                        {app.job.company}
                      </p>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {app.job.location}
                      </span>
                      {app.appliedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Status Mover */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {STATUS_COLUMNS.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-1">
                        <a
                          href={app.job.primaryApplyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-indigo-600 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => handleDelete(app.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
