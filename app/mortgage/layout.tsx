import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Moonstar Mortgage CRM',
}

export default function MortgageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
