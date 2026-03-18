import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NavBar } from '@/components/nav-bar'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <NavBar userEmail={user.email!} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
