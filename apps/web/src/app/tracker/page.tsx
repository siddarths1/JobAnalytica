'use client';

import { useState, useEffect } from 'react';
import { getApplications, updateApplicationStatus, exportApplicationsCsv } from '@/lib/api-client';
import { ApplicationDto, ApplicationStatus } from '@jobanalytica/shared-types';
import { Kanbo as Kanban, Download, Calendar, DollarSign, Building2, MapPin, ExternalLink, Plus } from 'lucide-react';

const COLUMNS: { status: ApplicationStatus; label: string; color: string }[] = [
  { status: ApplicationStatus.SAVED, label: 'Saved', color: 'border-slate-700 bg-slate-900/40 text-slate-400' },
  { status: ApplicationStatus.APPLIED, label: 'Applied', color: 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400' },
  { status: ApplicationStatus.ASSESSMENT, label: 'Assessment', color: 'border-amber-500/30 bg-amber-500/5 text-amber-400' },
  { status: ApplicationStatus.INTERVIEW, label: 'Interview', color: 'border-cyan-500/30 bg-cyan-500/5 text-cyan-400' },
  { status: ApplicationStatus.OFFER, label: 'Offer Received', color: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400' },
];

export default function TrackerPage() {
  const [applications, setApplications] = useState<ApplicationDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    try {
      const data = await getApplications();
      setApplications(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleStatusChange = async (appId: string, newStatus: ApplicationStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      await loadApplications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Application Kanban Tracker</h1>
          <p className="text-sm text-slate-400 mt-1">
            Track your application lifecycle from saved opportunities to interview loops and job offers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={exportApplicationsCsv()}
            download="jobanalytica_applications.csv"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-semibold transition-all active:scale-95"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export CSV Audit Stream
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colApps = applications.filter((a) => a.status === col.status);
          return (
            <div key={col.status} className="flex flex-col min-w-[260px] rounded-2xl bg-slate-900/40 border border-slate-800/80 p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.color.split(' ')[1]}`} />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">{col.label}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-xs font-bold">
                  {colApps.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all space-y-3 shadow-lg shadow-black/40 group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                          {app.jobTitle}
                        </h4>
                        {app.applyUrl && (
                          <a
                            href={app.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 hover:text-slate-300 p-1"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-medium text-slate-300">{app.company}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{app.location}</span>
                    </div>

                    {app.resumeLabel && (
                      <div className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded w-fit">
                        Matched: {app.resumeLabel}
                      </div>
                    )}

                    {app.salaryOffered && (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>₹{(app.salaryOffered / 100000).toFixed(1)} LPA</span>
                      </div>
                    )}

                    {app.interviewDate && (
                      <div className="flex items-center gap-1 text-xs text-cyan-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(app.interviewDate).toLocaleDateString()}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        className="w-full text-xs font-medium bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
                      >
                        {COLUMNS.map((c) => (
                          <option key={c.status} value={c.status}>
                            Move to: {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div className="py-8 text-center border border-dashed border-slate-800/60 rounded-xl">
                    <p className="text-xs text-slate-600">No applications</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
