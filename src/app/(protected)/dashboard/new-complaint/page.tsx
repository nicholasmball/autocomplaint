import { createClient } from '@/lib/supabase/server'
import { ComplaintWizard } from '@/components/complaint-wizard/complaint-wizard'

export default async function NewComplaintPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let userName = ''
  let userAddress = ''

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, address_line_1, address_line_2, city, county, postcode')
      .eq('id', user.id)
      .single()

    if (profile) {
      userName = profile.full_name || ''
      const parts = [
        profile.address_line_1,
        profile.address_line_2,
        profile.city,
        profile.county,
        profile.postcode,
      ].filter(Boolean)
      userAddress = parts.join(', ')
    }
  }

  return <ComplaintWizard userName={userName} userAddress={userAddress} />
}
