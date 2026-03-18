'use client'

import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useState } from 'react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    // Always show success to avoid revealing whether the email exists
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
        <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg shadow p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Check your email</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            If an account exists for <strong>{email}</strong>, we&apos;ve sent a password reset link.
          </p>
          <Link href="/login" className="text-blue-600 hover:underline text-sm mt-4 inline-block">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-8">Reset your password</h1>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send reset link'}
          </button>

          <p className="text-sm text-center text-gray-500">
            <Link href="/login" className="text-blue-600 hover:underline">
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
