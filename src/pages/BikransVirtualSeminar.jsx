import { useState, useEffect } from 'react'
import './BikransVirtualSeminar.css'

function BikransVirtualSeminar({ onBack, headerSettings }) {
  const [showRotateMessage, setShowRotateMessage] = useState(true)

  useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.matchMedia('(orientation: landscape)').matches
      const isMobile = window.innerWidth < 768 || 'ontouchstart' in window
      setShowRotateMessage(!landscape || !isMobile)
    }
    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)
    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return (
    <div className="virtual-seminar">
      {showRotateMessage ? (
        <div className="virtual-seminar-rotate-overlay">
          <div className="virtual-seminar-rotate-icon">📱</div>
          <h2>কৃপা করে মোবাইল ঘুরিয়ে ল্যান্ডস্কেপ মোডে খুলুন</h2>
          <p>এই পেজ শুধুমাত্র মোবাইলে ল্যান্ডস্কেপ মোডে উপলব্ধ</p>
        </div>
      ) : (
        <>
          <header className="virtual-seminar-header">
            <div className="virtual-seminar-logo-box">
              <img
                src={headerSettings?.logo_image || '/BIKRANS-FINAL.png'}
                alt="Bikrans"
                className="virtual-seminar-logo"
              />
            </div>
            <h1 className="virtual-seminar-title">Bikrans Virtual Seminar</h1>
          </header>

          <main className="virtual-seminar-main">
            <div className="virtual-seminar-content">
              <h2>A Dynamic Whiteboard</h2>
            </div>
          </main>

          <button className="virtual-seminar-back-btn" onClick={onBack} aria-label="ফিরে যান">
            ← ফিরে যান
          </button>
        </>
      )}
    </div>
  )
}

export default BikransVirtualSeminar
