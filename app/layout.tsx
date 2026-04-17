import { ToastProvider } from '@/lib/ToastContext'
import './globals.css'

export const metadata = {
  title: 'Moonstar CRM',
  description: 'Insurance CSR Dashboard',
  icons: {
    icon: '/image.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
