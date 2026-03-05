import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SignUpPage.css'

// Strict email regex: local@domain.tld
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/

function validateEmail(email: string): string | null {
  const v = email.trim()
  if (!v) return 'Email is required.'
  if (!v.includes('@')) return 'Email must contain an "@" symbol.'
  const [local, domain] = v.split('@')
  if (!local) return 'Enter the part before "@".'
  if (!domain) return 'Enter the domain after "@".'
  if (!domain.includes('.')) return 'Domain must contain a "." (e.g. gmail.com).'
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address (e.g. you@example.com).'
  return null
}

type Role = 'worker' | 'employee'

interface FormState {
  name: string
  email: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  name?: string
  email?: string
  password?: string
  confirmPassword?: string
}

const emptyForm: FormState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

export default function SignUpPage() {
  const navigate = useNavigate()

  const [role, setRole] = useState<Role>('worker')
  const [form, setForm] = useState<FormState>(emptyForm)
  const [errors, setErrors] = useState<FormErrors>({})
  const [emailTouched, setEmailTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const emailError = emailTouched ? validateEmail(form.email) : null
  const emailValid = emailTouched && emailError === null && form.email.trim() !== ''

  function validate(): boolean {
    const e: FormErrors = {}

    if (!form.name.trim()) {
      e.name = 'Full name is required.'
    }

    const emailErr = validateEmail(form.email)
    if (emailErr) {
      e.email = emailErr
      setEmailTouched(true)
    }

    if (!form.password) {
      e.password = 'Password is required.'
    } else if (form.password.length < 6) {
      e.password = 'Password must be at least 6 characters.'
    }

    if (!form.confirmPassword) {
      e.confirmPassword = 'Please confirm your password.'
    } else if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role,
        }),
      })

      if (res.status === 409) {
        setErrors((prev) => ({ ...prev, email: 'This email is already registered.' }))
        setEmailTouched(true)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrors((prev) => ({
          ...prev,
          email: data?.message ?? 'Something went wrong. Please try again.',
        }))
        return
      }

      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch {
      setErrors((prev) => ({
        ...prev,
        email: 'Cannot reach the server. Make sure the backend is running.',
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="su-root">
      <div className="su-card">
        {/* Logo */}
        <div className="su-logo" onClick={() => navigate('/login')}>
          <span className="su-logo-icon">✓</span>
          <span className="su-logo-text">GetTasks</span>
        </div>

        <h1 className="su-title">Create an account</h1>
        <p className="su-subtitle">Join GetTasks and get started today</p>

        {/* Role selector */}
        <div className="su-role-selector">
          <button
            type="button"
            className={`su-role-btn ${role === 'worker' ? 'active' : ''}`}
            onClick={() => setRole('worker')}
          >
            <span className="su-role-icon">👷</span>
            <span className="su-role-label">Worker</span>
            <span className="su-role-desc">Pick & complete tasks</span>
          </button>
          <button
            type="button"
            className={`su-role-btn ${role === 'employee' ? 'active' : ''}`}
            onClick={() => setRole('employee')}
          >
            <span className="su-role-icon">📋</span>
            <span className="su-role-label">Employee</span>
            <span className="su-role-desc">Post & manage tasks</span>
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="su-success">
            <span className="su-success-icon">✓</span>
            <p>Account created! Redirecting to login…</p>
          </div>
        ) : (
          <form className="su-form" onSubmit={handleSubmit}>
            {/* Full name */}
            <div className="su-field">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="e.g. Alex Johnson"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={errors.name ? 'error' : ''}
                autoComplete="name"
              />
              {errors.name && <span className="su-error">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="su-field">
              <label htmlFor="email">Email</label>
              <div className="su-input-wrapper">
                <input
                  id="email"
                  type="text"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => {
                    handleChange('email', e.target.value)
                    if (emailTouched) setErrors((prev) => ({ ...prev, email: undefined }))
                  }}
                  onBlur={() => setEmailTouched(true)}
                  className={
                    emailError || errors.email
                      ? 'error'
                      : emailValid
                      ? 'valid'
                      : ''
                  }
                  autoComplete="email"
                />
                {emailValid && <span className="su-input-icon valid">✓</span>}
                {(emailError || errors.email) && (
                  <span className="su-input-icon invalid">✕</span>
                )}
              </div>
              {(emailError || errors.email) && (
                <span className="su-error">{emailError ?? errors.email}</span>
              )}
            </div>

            {/* Password */}
            <div className="su-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className={errors.password ? 'error' : ''}
                autoComplete="new-password"
              />
              {errors.password && <span className="su-error">{errors.password}</span>}
            </div>

            {/* Confirm password */}
            <div className="su-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                className={errors.confirmPassword ? 'error' : ''}
                autoComplete="new-password"
              />
              {errors.confirmPassword && (
                <span className="su-error">{errors.confirmPassword}</span>
              )}
            </div>

            <button type="submit" className={`su-submit ${role}`} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>
        )}

        {/* Login link */}
        {!success && (
          <p className="su-login-link">
            Already have an account?{' '}
            <button className="su-link-btn" onClick={() => navigate('/login')}>
              Sign in
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
