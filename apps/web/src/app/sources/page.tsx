'use client';

import { useState, useEffect } from 'react';
import { getSources, syncSource } from '@/lib/api-client';
import { SourceHealthDto, SourceHealthStatus } from '@jobanalytica/shared-types';
import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Globe } from 'lucide-react';

export default function SourcesPage() {
  const [sources, setSources] = useState<SourceHealthDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);

  const loadSources = async () => {
    try {
      const data = await getSources();
      setSources(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleSync = async (code: string) => {
    setSyncing(code);
    try {
      await syncSource(code);
      await loadSources();
    } catch (err) {
      console.error(err);
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Ingestion Sources & ATS Connectors</h1>
        <p className="text-sm text-slate-400 mt-1">
          Monitor the health status of active job board scrapers and ATS adapters (Greenhouse, Lever, Ashby, Adzuna).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sources.map((s) => (
          <div key={s.id} className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{s.name}</h3>
                  <p className="text-xs text-slate-400 font-mono uppercase">{s.code}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                s.healthStatus === SourceHealthStatus.HEALTHY ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                s.healthStatus === SourceHealthStatus.DEGRADED ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {s.healthStatus === SourceHealthStatus.HEALTHY && <CheckCircle2 className="w-3 h-3" />}
                {s.healthStatus === SourceHealthStatus.DEGRADED && <AlertTriangle className="w-3 h-3" />}
                {s.healthStatus === SourceHealthStatus.DOWN && <XCircle className="w-3 h-3" />}
                {s.healthStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/60 text-xs">
              <div>
                <span className="text-slate-400">Active Jobs:</span>
                <p className="font-semibold text-white mt-0.5">{s.activeJobsCount} requisitions</p>
              </div>
              <div>
                <span className="text-slate-400">Last Synced:</span>
                <p className="font-semibold text-white mt-0.5">
                  {s.lastPolledAt ? new Date(s.lastPolledAt).toLocaleTimeString() : 'Never'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleSync(s.code)}
              disabled={syncing === s.code}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing === s.code ? 'animate-spin' : ''}`} />
              {syncing === s.code ? 'Syncing ATS Feed...' : 'Trigger Immediate Sync'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
