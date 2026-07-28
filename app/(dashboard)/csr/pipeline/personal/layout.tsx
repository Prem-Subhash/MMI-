import { redirect } from 'next/navigation'
import { getCurrentUser, getUserProfile, canAccessInsuranceCategory } from '@/utils/auth'

export default async function PersonalPipelineLayout({ children }: { children: React.ReactNode }) {
    const user = await getCurrentUser()
    if (!user) redirect('/login')

    const profile = await getUserProfile(user.id)
    if (!canAccessInsuranceCategory(profile, 'personal')) {
        redirect('/unauthorized')
    }

    return <>{children}</>
}
