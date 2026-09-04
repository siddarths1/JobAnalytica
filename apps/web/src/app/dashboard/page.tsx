'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ApiClient } from '@/lib/api-client';
import {
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Bookmark,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Flame,
  Loader2,
  Building,
  UploadCloud,
  Search,
  Filter,
  PlusCircle,
  X,
  FileText,
  UserCheck,
  Rocket,
  Globe2,
  Briefcase,
  Compass,
  ShieldCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [selectedProfileFilter, setSelectedProfileFilter] = useState<string>('ALL');
  const [hasProfile, setHasProfile] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [validating, setValidating] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWorkMode, setSelectedWorkMode] = useState<string>('ALL');
  const [selectedTier, setSelectedTier] = useState<string>('ALL');
  const [selectedHub, setSelectedHub] = useState<string>('ALL');
  const [minPriority, setMinPriority] = useState<number>(0);

  // Modals state
  const [selectedJd, setSelectedJd] = useState<any | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState({
    title: '',
    company: '',
    location: 'Remote',
    workMode: 'REMOTE',
    description: '',
    applyUrl: '',
  });
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user) {
      fetchFeed(selectedProfileFilter);
    }
  }, [user, authLoading, router, selectedProfileFilter]);

  const fetchFeed = async (profId?: string) => {
    try {
      setLoading(true);
      const url = profId && profId !== 'ALL' ? '/jobs/feed?profileId=' + profId : '/jobs/feed';
      const res = await ApiClient.request<{ hasProfile: boolean; profiles: any[]; matches: any[] }>(url);
      setHasProfile(res.hasProfile);
      setProfiles(res.profiles || []);
      setMatches(res.matches || []);
    } catch (err: any) {
      console.error('Failed to fetch job feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncHubDiscovery = async () => {
    setSyncing(true);
    setActionSuccess(null);
    try {
      const res = await ApiClient.request<{ message: string }>('/discovery/crawl', {
        method: 'POST',
        body: JSON.stringify({ hubId: selectedHub, tier: selectedTier }),
      });
      await fetchFeed(selectedProfileFilter);
      setActionSuccess(res.message || 'Crawled tech hub companies and refreshed AI match scores!');
    } catch (err: any) {
      console.error('Hub crawl failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleValidateFreshness = async () => {
    setValidating(true);
    setActionSuccess(null);
    try {
      const res = await ApiClient.request<{ totalChecked: number; activeCount: number; deactivatedCount: number }>('/discovery/validate', {
        method: 'POST',
      });
      await fetchFeed(selectedProfileFilter);
      setActionSuccess('Freshness verified: ' + res.activeCount + ' live jobs active (' + res.deactivatedCount + ' expired pruned)');
    } catch (err: any) {
      console.error('Validation failed:', err);
    } finally {
      setValidating(false);
    }
  };

  const handleApply = async (jobId: string, applyUrl: string) => {
    if (applyUrl && applyUrl !== '#') {
      window.open(applyUrl, '_blank');
    }
    try {
      await ApiClient.request('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId, status: 'APPLIED' }),
      });
      setActionSuccess('Marked as Applied! Track it in your Application Tracker.');
    } catch (err) {
      console.error('Failed to mark applied:', err);
    }
  };

  const handleSave = async (jobId: string) => {
    try {
      await ApiClient.request('/applications', {
        method: 'POST',
        body: JSON.stringify({ jobId, status: 'SAVED' }),
      });
      setActionSuccess('Saved to Application Tracker!');
    } catch (err) {
      console.error('Failed to save:', err);
    }
  };

  const handleImportCustomJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importForm.title || !importForm.company || !importForm.description) return;

    setImporting(true);
    try {
      await ApiClient.request('/jobs/import-custom', {
        method: 'POST',
        body: JSON.stringify(importForm),
      });
      setShowImportModal(false);
      setImportForm({
        title: '',
        company: '',
        location: 'Remote',
        workMode: 'REMOTE',
        description: '',
        applyUrl: '',
      });
      await fetchFeed(selectedProfileFilter);
      setActionSuccess('Custom job imported, classified by tier, and matched across your resumes!');
    } catch (err: any) {
      console.error('Failed to import job:', err);
    } finally {
      setImporting(false);
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const job = m.job;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        job.title?.toLowerCase().includes(q) ||
        job.company?.toLowerCase().includes(q) ||
        (job.requiredSkills || []).some((s: string) => s.toLowerCase().includes(q));

      const matchesMode = selectedWorkMode === 'ALL' || job.workMode === selectedWorkMode;
      const matchesTier = selectedTier === 'ALL' || job.companyTier === selectedTier;
      
      const loc = (job.location || '').toLowerCase();
      const matchesHub =
        selectedHub === 'ALL' ||
        loc.includes(selectedHub.toLowerCase()) ||
        (selectedHub === 'bengaluru' && (loc.includes('bangalore') || loc.includes('bengaluru') || loc.includes('karnataka'))) ||
        (selectedHub === 'hyderabad' && (loc.includes('hyderabad') || loc.includes('telangana') || loc.includes('hitec'))) ||
        (selectedHub === 'pune' && (loc.includes('pune') || loc.includes('hinjawadi') || loc.includes('maharashtra'))) ||
        (selectedHub === 'ncr' && (loc.includes('delhi') || loc.includes('gurgaon') || loc.includes('gurugram') || loc.includes('noida'))) ||
        (selectedHub === 'chennai' && (loc.includes('chennai') || loc.includes('tamil nadu') || loc.includes('omr'))) ||
        (selectedHub === 'mumbai' && (loc.includes('mumbai') || loc.includes('navi mumbai') || loc.includes('thane'))) ||
        (selectedHub === 'ahmedabad' && (loc.includes('ahmedabad') || loc.includes('gift city') || loc.includes('gujarat'))) ||
        (selectedHub === 'kochi' && (loc.includes('kochi') || loc.includes('cochin') || loc.includes('kerala') || loc.includes('infopark'))) ||
        (selectedHub === 'kolkata' && (loc.includes('kolkata') || loc.includes('salt lake') || loc.includes('west bengal'))) ||
        (selectedHub === 'jaipur' && (loc.includes('jaipur') || loc.includes('indore') || loc.includes('rajasthan') || loc.includes('madhya pradesh')));

      const matchesPriority = m.applicationPriority >= minPriority;

      return matchesSearch && matchesMode && matchesTier && matchesHub && matchesPriority;
    });
  }, [matches, searchQuery, selectedWorkMode, selectedTier, selectedHub, minPriority]);

  const getTierBadge = (tier?: string) => {
    switch (tier) {
      case 'STARTUP_EARLY_STAGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Rocket className="w-3 h-3 text-purple-600" /> Early-Stage Startup
          </span>
        );
      case 'TIER_3_SERVICES':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            <Globe2 className="w-3 h-3 text-cyan-600" /> Tier 3 IT & Services
          </span>
        );
      case 'TIER_1_LARGE_CAP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Building className="w-3 h-3 text-amber-600" /> Tier 1 Enterprise / Unicorn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            <Briefcase className="w-3 h-3 text-blue-600" /> Tier 2 Mid-Cap
          </span>
        );
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Job Intelligence Feed</h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover opportunities across <strong>Startups, Mid-Caps, Tier-1 Unicorns, and Tier-3 Services</strong>.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            Paste Custom JD
          </button>
          <button
            onClick={handleValidateFreshness}
            disabled={validating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-sm font-medium hover:bg-emerald-100 transition disabled:opacity-50 shadow-sm"
            title="Verify ATS career page liveness and prune expired openings"
          >
            <ShieldCheck className={'w-4 h-4 text-emerald-600 ' + (validating ? 'animate-spin' : '')} />
            {validating ? 'Verifying...' : 'Verify Liveness'}
          </button>
          <button
            onClick={handleSyncHubDiscovery}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
          >
            <Compass className={'w-4 h-4 ' + (syncing ? 'animate-spin' : '')} />
            {syncing ? 'Crawling Hubs...' : 'Crawl Tech Hubs'}
          </button>
        </div>
      </div>

      {/* Resume Upload Reminder Banner if no profile */}
      {!hasProfile && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start gap-3">
            <UploadCloud className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">No Resumes Uploaded Yet</h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Upload your role-specific resumes in the <strong>Profile &amp; Resume</strong> hub to calculate tailored fit scores across all company tiers.
              </p>
            </div>
          </div>
          <Link
            href="/resume"
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow whitespace-nowrap text-center transition"
          >
            Upload Resume →
          </Link>
        </div>
      )}

      {hasProfile && (
        <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-900">
            <UserCheck className="w-4 h-4 text-indigo-600" />
            <span>Multi-Role Intelligence: <strong>{profiles.length} Resume Profile(s) Loaded</strong></span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">Filter by Resume:</span>
            <select
              value={selectedProfileFilter}
              onChange={(e) => setSelectedProfileFilter(e.target.value)}
              className="bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">🌟 Best Match (All Resumes)</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  📄 {p.label} {p.isPrimary ? '(Primary)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Multi-Tier Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, or skill across all tiers..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Indian Tech Hub Filter */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Hub:</span>
            <select
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="bg-indigo-50/60 border border-indigo-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-indigo-950 focus:outline-none"
            >
              <option value="ALL">All Hubs & Locations</option>
              <option value="bengaluru">📍 Bengaluru (Silicon Valley)</option>
              <option value="hyderabad">📍 Hyderabad (Cyberabad)</option>
              <option value="pune">📍 Pune (Hinjawadi / Magarpatta)</option>
              <option value="ncr">📍 Delhi NCR (Gurgaon / Noida)</option>
              <option value="chennai">📍 Chennai (OMR Corridor)</option>
              <option value="mumbai">📍 Mumbai (MMR / FinTech)</option>
              <option value="ahmedabad">📍 Ahmedabad / GIFT City</option>
              <option value="kochi">📍 Kochi (Infopark)</option>
              <option value="kolkata">📍 Kolkata (Salt Lake Sector V)</option>
              <option value="jaipur">📍 Jaipur / Indore Emerging</option>
            </select>
          </div>

          {/* Company Tier Selector */}
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Tier:</span>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Company Tiers</option>
              <option value="STARTUP_EARLY_STAGE">🚀 Early Startups (Seed / Series A)</option>
              <option value="TIER_2_MID_CAP">🏢 Mid-Cap / Growth Scaleups</option>
              <option value="TIER_3_SERVICES">🌐 Tier 3 IT & Services</option>
              <option value="TIER_1_LARGE_CAP">🏛️ Tier 1 Enterprise / Unicorns</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Mode:</span>
            <select
              value={selectedWorkMode}
              onChange={(e) => setSelectedWorkMode(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="REMOTE">Remote Only</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <span>Priority:</span>
            <select
              value={minPriority}
              onChange={(e) => setMinPriority(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value={0}>All Scores</option>
              <option value={80}>High Yield (80%+)</option>
              <option value={60}>Moderate (60%+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <Sparkles className="w-10 h-10 text-indigo-500 mx-auto" />
          <h3 className="text-lg font-semibold text-slate-800">No Matching Opportunities Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Try adjusting your tier or role filters, or click &quot;Sync Sources&quot; above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMatches.map((match) => {
            const job = match.job;
            const isHighPriority = match.applicationPriority >= 80;

            return (
              <div
                key={match.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition space-y-5"
              >
                {/* Header info */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">{job.title}</h2>
                      {isHighPriority && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                          <Flame className="w-3.5 h-3.5 text-rose-600" /> High Priority
                        </span>
                      )}
                      {getTierBadge(job.companyTier)}
                      {match.matchedProfileLabel && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          🎯 Best with: {match.matchedProfileLabel}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 pt-1">
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        {job.company}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {job.location} ({job.workMode})
                      </span>
                      {job.minSalary && (
                        <span className="text-emerald-700 font-semibold">
                          ₹{(job.minSalary / 100000).toFixed(1)}L - ₹{(job.maxSalary / 100000).toFixed(1)}L
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Priority Gauge */}
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Priority Index
                      </div>
                      <div className="text-2xl font-black text-indigo-600">
                        {match.applicationPriority}%
                      </div>
                    </div>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="text-xs text-slate-600">
                      <div>Skill Match: <span className="font-semibold text-slate-800">{match.skillScore}%</span></div>
                      <div>Exp Match: <span className="font-semibold text-slate-800">{match.experienceScore}%</span></div>
                    </div>
                  </div>
                </div>

                {/* Alternate Profiles match breakdown */}
                {match.alternateProfiles && match.alternateProfiles.length > 0 && (
                  <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3">
                    <span className="font-semibold text-slate-700">Other Resumes Fit:</span>
                    {match.alternateProfiles.map((alt: any, i: number) => (
                      <span key={i} className="text-slate-600">
                        {alt.profileLabel}: <strong className="text-indigo-700">{alt.priorityScore}%</strong> (Skill: {alt.skillScore}%)
                      </span>
                    ))}\n                  </div>
                )}

                {/* Why Apply vs Risks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Why You Should Apply
                    </div>
                    <ul className="text-xs text-emerald-950 space-y-1">
                      {match.whyApply?.map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-600 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                    <div className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Risks & Missing Gaps
                    </div>
                    <ul className="text-xs text-amber-950 space-y-1">
                      {match.risksAndGaps?.map((risk: string, i: number) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Actions & Source Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Source:</span>
                    {job.sourcePostings?.map((p: any) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 uppercase text-[10px]"
                      >
                        {p.source?.name || 'ATS'}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedJd(job)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> View JD
                    </button>
                    <button
                      onClick={() => handleSave(job.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center gap-1"
                    >
                      <Bookmark className="w-3.5 h-3.5" /> Save
                    </button>
                    <button
                      onClick={() => handleApply(job.id, job.primaryApplyUrl)}
                      className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      Apply Externally
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full JD Modal */}
      {selectedJd && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedJd.title}</h3>
                <p className="text-xs text-slate-500">{selectedJd.company} • {selectedJd.location}</p>
              </div>
              <button
                onClick={() => setSelectedJd(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {selectedJd.description}
            </div>
            <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => setSelectedJd(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-white"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleApply(selectedJd.id, selectedJd.primaryApplyUrl);
                  setSelectedJd(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-sm"
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Custom JD Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">Evaluate Custom Job</h3>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleImportCustomJob} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Job Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={importForm.title}
                    onChange={(e) => setImportForm({ ...importForm, title: e.target.value })}
                    placeholder="Senior AI Engineer"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Company *
                  </label>
                  <input
                    type="text"
                    required
                    value={importForm.company}
                    onChange={(e) => setImportForm({ ...importForm, company: e.target.value })}
                    placeholder="Langflow / Cursor / Persistent"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={importForm.location}
                    onChange={(e) => setImportForm({ ...importForm, location: e.target.value })}
                    placeholder="Remote / Bengaluru / Pune"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Work Mode
                  </label>
                  <select
                    value={importForm.workMode}
                    onChange={(e) => setImportForm({ ...importForm, workMode: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Application Link (URL)
                </label>
                <input
                  type="url"
                  value={importForm.applyUrl}
                  onChange={(e) => setImportForm({ ...importForm, applyUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Job Description / Requirements *
                </label>
                <textarea
                  rows={4}
                  required
                  value={importForm.description}
                  onChange={(e) => setImportForm({ ...importForm, description: e.target.value })}
                  placeholder="Paste the full JD requirements here..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
                >
                  {importing ? 'Evaluating...' : 'Evaluate & Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
