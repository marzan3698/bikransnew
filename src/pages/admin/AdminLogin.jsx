import { useState } from 'react'
import { authApi } from '../../services/api'
import './AdminLogin.css'

function AdminLogin({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const hasAdminAccess =
        ['admin', 'manager', 'presentation_manager'].includes(res.user.role) ||
        (res.user.permissions && res.user.permissions.includes('dashboard'))
      if (hasAdminAccess) {
        localStorage.setItem('bikrans_token', res.token)
        onLoginSuccess(res.user)
      } else {
        setError('Admin or Manager access required')
      }
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-box">
        <img src="/BIKRANS-FINAL.png" alt="Bikrans" className="admin-login-logo" />
        <h1>Admin Login</h1>
        <p className="admin-login-sub">Sign in with admin or manager account</p>

        <form onSubmit={handleSubmit}>
          {error && <div className="admin-login-error">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <button type="button" className="admin-back-btn" onClick={onBack}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default AdminLogin
