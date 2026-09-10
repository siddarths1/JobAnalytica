'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';

interface Source {
  id: string;
  code: string;
  name: string;
  isApi: boolean;
  isActive: boolean;
  createdAt: string;
}

interface SourceHealth {
  name: string;
  code: string;
  status: string;
  lastChecked: string;
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [health, setHealth] = useState<SourceHealth[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [srcs, hlth] = await Promise.all([
          ApiClient.request<Source[]>('/sources'),
          ApiClient.request<SourceHealth[]>('/sources/health'),
        ]);
        setSources(srcs);
        setHealth(hlth);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Active Job Sources & ATS Health
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Real-time connector status for Greenhouse, Lever, Ashby, and Adzuna adapters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {health.map((item) => (
          <div
            key={item.code}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
          >
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1">Code: {item.code}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Checked: {new Date(item.lastChecked).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  item.status === 'HEALTHY'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                ● {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
