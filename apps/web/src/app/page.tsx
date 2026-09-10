import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-6">
        <span>⚡ Next-Gen ATS Intelligence</span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl">
        Stop chasing stale recruiter reposts. Apply <span className="text-blue-600">directly to official ATS portals</span>.
      </h1>

      <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl">
        Aggregating verified Greenhouse, Lever, and Ashby postings in real-time. Match with multiple resumes and extract jobs directly from screenshots.
      </p>

      <div className="mt-10 flex flex-wrap gap-4 justify-center">
        <Link
          href="/register"
          className="rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-all"
        >
          Get Started Free
        </Link>
        <Link
          href="/dashboard"
          className="rounded-xl bg-white dark:bg-slate-900 px-6 py-3.5 text-base font-semibold text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
        >
          Explore Live Feed
        </Link>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl w-full">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg mb-4">
            🏢
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Direct ATS Integration</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Real-time synchronization with Greenhouse, Lever, and Ashby careers boards. Zero middlemen.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">
            📸
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Visual Screenshot OCR</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Take a screenshot of any job post anywhere. We extract text and automatically resolve the direct career portal.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-4">
            🎯
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Resume Match</h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Store specialized resumes for frontend, backend, or fullstack. Match scores auto-adapt per resume.
          </p>
        </div>
      </div>
    </div>
  );
}
