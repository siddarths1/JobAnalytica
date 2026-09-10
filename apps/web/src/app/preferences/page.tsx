'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import { UserPreferenceDto, WorkMode } from '@jobanalytica/shared-types';
import {
  Sliders,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  MapPin,
  Briefcase,
  DollarSign,
  Mail,
  ShieldAlert,
  Plus,
  X,
} from 'lucide-react';

export default function PreferencesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [preferences, setPreferences] = useState<UserPreferenceDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (user) {
      fetchPreferences();
    }
  }, [user, authLoading, router]);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const data = await ApiClient.request<UserPreferenceDto>('/preferences');
      setPreferences(data);
    } catch (err: any) {
      console.error('Failed to fetch preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;
    setSaving(true);
    setMessage(null);

    try {
      const updated = await ApiClient.request<UserPreferenceDto>('/preferences', {
        method: 'PUT',
        body: JSON.stringify({
          targetRoles: preferences.targetRoles || [],
          locations: preferences.locations || [],
          workModes: preferences.workModes || [WorkMode.REMOTE],
          minSalary: preferences.minSalary ? Number(preferences.minSalary) : undefined,
          currency: preferences.currency || 'INR',
        }),
      });

      setPreferences(updated);
      setMessage({ type: 'success', text: 'Job preferences saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleWorkMode = (mode: WorkMode) => {
    if (!preferences) return;
    const exists = preferences.workModes.includes(mode);
    const updated = exists
      ? preferences.workModes.filter((m) => m !== mode)
      : [...preferences.workModes, mode];

    setPreferences({ ...preferences, workModes: updated.length > 0 ? updated : [WorkMode.REMOTE] });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Job Preferences & Targeting</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure locations, salary expectations, and filtering rules.
          </p>
        </div>
        {preferences && (
          <button
            onClick={handleSavePreferences}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        )}
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

      {preferences && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Work Mode & Locations</h2>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Work Mode Preference
              </label>
              <div className="flex gap-3">
                {[WorkMode.REMOTE, WorkMode.HYBRID, WorkMode.ONSITE].map((mode) => {
                  const isSelected = preferences.workModes.includes(mode);
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => toggleWorkMode(mode)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Target Cities / Locations
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {preferences.locations?.map((loc) => (
                  <span
                    key={loc}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-medium"
                  >
                    {loc}
                    <button
                      onClick={() =>
                        setPreferences({
                          ...preferences,
                          locations: preferences.locations.filter((l) => l !== loc),
                        })
                      }
                    >
                      <X className="w-3 h-3 hover:text-indigo-900" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="Add location (e.g. Remote, Bengaluru, Chennai)"
                  className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-lg text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newLocation.trim() && !preferences.locations.includes(newLocation.trim())) {
                      setPreferences({
                        ...preferences,
                        locations: [...preferences.locations, newLocation.trim()],
                      });
                      setNewLocation('');
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
