'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import { ApplicationStatus } from '@jobanalytica/shared-types';

interface Application {
  id: string;
  status: ApplicationStatus;
  notes?: string;
  appliedAt?: string;
  updatedAt: string;
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    primaryApplyUrl: string;
  };
}

const COLUMNS: { label: string; status: ApplicationStatus }[] = [
  { label: 'Saved', status: ApplicationStatus.SAVED },
  { label: 'Applied', status: ApplicationStatus.APPLIED },
  { label: 'Interviewing', status: ApplicationStatus.INTERVIEWING },
  { label: 'Offer Received', status: ApplicationStatus.OFFER },
  { label: 'Rejected', status: ApplicationStatus.REJECTED },
];

export default function TrackerPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const data = await ApiClient.request<Application[]>('/applications');
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await ApiClient.request(`/applications/${appId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      await fetchApplications();
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCsv = () => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'}/exports/csv`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Application Kanban Tracker
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Monitor and advance your job applications across every stage of your pipeline.
          </p>
        </div>
        <button
          onClick={downloadCsv}
          className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          📥 Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 min-h-[500px]"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {col.label}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-400">
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-3">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm space-y-2"
                  >
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {app.job.title}
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                      {app.job.company} • {app.job.location}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="text-[11px] font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 focus:outline-none"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      <a
                        href={app.job.primaryApplyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold text-blue-600 hover:underline"
                      >
                        Portal ↗
                      </a>
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
