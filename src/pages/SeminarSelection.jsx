import { useState, useEffect } from 'react'
import { publicApi } from '../services/api'
import './SeminarSelection.css'

function formatDateTime(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return isoStr
  const date = d.toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })
  const time = d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

function SeminarCardCover({ type, value }) {
  if (!type || !value) return null
  if (type === 'youtube') {
    const id = typeof value === 'string' && value.length <= 15
      ? value
      : (value.match(/(?:v=|\/)([^&\s]+)/)?.[1] || value)
    return (
      <div className="seminar-card-cover seminar-card-cover--youtube">
        <img src={`https://img.youtube.com/vi/${id}/mqdefault.jpg`} alt="" />
      </div>
    )
  }
  if (type === 'image') {
    return (
      <div className="seminar-card-cover seminar-card-cover--image">
        <img src={value} alt="" />
      </div>
    )
  }
  if (type === 'video') {
    return (
      <div className="seminar-card-cover seminar-card-cover--video">
        <video src={value} muted playsInline preload="metadata" poster="" />
      </div>
    )
  }
  return null
}

function SeminarSelection({ onBack, headerSettings, user, onNavigateToLogin, onNavigateToRegister, onNavigateToProfile }) {
  const [seminars, setSeminars] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    publicApi
      .getPublicSeminars()
      .then(setSeminars)
      .catch(() => setSeminars([]))
      .finally(() => setLoading(false))
  }, [])

  const handleSelectSeminar = (id) => {
    window.history.pushState(null, '', `/virtual-seminar?seminar=${id}`)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  return (
    <div className="seminar-selection">
      <header
        className="seminar-selection-landing-header header"
        style={{
          backgroundColor: headerSettings?.header_bg_color || '#fff',
          height: `${headerSettings?.header_height || 56}px`,
        }}
      >
        <div className="header-content">
          {onBack && (
            <button className="seminar-selection-back-btn" onClick={onBack} type="button" aria-label="ফিরে যান">
              ←
            </button>
          )}
          <img
            src={headerSettings?.logo_image || '/BIKRANS-FINAL.png'}
            alt="Bikrans"
            className="logo"
            style={{ height: `${headerSettings?.logo_height || 36}px` }}
          />
          <div className="header-actions">
            {user ? (
              <button
                type="button"
                className="header-profile"
                onClick={onNavigateToProfile}
              >
                <span className="header-profile-avatar">{user.name?.charAt(0) || 'ই'}</span>
                <span className="header-profile-name">{user.name || 'ইউজার'}</span>
              </button>
            ) : (
              <>
                <button type="button" className="header-login-btn" onClick={onNavigateToLogin}>
                  লগইন
                </button>
                <button
                  type="button"
                  className="header-register-btn"
                  style={{ background: headerSettings?.app_btn_bg_color || '#52B788' }}
                  onClick={onNavigateToRegister}
                >
                  নিবন্ধন
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="seminar-selection-body">
        <div className="seminar-selection-intro">
          <h1 className="seminar-selection-title">সেমিনার নির্বাচন করুন</h1>
          <p className="seminar-selection-subtitle">একটি সেমিনার বেছে নিন এবং যোগ দিন</p>
        </div>

        <main className="seminar-selection-main">
          {loading ? (
            <div className="seminar-selection-loading">লোড হচ্ছে...</div>
          ) : seminars.length === 0 ? (
            <div className="seminar-selection-empty">
              <p>কোনো সেমিনার নেই</p>
            </div>
          ) : (
            <div className="seminar-selection-grid">
              {seminars.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="seminar-selection-card seminar-hall-card"
                  onClick={() => handleSelectSeminar(s.id)}
                >
                  {s.cover_media_type && s.cover_media_value ? (
                    <SeminarCardCover type={s.cover_media_type} value={s.cover_media_value} />
                  ) : (
                    <div className="seminar-card-cover seminar-card-cover--placeholder" aria-hidden>
                      <span>সেমিনার</span>
                    </div>
                  )}
                  <div className="seminar-hall-card-content">
                    <span className={`seminar-selection-badge seminar-selection-badge--${s.status}`}>
                      {s.status === 'live' ? 'লাইভ' : s.status === 'upcoming' ? 'আসন্ন' : s.status}
                    </span>
                    <h3 className="seminar-selection-card-title">{s.title}</h3>
                    <p className="seminar-time-label">সেমিনারের শুরুর সময়</p>
                    <p className="seminar-time-value">
                      {formatDateTime(s.start_time)}
                      {s.end_time && ` – ${formatDateTime(s.end_time)}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default SeminarSelection
