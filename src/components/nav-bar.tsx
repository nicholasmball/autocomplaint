'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function NavBar({ userEmail }: { userEmail: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = userEmail
    .split('@')[0]
    .split(/[._-]/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || '')
    .join('')

  return (
    <nav className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <span className="font-serif text-xl text-slate-900 dark:text-white">AutoComplaint</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/dashboard" className="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white bg-slate-900/5 dark:bg-white/10 rounded-lg transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/complaints" className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-lg transition-colors">
              Complaints
            </Link>
            <Link href="/dashboard/admin/recipients" className="px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-lg transition-colors">
              Recipients
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/new-complaint"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-slate-950 text-sm font-medium rounded-lg hover:bg-amber-400 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Complaint
            </Link>

            {/* Avatar / Profile */}
            <Link
              href="/profile"
              className="w-9 h-9 bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-sm font-medium rounded-full flex items-center justify-center hover:bg-slate-700 dark:hover:bg-amber-400 transition-colors"
              title={userEmail}
            >
              {initials || 'U'}
            </Link>

            {/* Sign out (desktop) */}
            <button
              onClick={handleSignOut}
              className="hidden md:block text-sm text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Sign out
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 px-4 py-3 space-y-1">
          <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white bg-slate-900/5 dark:bg-white/10 rounded-lg" onClick={() => setMobileOpen(false)}>
            Dashboard
          </Link>
          <Link href="/dashboard/complaints" className="block px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileOpen(false)}>
            Complaints
          </Link>
          <Link href="/dashboard/admin/recipients" className="block px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileOpen(false)}>
            Recipients
          </Link>
          <Link href="/dashboard/new-complaint" className="block px-4 py-2.5 text-sm font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg" onClick={() => setMobileOpen(false)}>
            + New Complaint
          </Link>
          <Link href="/profile" className="block px-4 py-2.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-900/5 dark:hover:bg-white/10 rounded-lg" onClick={() => setMobileOpen(false)}>
            Profile
          </Link>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-900 mt-2">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
