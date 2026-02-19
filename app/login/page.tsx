'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { Eye, EyeOff } from 'lucide-react'
import Footer from '@/components/layout/Footer'

/* ================= CAPTCHA GENERATOR ================= */
const generateCaptcha = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [captcha, setCaptcha] = useState('')
  const [captchaInput, setCaptchaInput] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  /* 🔄 Generate captcha on page load */
  useEffect(() => {
    setCaptcha(generateCaptcha())
  }, [])

  const handleLogin = async () => {
    setError('')

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    if (captchaInput.trim().toUpperCase() !== captcha) {
      setError('Invalid captcha')
      setCaptcha(generateCaptcha()) // regenerate
      setCaptchaInput('')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      setCaptcha(generateCaptcha())
      setCaptchaInput('')
      return
    }

    router.push('/dashboard')
  }

  return (
    <div style={styles.wrapper}>
      {/* BACKGROUND IMAGE */}
      <Image
        src="/login/bg.png"
        alt="Background"
        fill
        priority
        quality={100}
        style={{ objectFit: 'cover', objectPosition: 'center 25%', zIndex: -1 }}
      />

      {/* LOGIN CARD */}
      <div style={styles.card}>
        <h2 style={styles.title}>Login</h2>

        <div style={styles.field}>
          <label>User ID</label>
          <input
            type="email"
            placeholder="Enter User ID"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.field}>
          <label>Password</label>
          <div style={styles.passwordWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* CAPTCHA */}
        <div style={styles.captchaRow}>
          <div
            style={styles.captchaBox}
            onCopy={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
            onMouseDown={e => e.preventDefault()}
          >
            {captcha}
          </div>

          <input
            placeholder="Enter Captcha"
            value={captchaInput}
            onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={styles.button}
          disabled={loading}
          onClick={handleLogin}
        >
          {loading ? 'Logging in...' : 'Submit'}
        </button>

        <p style={styles.forgot}>Forgot Password?</p>
      </div>

      <Footer />
    </div>
  )
}

/* ================= STYLES ================= */

const styles: any = {
  wrapper: {
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Inter, sans-serif',
  },

  card: {
    width: '420px',
    background: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(31,38,135,0.37)',
    border: '1px solid rgba(255,255,255,0.18)',
    zIndex: 1,
    margin: 'auto', // Centers the card
  },

  title: {
    textAlign: 'center',
    marginBottom: '30px',
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
  },

  field: { marginBottom: '18px' },

  passwordWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },

  captchaRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '15px',
  },

  captchaBox: {
    minWidth: '120px',
    height: '44px',
    background: 'rgba(255,255,255,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    letterSpacing: '4px',
    borderRadius: '6px',
    userSelect: 'none',
    pointerEvents: 'none',
  },

  button: {
    width: '100%',
    height: '46px',
    marginTop: '15px',
    background: '#e50914',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },

  error: {
    color: '#d32f2f',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '10px',
  },

  forgot: {
    marginTop: '18px',
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
}

/* GLOBAL INPUT STYLES */
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.innerHTML = `
    input {
      width: 100%;
      height: 44px;
      padding: 0 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 14px;
    }
    label {
      display: block;
      margin-bottom: 6px;
      font-size: 14px;
      font-weight: 500;
    }
    input::-ms-reveal,
    input::-ms-clear {
      display: none;
    }
  `
  document.head.appendChild(style)
}
