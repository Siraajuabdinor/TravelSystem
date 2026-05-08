import { Compass } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const emptyForm = {
  identifier: '',
  password: '',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [formData, setFormData] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const destination = location.state?.from?.pathname ?? '/dashboard'

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await login({
        email: formData.identifier.trim(),
        password: formData.password,
      })

      navigate(destination, { replace: true })
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-layout">
      <section className="auth-hero">
        <div className="auth-hero-badge">
          <Compass size={18} />
          <span>Transport Management</span>
        </div>
        <h1>Welcome back</h1>
        <p>
          Sign in to manage routes, vehicles, cities, and the rest of your transport
          operations from one dashboard.
        </p>
      </section>

      <section className="auth-card">
        <div className="auth-card-header">
          <h2>Login</h2>
          <p>Use your email or username together with your password.</p>
        </div>

        <form className="resource-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Email or username</span>
            <input
              type="text"
              name="identifier"
              value={formData.identifier}
              onChange={handleChange}
              placeholder="Enter email or username"
              required
            />
          </label>

          <label className="form-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              required
            />
          </label>

          {error && <div className="form-message error">{error}</div>}

          <button className="btn-primary auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
        <p className="auth-switch-copy">
          User accounts are now created from inside the dashboard after an admin logs in.
        </p>
      </section>
    </div>
  )
}
