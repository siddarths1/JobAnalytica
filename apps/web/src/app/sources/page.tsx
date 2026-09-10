'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { SourceHealthDto } from '@jobanalytica/shared-types';
import { ShieldCheck, AlertTriangle, XCircle, Clock, Database, Loader2 } from 'lucide-react';

export default function SourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [sources, setSources] = useState<SourceHealthDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchHealth();
    }
  }, [user, authLoading, router]);

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.request<SourceHealthDto[]>('/sources/health');
      setSources(data || []);
    } catch (err) {
      console.error('Failed to fetch source health:', err);
    } finally {
      setLoading(false);
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
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Universal Source Health & Observability</h1>
        <p className="text-sm text-slate-500 mt-1">
          Real-time status, synchronization timestamps, and active job volumes across all integrated adapters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sources.map((source) => {
          const isHealthy = source.healthStatus === 'HEALTHY';
          const isDegraded = source.healthStatus === 'DEGRADED';

          return (
            <div
              key={source.id || source.code}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">{source.name}</h3>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isHealthy
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDegraded
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {isHealthy ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : isDegraded ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  {source.healthStatus}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    Active Jobs Ingested
                  </div>
                  <div className="text-lg font-bold text-slate-900">{source.activeJobsCount}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                  <div className="text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Last Polled
                  </div>
                  <div className="text-xs font-semibold text-slate-800 truncate">
                    {source.lastPolledAt ? new Date(source.lastPolledAt).toLocaleTimeString() : 'Just now'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
