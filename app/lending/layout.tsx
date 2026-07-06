import { Metadata } from 'next'
import LendingClientLayout from './LendingClientLayout'

export const metadata: Metadata = {
  title: 'Accurate Lending CRM',
}

export default function LendingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LendingClientLayout>{children}</LendingClientLayout>
}
