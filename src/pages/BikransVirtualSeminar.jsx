import { useState, useEffect, useRef } from 'react'
import './BikransVirtualSeminar.css'

function BikransVirtualSeminar({ onBack, headerSettings }) {
  const fullscreenRef = useRef(null)
  const [showRotateMessage, setShowRotateMessage] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const enterFullscreen = () => {
    const el = fullscreenRef.current || document.documentElement
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen
    if (req) {
      const opts = { navigationUI: 'hide' }
      const prom = req.call(el, opts)
      if (prom && typeof prom.catch === 'function') prom.catch(() => {})
    }
  }

  const handleBack = () => {
    const doc = document
    const elem = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement
    if (elem) {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen
      if (exit) {
        exit.call(doc).then(() => onBack()).catch(() => onBack())
      } else {
        onBack()
      }
    } else {
      onBack()
    }
  }

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

  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document
      const elem = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement
      setIsFullscreen(!!elem)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    document.addEventListener('webkitfullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange)
      const doc = document
      const elem = doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement
      if (elem) {
        const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen
        if (exit) exit.call(doc)
      }
    }
  }, [])

  return (
    <div ref={fullscreenRef} className="virtual-seminar">
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

          {!isFullscreen && (
            <button
              className="virtual-seminar-fullscreen-btn"
              onClick={enterFullscreen}
              aria-label="পূর্ণ স্ক্রিনে যান"
            >
              পূর্ণ স্ক্রিনে যান
            </button>
          )}

          <main className="virtual-seminar-main">
            <div className="virtual-seminar-content">
              <h2>A Dynamic Whiteboard</h2>
            </div>
          </main>

          <button className="virtual-seminar-back-btn" onClick={handleBack} aria-label="ফিরে যান">
            ← ফিরে যান
          </button>
        </>
      )}
    </div>
  )
}

export default BikransVirtualSeminar
