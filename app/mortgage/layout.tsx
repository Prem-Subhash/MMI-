import { Metadata } from 'next'
import MortgageClientLayout from './MortgageClientLayout'
import './mortgage-dates.css'

export const metadata: Metadata = {
  title: 'Moonstar Mortgage CRM',
}

export default function MortgageLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <MortgageClientLayout>{children}</MortgageClientLayout>
}
