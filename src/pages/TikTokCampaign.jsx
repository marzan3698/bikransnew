import { useState } from 'react'
import { authApi } from '../services/api'
import './TikTokCampaign.css'

// YouTube video ID - আপনার ক্যাম্পেইন ভিডিওর ID এখানে দিন (e.g. youtube.com/watch?v=VIDEO_ID)
const YOUTUBE_VIDEO_ID = 'dQw4w9WgXcQ'

const FAQ_ITEMS = [
  {
    q: 'ক্যাম্পেইনে কারা অংশ নিতে পারবেন?',
    a: 'যেকোনো বাংলাদেশী নাগরিক যার বয়স ১৩+ এবং টিকটক অ্যাকাউন্ট আছে, অংশ নিতে পারবেন।',
  },
  {
    q: 'গান কোথা থেকে পাব?',
    a: 'পায়রা প্রোডাকশনের অফিসিয়াল চ্যানেল বা আমাদের দেওয়া লিংক থেকে গান নির্বাচন করুন।',
  },
  {
    q: 'নিবন্ধনের পর কি হবে?',
    a: 'নিবন্ধন সম্পন্ন হলে আমরা আপনার সাথে যোগাযোগ করব এবং পরবর্তী ধাপ জানাব।',
  },
  {
    q: '১ মিলিয়ন ভিউ কত দিনে পাব?',
    a: 'নির্বাচিত ভিডিও নির্বাচনের পর নির্ধারিত সময়ের মধ্যে বুস্ট দেওয়া হবে। বিস্তারিত যোগাযোগে জানানো হবে।',
  },
  {
    q: 'কোন খরচ আছে কি?',
    a: 'ক্যাম্পেইনে অংশ নেওয়া সম্পূর্ণ বিনামূল্যে। নির্বাচিত participants কে আমরা নিজেরাই বুস্ট দেব।',
  },
]

function TikTokCampaign({ user, onBack, headerSettings, footerItems, showFooter = true, onNavigateToLogin, onAutoLogin, onGoToDashboard }) {
  const [showRegisterPopup, setShowRegisterPopup] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: '',
    gender: '',
    whatsapp_number: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loginDetails, setLoginDetails] = useState({ phone: '', pin: '' })
  const [copyFeedback, setCopyFeedback] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
      }
      
      if (formData.age) payload.age = parseInt(formData.age)
      if (formData.gender) payload.gender = formData.gender
      if (formData.whatsapp_number) payload.whatsapp_number = formData.whatsapp_number

      const res = await authApi.campaignRegister(payload)
      setLoginDetails({ phone: res.user?.phone || formData.phone, pin: res.pin || '' })
      
      // Auto-login after successful registration
      if (res.token && res.user && onAutoLogin) {
        onAutoLogin(res.token, res.user)
      }
      
      setSuccess(true)
      setFormData({ name: '', phone: '', age: '', gender: '', whatsapp_number: '' })
    } catch (err) {
      setError(err.message || 'নিবন্ধন ব্যর্থ হয়েছে')
    } finally {
      setLoading(false)
    }
  }

  const loginDetailsText = `মোবাইল: ${loginDetails.phone}, পিন: ${loginDetails.pin}`

  const handleCopyLogin = () => {
    navigator.clipboard.writeText(loginDetailsText).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    }).catch(() => {})
  }

  const handleDownloadImage = () => {
    const canvas = document.createElement('canvas')
    const width = 320
    const height = 180
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#f0fdf4'
    ctx.fillRect(0, 0, width, height)
    ctx.strokeStyle = '#16a34a'
    ctx.lineWidth = 2
    ctx.strokeRect(8, 8, width - 16, height - 16)
    ctx.fillStyle = '#166534'
    ctx.font = 'bold 14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('বিক্রান্স - লগইন তথ্য', width / 2, 36)
    ctx.fillStyle = '#374151'
    ctx.font = '12px sans-serif'
    ctx.fillText(`মোবাইল: ${loginDetails.phone}`, width / 2, 72)
    ctx.fillText(`পিন: ${loginDetails.pin}`, width / 2, 96)
    ctx.font = '10px sans-serif'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('এই তথ্য সংরক্ষণ করুন। লগইনের জন্য ব্যবহার করুন।', width / 2, 140)
    const link = document.createElement('a')
    link.download = 'login-details.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="tiktok-campaign">
      {/* Header - Dynamic */}
      <header 
        className="header"
        style={{ 
          backgroundColor: headerSettings?.header_bg_color || '#ffffff',
          height: `${headerSettings?.header_height || 56}px`
        }}
      >
        <div className="header-content">
          <img 
            src={headerSettings?.logo_image || '/BIKRANS-FINAL.png'} 
            alt="Bikrans" 
            className="logo"
            style={{ height: `${headerSettings?.logo_height || 36}px` }}
          />
          <div className="header-actions">
            {user ? (
              <button
                className="header-profile"
                onClick={onGoToDashboard}
              >
                <span className="header-profile-avatar">{user.name?.charAt(0) || 'ই'}</span>
                <span className="header-profile-name">{user.name || 'ইউজার'}</span>
              </button>
            ) : (
              <>
                <button
                  className="header-login-btn"
                  onClick={onNavigateToLogin}
                >
                  লগইন
                </button>
                <button
                  className="header-register-btn"
                  onClick={() => setShowRegisterPopup(true)}
                  style={{ background: headerSettings?.app_btn_bg_color || '#52B788' }}
                >
                  নিবন্ধন
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* YouTube Video - Top of page */}
      <section className="campaign-youtube">
        <h2 className="youtube-title">ক্যাম্পেইন ভিডিও দেখুন</h2>
        <div className="youtube-wrapper">
          <iframe
            title="TikTok Campaign Video"
            src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="youtube-iframe"
          />
        </div>
      </section>

      {/* Hero Section */}
      <section className="campaign-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            পায়রা প্রোডাকশনের গান দিয়ে<br />
            টিকটকে সফল হন
          </h1>
          <p className="hero-subtitle">
            আপনার প্রতিভা দেখান এবং পান ১ মিলিয়ন ভিউ!
          </p>
          <button className="cta-primary" onClick={() => setShowRegisterPopup(true)}>
            নিবন্ধন করুন
          </button>
        </div>
        <div className="hero-mockup">
          <div className="mockup-placeholder">
            <div className="phone-frame">
              <div className="phone-screen">
                <span className="mockup-text">📱</span>
                <p>মোবাইল মকআপ</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vertically Scrollable Section - Rules / Info */}
      <section className="campaign-scroll-section">
        <h2 className="section-title">নিয়ম ও তথ্য</h2>
        <div className="scroll-box">
          <div className="scroll-content">
            <p><strong>নিয়মাবলী:</strong></p>
            <ul>
              <li>শুধুমাত্র পায়রা প্রোডাকশনের গান ব্যবহার করুন।</li>
              <li>ভিডিও টিকটকে পাবলিক পোস্ট করুন এবং লিংক আমাদের পাঠান।</li>
              <li>উপযুক্ত কন্টেন্ট বজায় রাখুন; ভুল ব্যবহার করলে অযোগ্য ঘোষণা করা হবে।</li>
              <li>একজন অংশগ্রহণকারী একাধিক ভিডিও জমা দিতে পারবেন।</li>
              <li>নির্বাচন সম্পূর্ণভাবে বিক্রান্স ও পায়রা প্রোডাকশনের সিদ্ধান্তের উপর নির্ভরশীল।</li>
            </ul>
            <p><strong>গুরুত্বপূর্ণ তারিখ:</strong></p>
            <ul>
              <li>নিবন্ধন: চলমান</li>
              <li>ভিডিও জমা: নিবন্ধনের পর নির্ধারিত তারিখে</li>
              <li>নির্বাচন ও বুস্ট: জমাদানের পর ঘোষণা করা হবে</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <h2 className="section-title">কিভাবে অংশ নেবেন?</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">১</div>
            <h3>গান নির্বাচন করুন</h3>
            <p>পায়রা প্রোডাকশনের একটি গান বেছে নিন</p>
          </div>
          <div className="step-card">
            <div className="step-number">২</div>
            <h3>টিকটক তৈরি করুন</h3>
            <p>সেই গান ব্যবহার করে আপনার সৃজনশীল টিকটক ভিডিও বানান</p>
          </div>
          <div className="step-card">
            <div className="step-number">৩</div>
            <h3>জমা দিন</h3>
            <p>আমাদেরকে আপনার ভিডিও লিংক পাঠান</p>
          </div>
          <div className="step-card">
            <div className="step-number">৪</div>
            <h3>বুস্ট পান</h3>
            <p>নির্বাচিত হলে বিক্রান্স কোম্পানি আপনার ভিডিও বুস্ট করে ১ মিলিয়ন ভিউ দেবে</p>
          </div>
        </div>
      </section>

      {/* Timeline / Process Section */}
      <section className="campaign-timeline">
        <h2 className="section-title">ক্যাম্পেইন টাইমলাইন</h2>
        <div className="timeline-list">
          <div className="timeline-item">
            <span className="timeline-dot">১</span>
            <div>
              <h3>নিবন্ধন করুন</h3>
              <p>এই পেজ থেকে এখনই রেজিস্ট্রেশন সম্পন্ন করুন।</p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot">২</span>
            <div>
              <h3>গান শুনুন ও ভিডিও বানান</h3>
              <p>পায়রা প্রোডাকশনের গান দিয়ে টিকটক ভিডিও তৈরি করুন।</p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot">৩</span>
            <div>
              <h3>জমা দিন</h3>
              <p>ভিডিও লিংক আমাদের নির্ধারিত চ্যানেলে পাঠান।</p>
            </div>
          </div>
          <div className="timeline-item">
            <span className="timeline-dot">৪</span>
            <div>
              <h3>বুস্ট পান</h3>
              <p>নির্বাচিত হলে ১ মিলিয়ন ভিউ পর্যন্ত বুস্ট পাবেন।</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <h2 className="section-title">ছোট থেকে বড় অবস্থানে</h2>
        <p className="section-description">
          বিক্রান্স আপনার প্রতিভাকে সকলের কাছে পৌঁছে দিতে প্রতিশ্রুতিবদ্ধ। 
          আপনি একজন নতুন কন্টেন্ট ক্রিয়েটর হোন বা অভিজ্ঞ - আমরা আপনার পাশে আছি।
        </p>
        <div className="benefits-grid">
          <div className="benefit-card">
            <span className="benefit-icon">🎯</span>
            <h3>১ মিলিয়ন ভিউ গ্যারান্টি</h3>
            <p>নির্বাচিত ভিডিওতে নিশ্চিত ১ মিলিয়ন ভিউ</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">🚀</span>
            <h3>দ্রুত বৃদ্ধি</h3>
            <p>আপনার ফলোয়ার ও জনপ্রিয়তা দ্রুত বাড়ান</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">💰</span>
            <h3>আয়ের সুযোগ</h3>
            <p>জনপ্রিয়তার সাথে আসবে আয়ের নতুন সুযোগ</p>
          </div>
          <div className="benefit-card">
            <span className="benefit-icon">🎵</span>
            <h3>মানসম্মত গান</h3>
            <p>পায়রা প্রোডাকশনের উচ্চমানের গান ব্যবহার করুন</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="campaign-faq">
        <h2 className="section-title">প্রায়ই জিজ্ঞাসিত প্রশ্ন</h2>
        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${openFaqIndex === index ? 'open' : ''}`}
              onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
            >
              <div className="faq-question">
                <span>{item.q}</span>
                <span className="faq-icon">{openFaqIndex === index ? '−' : '+'}</span>
              </div>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="campaign-cta">
        <h2>আজই শুরু করুন আপনার সফলতার যাত্রা</h2>
        <button className="cta-primary large" onClick={() => setShowRegisterPopup(true)}>
          এখনই নিবন্ধন করুন
        </button>
      </section>

      {/* Bottom Navigation - Dynamic */}
      {showFooter && (
        <nav className="bottom-nav">
          {footerItems?.map((item) => (
            <a 
              key={item.id} 
              href={item.link} 
              className={`nav-item ${item.link === '/tiktok-campaign' ? 'active' : ''}`}
              onClick={(e) => {
                if (item.link === '/login') {
                  e.preventDefault()
                  onNavigateToLogin?.()
                } else if (item.link === '/' || item.link === '#home') {
                  e.preventDefault()
                  onBack()
                } else if (item.link.startsWith('#')) {
                  e.preventDefault()
                }
              }}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>
      )}

      {/* Registration Modal */}
      {showRegisterPopup && (
        <div className="modal-overlay" onClick={() => !success && setShowRegisterPopup(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowRegisterPopup(false)}>×</button>
            
            {success ? (
              <div className="success-message">
                <span className="success-icon">✓</span>
                <h3>নিবন্ধন সম্পন্ন হয়েছে!</h3>
                <p className="success-note">শীঘ্রই আমরা আপনার সাথে যোগাযোগ করব</p>
                <div className="login-details-block">
                  <div className="login-detail-row">
                    <span className="login-detail-label">মোবাইল নম্বর</span>
                    <span className="login-detail-value">{loginDetails.phone}</span>
                  </div>
                  <div className="login-detail-row">
                    <span className="login-detail-label">লগইন পিন</span>
                    <span className="login-detail-value pin-value">{loginDetails.pin}</span>
                  </div>
                </div>
                <div className="success-actions">
                  <button type="button" className="btn-copy-login" onClick={handleCopyLogin}>
                    {copyFeedback ? 'কপি হয়েছে ✓' : 'লগইন তথ্য কপি করুন'}
                  </button>
                  <button type="button" className="btn-download-image" onClick={handleDownloadImage}>
                    ছবি হিসেবে ডাউনলোড করুন
                  </button>
                  <button type="button" className="btn-go-dashboard" onClick={() => onGoToDashboard && onGoToDashboard()}>
                    ড্যাশবোর্ডে যান →
                  </button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="modal-title">নিবন্ধন ফর্ম</h2>
                <p className="modal-subtitle">ক্যাম্পেইনে অংশ নিতে নিচের তথ্য পূরণ করুন</p>
                
                {error && <div className="error-banner">{error}</div>}
                
                <form onSubmit={handleSubmit} className="campaign-form">
                  <div className="form-group">
                    <label htmlFor="name">নাম *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="আপনার পুরো নাম"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="01XXXXXXXXX"
                      pattern="01[3-9]\d{8}"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="age">বয়স</label>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="আপনার বয়স"
                      min="1"
                      max="120"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">লিঙ্গ</label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">নির্বাচন করুন</option>
                      <option value="পুরুষ">পুরুষ</option>
                      <option value="মহিলা">মহিলা</option>
                      <option value="অন্যান্য">অন্যান্য</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="whatsapp_number">হোয়াটস্যাপ নম্বর</label>
                    <input
                      type="tel"
                      id="whatsapp_number"
                      name="whatsapp_number"
                      value={formData.whatsapp_number}
                      onChange={handleInputChange}
                      placeholder="01XXXXXXXXX (যদি ভিন্ন হয়)"
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন সম্পন্ন করুন'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TikTokCampaign
