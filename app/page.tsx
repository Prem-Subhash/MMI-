'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import Footer from '@/components/layout/Footer'

export default function HomePage() {
  const router = useRouter()

  return (
    <main style={container}>
      {/* Background Image */}
      <Image
        src="/hero.jpg"
        alt="Mortgage Home"
        fill
        priority
        style={{ objectFit: 'cover', zIndex: -2 }}
      />

      {/* Overlay */}
      <div style={overlay} />

      {/* Content */}
      <section style={content}>
        <Image
          src="/logo.png"
          alt="Moonstar Mortgage"
          width={220}
          height={80}
        />

        <h1 style={heading}>
          Your Key to a Brighter <br /> Future
        </h1>

        <p style={subheading}>
          Trusted mortgage solutions built on transparency,
          speed, and reliability.
        </p>

        <button
          style={button}
          onClick={() => router.push('/login')}
        >
          Get Started
        </button>
      </section>

      <Footer />
    </main>
  )
}

/* Styles */
const container = {
  minHeight: '100vh',
  position: 'relative' as const,
  display: 'flex',
  flexDirection: 'column' as const,
  overflowX: 'hidden' as const,
}

const overlay = {
  position: 'absolute' as const,
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.45)',
  zIndex: -1,
}

const content = {
  flex: 1,
  paddingLeft: '80px',
  paddingTop: '100px',
  paddingBottom: '100px',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  color: '#fff',
  maxWidth: '700px',
}

const heading = {
  fontSize: '56px',
  fontWeight: 700,
  marginTop: '30px',
  lineHeight: '1.1',
}

const subheading = {
  fontSize: '18px',
  marginTop: '20px',
  maxWidth: '500px',
  opacity: 0.9,
}

const button = {
  marginTop: '30px',
  width: '160px',
  padding: '14px',
  fontSize: '16px',
  backgroundColor: '#e50914',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
}
