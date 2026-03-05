import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '../store'
import { setCredentials } from '../store/authSlice'
import './LoginPage.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (res.status === 401) {
        setError('Invalid email or password.')
        return
      }

      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        return
      }

      const data = await res.json()
      dispatch(setCredentials({ user: data.user, token: data.token }))

      const role: string = data.user.role
      if (role === 'WORKER') navigate('/worker')
      else if (role === 'EMPLOYEE') navigate('/employee')
      else navigate('/admin')
    } catch {
      setError('Cannot reach the server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lp-root">
      <div className="lp-card">
        {/* Logo */}
        <div className="lp-logo">
          <span className="lp-logo-icon">✓</span>
          <span className="lp-logo-text">GetTasks</span>
        </div>

        <h1 className="lp-title">Welcome back</h1>
        <p className="lp-subtitle">Sign in to your account to continue</p>

        {/* Form */}
        <form className="lp-form" onSubmit={handleSubmit}>
          <div className="lp-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError('') }}
              autoComplete="email"
            />
          </div>

          <div className="lp-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError('') }}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="lp-error">{error}</p>}

          <button type="submit" className="lp-submit worker" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* Sign up link */}
        <p className="lp-signup-link">
          Don't have an account?{' '}
          <button className="lp-link-btn" onClick={() => navigate('/signup')}>
            Sign up
          </button>
        </p>
      </div>
    </div>
  )
}
