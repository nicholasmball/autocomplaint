'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Profile {
  full_name: string
  address_line_1: string
  address_line_2: string
  city: string
  county: string
  postcode: string
}

const emptyProfile: Profile = {
  full_name: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  county: '',
  postcode: '',
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteText, setDeleteText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('full_name, address_line_1, address_line_2, city, county, postcode')
        .eq('id', user.id)
        .single()

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          address_line_1: data.address_line_1 || '',
          address_line_2: data.address_line_2 || '',
          city: data.city || '',
          county: data.county || '',
          postcode: data.postcode || '',
        })
      }
      setLoading(false)
    }

    loadProfile()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id)

    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Profile saved' })
    }
    setSaving(false)
  }

  async function handleDeleteAccount() {
    if (deleteText !== 'DELETE') return
    setDeleting(true)

    const response = await fetch('/api/account', { method: 'DELETE' })

    if (response.ok) {
      await supabase.auth.signOut()
      router.push('/')
      router.refresh()
    } else {
      setMessage({ type: 'error', text: 'Failed to delete account. Please try again.' })
      setDeleting(false)
    }
  }

  function updateField(field: keyof Profile, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Profile</h1>

      {message && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-4">Personal Details</h2>
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium mb-1">Full name</label>
            <input
              id="full_name"
              type="text"
              value={profile.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
            />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4">Address</h2>
          <div className="space-y-3">
            <div>
              <label htmlFor="address_line_1" className="block text-sm font-medium mb-1">Address line 1</label>
              <input
                id="address_line_1"
                type="text"
                value={profile.address_line_1}
                onChange={(e) => updateField('address_line_1', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div>
              <label htmlFor="address_line_2" className="block text-sm font-medium mb-1">Address line 2</label>
              <input
                id="address_line_2"
                type="text"
                value={profile.address_line_2}
                onChange={(e) => updateField('address_line_2', e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="city" className="block text-sm font-medium mb-1">City</label>
                <input
                  id="city"
                  type="text"
                  value={profile.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <label htmlFor="county" className="block text-sm font-medium mb-1">County</label>
                <input
                  id="county"
                  type="text"
                  value={profile.county}
                  onChange={(e) => updateField('county', e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
            </div>
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium mb-1">Postcode</label>
              <input
                id="postcode"
                type="text"
                value={profile.postcode}
                onChange={(e) => updateField('postcode', e.target.value)}
                className="w-full max-w-[200px] border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save profile'}
        </button>
      </form>

      <div className="mt-8 bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-red-200 dark:border-red-900">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Danger zone</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700"
          >
            Delete account
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-medium">Type DELETE to confirm:</p>
            <input
              type="text"
              value={deleteText}
              onChange={(e) => setDeleteText(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteText !== 'DELETE' || deleting}
                className="bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Confirm delete'}
              </button>
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }}
                className="border rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
