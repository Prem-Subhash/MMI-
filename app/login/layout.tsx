import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Innovative Insurance CRM',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
