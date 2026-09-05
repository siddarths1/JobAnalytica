'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Briefcase, User, LogOut, CheckCircle2, Sliders, Shield, Camera } from 'lucide-react';

export function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              J
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">
              Job<span className="text-indigo-600">Analytica</span>
            </span>
          </Link>

          {user && (
            <nav className="hidden md:flex items-center space-x-5 text-sm font-medium">
              <Link href="/dashboard" className="text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" />
                Feed
              </Link>
              <Link href="/discovery" className="text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5 font-semibold text-indigo-700 bg-indigo-50/70 px-2.5 py-1 rounded-md border border-indigo-100">
                <Camera className="w-4 h-4 text-indigo-600" />
                Visual Discovery
              </Link>
              <Link href="/tracker" className="text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Tracker
              </Link>
              <Link href="/resume" className="text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
                <User className="w-4 h-4" />
                Resumes
              </Link>
              <Link href="/preferences" className="text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
                <Sliders className="w-4 h-4" />
                Preferences
              </Link>
              <Link href="/sources" className="text-slate-600 hover:text-indigo-600 transition flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Sources
              </Link>
            </nav>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {user.fullName}
              </span>
              <button
                onClick={logout}
                className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-md shadow-sm transition"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
