import { Metadata } from 'next'
import DashboardClientLayout from './DashboardClientLayout'

export const metadata: Metadata = {
  title: 'Innovative Insurance CRM',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardClientLayout>{children}</DashboardClientLayout>
}
