'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export function NavBar({ userEmail }: { userEmail: string }) {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg">
          AutoComplaint
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/dashboard/admin/recipients" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            Recipients
          </Link>
          <Link href="/profile" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
            Profile
          </Link>
          <span className="text-gray-400 dark:text-gray-600">{userEmail}</span>
          <button
            onClick={handleSignOut}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
