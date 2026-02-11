import { useState, useEffect, useRef } from 'react'
import { publicApi } from '../services/api'
import './InstantVideoEditor.css'

const BAR_COUNT = 50
function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

function WaveformBars({ progress, trackId, onSeek, seekable }) {
  const heights = []
  for (let i = 0; i < BAR_COUNT; i++) {
    heights.push(30 + (Math.sin((i + (trackId || 0)) * 0.35) * 0.5 + 0.5) * 40)
  }
  const handleClick = (e) => {
    if (!seekable || !onSeek) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const pct = Math.max(0, Math.min(1, x / rect.width))
    onSeek(pct)
  }
  return (
    <div
      className={`waveform-bars ${seekable ? 'seekable' : ''}`}
      onClick={handleClick}
      role={seekable ? 'slider' : undefined}
      aria-label={seekable ? 'ক্লিক করে সময় সিলেক্ট করুন' : undefined}
    >
      {heights.map((h, i) => (
        <div
          key={i}
          className={`waveform-bar ${i / BAR_COUNT < progress ? 'filled' : ''}`}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  )
}

function FrameCard({ frame, onPreview }) {
  const ext = (frame.mime_type === 'image/gif' || /\.gif$/i.test(frame.fileUrl || '')) ? '.gif' : '.png'
  const filename = ((frame.name || 'frame').replace(/[^a-zA-Z0-9\u0980-\u09FF\-_]/g, '_')) + ext
  return (
    <div className="frame-collect-card">
      <div
        className="frame-preview-wrap"
        onClick={() => onPreview && onPreview(frame)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onPreview && onPreview(frame)}
        aria-label="পুরো ছবি দেখুন"
      >
        <img src={frame.fileUrl} alt={frame.name || 'ফ্রেম'} className="frame-preview-img" />
      </div>
      <div className="frame-card-info">
        <span className="frame-card-name">{frame.name || 'ফ্রেম'}</span>
        <a
          href={frame.fileUrl}
          download={filename}
          className="frame-download-btn"
          onClick={(e) => e.stopPropagation()}
        >
          ডাউনলোড
        </a>
      </div>
    </div>
  )
}

function AudioTrackCard({ track, isPlaying, progress, currentTime, duration, onPlayPause, onSeek }) {
  const durationStr = duration != null ? formatTime(duration) : '--:--'
  const currentTimeStr = formatTime(currentTime)
  const filename = (track.title || 'audio').replace(/[^a-zA-Z0-9\u0980-\u09FF\-_]/g, '_') + '.mp3'
  return (
    <div className="audio-track-card">
      <button
        type="button"
        className={`audio-card-play ${isPlaying ? 'playing' : ''}`}
        onClick={() => onPlayPause(track)}
        aria-label={isPlaying ? 'বিরতি' : 'চালানো'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>
      <div className="audio-card-body">
        <div className="audio-card-title">{track.title || 'অডিও'}</div>
        <WaveformBars
          progress={progress}
          trackId={track.id}
          onSeek={onSeek}
          seekable={isPlaying}
        />
        <div className="audio-card-meta">
          <span className="audio-timer">
            {currentTimeStr} / {durationStr}
          </span>
          <a
            href={track.fileUrl}
            download={filename}
            className="audio-download-btn"
            onClick={(e) => e.stopPropagation()}
          >
            ডাউনলোড
          </a>
        </div>
      </div>
    </div>
  )
}

function InstantVideoEditor({ onBack, headerSettings, footerItems, showFooter = true }) {
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1)
  const [audioTracks, setAudioTracks] = useState([])
  const [frames, setFrames] = useState([])
  const [selectedAudio, setSelectedAudio] = useState(null)
  const [selectedFrame, setSelectedFrame] = useState(null)
  const [videoFile, setVideoFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState(false)
  const [resultBlob, setResultBlob] = useState(null)
  const [loadingAudio, setLoadingAudio] = useState(false)
  const [loadingFrames, setLoadingFrames] = useState(false)
  const [playingTrackId, setPlayingTrackId] = useState(null)
  const [playProgress, setPlayProgress] = useState(0)
  const [playCurrentTime, setPlayCurrentTime] = useState(0)
  const [playDuration, setPlayDuration] = useState(0)
  const [previewFrame, setPreviewFrame] = useState(null)
  const audioRef = useRef(null)

  const loadAudioAndFrames = async () => {
    setLoadingAudio(true)
    setLoadingFrames(true)
    setError('')
    try {
      const [audioData, framesData] = await Promise.all([
        publicApi.getAudioTracks(),
        publicApi.getFrames(),
      ])
      setAudioTracks(Array.isArray(audioData) ? audioData : (audioData?.tracks || []))
      setFrames(Array.isArray(framesData) ? framesData : (framesData?.frames || []))
    } catch (err) {
      setError(err.message || 'ডেটা লোড করা যায়নি')
    } finally {
      setLoadingAudio(false)
      setLoadingFrames(false)
    }
  }

  useEffect(() => {
    loadAudioAndFrames()
  }, [])

  useEffect(() => {
    if (showModal && (audioTracks.length === 0 || frames.length === 0)) {
      loadAudioAndFrames()
    }
  }, [showModal])

  const handleOpenModal = () => {
    setShowModal(true)
    setStep(1)
    setSelectedAudio(null)
    setSelectedFrame(null)
    setVideoFile(null)
    setResultBlob(null)
    setError('')
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setStep(1)
    setSelectedAudio(null)
    setSelectedFrame(null)
    setVideoFile(null)
    setResultBlob(null)
  }

  const handlePlayPause = (track) => {
    if (!audioRef.current) return
    const isCurrent = playingTrackId === track.id
    const isPaused = audioRef.current.paused || audioRef.current.src !== track.fileUrl
    if (isCurrent && !isPaused) {
      audioRef.current.pause()
      return
    }
    audioRef.current.src = track.fileUrl
    audioRef.current.play()
    setPlayingTrackId(track.id)
    setPlayProgress(0)
    setPlayCurrentTime(0)
    setPlayDuration(track.duration_seconds ?? 0)
    publicApi.logAudioPlay(track.id, 'editor').catch(() => {})
  }

  const playAudio = (url) => {
    const track = audioTracks.find((t) => t.fileUrl === url)
    if (track) handlePlayPause(track)
    else if (audioRef.current) {
      if (audioRef.current.src === url) {
        audioRef.current.paused ? audioRef.current.play() : audioRef.current.pause()
      } else {
        audioRef.current.src = url
        audioRef.current.play()
      }
    }
  }

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const onTimeUpdate = () => {
      if (el.duration && !isNaN(el.duration)) {
        setPlayProgress(el.currentTime / el.duration)
        setPlayCurrentTime(el.currentTime)
        setPlayDuration(el.duration)
      }
    }
    const onEnded = () => {
      setPlayingTrackId(null)
      setPlayProgress(0)
      setPlayCurrentTime(0)
    }
    el.addEventListener('timeupdate', onTimeUpdate)
    el.addEventListener('ended', onEnded)
    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate)
      el.removeEventListener('ended', onEnded)
    }
  }, [])

  const handleNext = () => {
    if (step === 1 && !selectedAudio) {
      setError('একটি অডিও সিলেক্ট করুন')
      return
    }
    if (step === 2 && !selectedFrame) {
      setError('একটি ফ্রেম সিলেক্ট করুন')
      return
    }
    if (step === 3 && !videoFile) {
      setError('ভিডিও আপলোড করুন')
      return
    }
    setError('')
    if (step < 5) setStep(step + 1)
  }

  const handleComplete = async () => {
    setError('')
    setProcessing(true)
    try {
      const blob = await publicApi.processVideo(videoFile, selectedAudio.id, selectedFrame.id)
      setResultBlob(blob)
      setStep(5)
    } catch (err) {
      setError(err.message || 'ভিডিও প্রসেস ব্যর্থ')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultBlob) return
    const url = URL.createObjectURL(resultBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bikrans-video-${Date.now()}.mp4`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0]
    setVideoFile(file || null)
    setError('')
  }

  const handleSeek = (trackId, progress) => {
    if (playingTrackId !== trackId || !audioRef.current) return
    const el = audioRef.current
    if (el.duration && !isNaN(el.duration)) {
      el.currentTime = progress * el.duration
      setPlayProgress(progress)
      setPlayCurrentTime(el.currentTime)
    }
  }

  return (
    <div className="instant-video-editor">
      <header
        className="video-editor-header"
        style={{
          backgroundColor: headerSettings?.header_bg_color || '#ffffff',
          height: `${headerSettings?.header_height || 56}px`,
        }}
      >
        <div className="header-content">
          <button className="back-btn" onClick={onBack} aria-label="বাক">
            ←
          </button>
          <img
            src={headerSettings?.logo_image || '/BIKRANS-FINAL.png'}
            alt="Bikrans"
            className="logo"
            style={{ height: `${headerSettings?.logo_height || 36}px` }}
          />
          <div className="header-spacer" />
        </div>
      </header>

      <main className="video-editor-main">
        <h1 className="video-editor-page-title">আপনাকে অটোমেটিক ভিডিও স্টেশনে স্বাগতম</h1>
        <p className="video-editor-page-subtitle">
          এখান থেকে আপনি আপনার টিকটক ভিডিওর জন্য পারফেক্ট সেটাপ পেয়ে যাবেন যাতে সহজেই আপনার ভিডিও এক্সসেপ্ট হয়।
        </p>
        <button className="video-editor-start-btn" onClick={handleOpenModal}>
          শুরু করুন
        </button>
      </main>

      <section className="audio-library-section">
        <h2 className="audio-library-title">অডিও সংগ্রহ</h2>
        {loadingAudio && audioTracks.length === 0 ? (
          <p className="audio-library-loading">লোড হচ্ছে...</p>
        ) : audioTracks.length === 0 ? (
          <p className="audio-library-empty">কোন অডিও নেই</p>
        ) : (
          <div className="audio-track-list">
            {audioTracks.map((track) => (
              <AudioTrackCard
                key={track.id}
                track={track}
                isPlaying={playingTrackId === track.id}
                progress={playingTrackId === track.id ? playProgress : 0}
                currentTime={playingTrackId === track.id ? playCurrentTime : 0}
                duration={playingTrackId === track.id ? playDuration : (track.duration_seconds ?? 0)}
                onPlayPause={handlePlayPause}
                onSeek={(p) => handleSeek(track.id, p)}
              />
            ))}
          </div>
        )}

        <h2 className="audio-library-title frame-section-title">ফ্রেম সংগ্রহ</h2>
        {loadingFrames && frames.length === 0 ? (
          <p className="audio-library-loading">লোড হচ্ছে...</p>
        ) : frames.length === 0 ? (
          <p className="audio-library-empty">কোন ফ্রেম নেই</p>
        ) : (
          <div className="frame-collect-grid">
            {frames.map((frame) => (
              <FrameCard key={frame.id} frame={frame} onPreview={setPreviewFrame} />
            ))}
          </div>
        )}
      </section>

      {previewFrame && (
        <div
          className="frame-preview-modal-overlay"
          onClick={() => setPreviewFrame(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setPreviewFrame(null)}
        >
          <div className="frame-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="frame-preview-close"
              onClick={() => setPreviewFrame(null)}
              aria-label="বন্ধ"
            >
              ×
            </button>
            <img src={previewFrame.fileUrl} alt={previewFrame.name || 'ফ্রেম'} />
          </div>
        </div>
      )}

      {showFooter && footerItems?.length > 0 && (
        <nav className="bottom-nav">
          <a href="/" className="nav-item" onClick={(e) => { e.preventDefault(); onBack?.() }}>
            <span className="nav-icon">🏠</span>
            <span className="nav-label">হোম</span>
          </a>
          {footerItems.slice(1).map((item, i) => (
            <a key={item.id || i} href={item.link || '#'} className="nav-item">
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </a>
          ))}
        </nav>
      )}

      {/* Modal */}
      {showModal && (
        <div className="video-editor-modal-overlay" onClick={handleCloseModal}>
          <div className="video-editor-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal} aria-label="বন্ধ">×</button>
            <div className="modal-step-indicator">ধাপ {step} / 5</div>

            {step === 1 && (
              <div className="modal-step">
                <h3>অডিও সিলেক্ট করুন</h3>
                <p className="modal-hint">একটি অডিও বেছে নিন</p>
                {loadingAudio ? (
                  <p>লোড হচ্ছে...</p>
                ) : audioTracks.length === 0 ? (
                  <p>কোন অডিও নেই। অ্যাডমিন থেকে অডিও যোগ করুন।</p>
                ) : (
                  <div className="audio-list">
                    {audioTracks.map((t) => (
                      <div
                        key={t.id}
                        className={`audio-item ${selectedAudio?.id === t.id ? 'selected' : ''}`}
                        onClick={() => setSelectedAudio(t)}
                      >
                        <button
                          type="button"
                          className="audio-play-btn"
                          onClick={(e) => { e.stopPropagation(); playAudio(t.fileUrl) }}
                        >
                          ▶
                        </button>
                        <span className="audio-title">{t.title || 'অডিও'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="modal-step">
                <h3>ফ্রেম সিলেক্ট করুন</h3>
                <p className="modal-hint">একটি ফ্রেম বেছে নিন</p>
                {loadingFrames ? (
                  <p>লোড হচ্ছে...</p>
                ) : frames.length === 0 ? (
                  <p>কোন ফ্রেম নেই। অ্যাডমিন থেকে ফ্রেম যোগ করুন।</p>
                ) : (
                  <div className="frame-grid">
                    {frames.map((f) => (
                      <div
                        key={f.id}
                        className={`frame-item ${selectedFrame?.id === f.id ? 'selected' : ''}`}
                        onClick={() => setSelectedFrame(f)}
                      >
                        <img src={f.fileUrl} alt={f.name || 'ফ্রেম'} />
                        <span className="frame-name">{f.name || 'ফ্রেম'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="modal-step">
                <h3>৩০ সেকেন্ডের সুন্দর ভিডিও দিন</h3>
                <p className="modal-hint">আপনার ভিডিও আপলোড করুন (PNG/GIF ফ্রেম সাইজে অটোমেটিক রিসাইজ হবে)</p>
                <div className="video-upload-area">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="video-file-input"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="video-upload-label">
                    {videoFile ? videoFile.name : 'ভিডিও সিলেক্ট করুন'}
                  </label>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="modal-step">
                <h3>প্রসেস শুরু করুন</h3>
                <p className="modal-hint">কমপ্লিট বাটনে চাপ দিন এবং ভিডিও প্রস্তুত হলে ডাউনলোড করুন</p>
                <button
                  className="modal-complete-btn"
                  onClick={handleComplete}
                  disabled={processing}
                >
                  {processing ? 'প্রসেস হচ্ছে...' : 'কমপ্লিট'}
                </button>
              </div>
            )}

            {step === 5 && resultBlob && (
              <div className="modal-step">
                <h3>আপনার ভিডিও প্রস্তুত!</h3>
                <video
                  src={URL.createObjectURL(resultBlob)}
                  controls
                  className="result-preview"
                  playsInline
                />
                <button className="modal-download-btn" onClick={handleDownload}>
                  ডাউনলোড করুন
                </button>
              </div>
            )}

            {error && <div className="modal-error">{error}</div>}

            <div className="modal-actions">
              {step < 4 && (
                <button type="button" className="modal-btn next" onClick={handleNext}>
                  পরবর্তী
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}

export default InstantVideoEditor
