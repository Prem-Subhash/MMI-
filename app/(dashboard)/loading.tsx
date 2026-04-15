import Loading from '@/components/ui/Loading'

export default function DashboardLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loading message="Preparing your workspace..." />
    </div>
  )
}
