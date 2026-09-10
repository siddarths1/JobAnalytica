import Link from 'next/link';
import { ArrowRight, Sparkles, Target, Zap, Shield, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-12">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold tracking-wide uppercase">
        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
        Production-Ready Multi-Resume Engine
      </div>

      <div className="space-y-4 max-w-3xl">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
          Precision Job Discovery for <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Multi-Role Engineers</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto">
          Upload role-specific resumes, discover verified tech opportunities across India's top tech hubs, and automatically track applications across company tiers.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25 active:scale-95"
        >
          Explore Job Feed
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/resume"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-medium text-sm transition-all active:scale-95"
        >
          Manage Multi-Resumes
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-4xl pt-8 text-left">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Multi-Role AI Matching</h3>
          <p className="text-sm text-slate-400">
            Evaluate every job posting against your separate Backend, AI/ML, and Full Stack resumes with custom fit scores.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Zap className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Regional Tech Hubs</h3>
          <p className="text-sm text-slate-400">
            Target India's Top 10 Tech Hubs (Bengaluru, Hyderabad, Pune, Delhi-NCR, Chennai) across 4 verified company tiers.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white">Liveness & Freshness</h3>
          <p className="text-sm text-slate-400">
            Zero stale postings. Live ATS health probes ensure every career link is verified active before you apply.
          </p>
        </div>
      </div>
    </div>
  );
}
