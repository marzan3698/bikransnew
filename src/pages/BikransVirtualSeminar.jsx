import { useState, useEffect, useRef, useCallback } from 'react'
import { publicApi } from '../services/api'
import './BikransVirtualSeminar.css'

const API_ORIGIN =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? (import.meta.env?.VITE_API_ORIGIN || 'http://localhost:3001')
    : ''

const REGISTRATION_TOKEN_KEY = 'vs_registration_token'
const POLL_REFRESH_INTERVAL_MS = 2500

function assetUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return `${API_ORIGIN || window.location.origin}${path.startsWith('/') ? '' : '/'}${path}`
}

function extractYouTubeEmbedId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : null
}

function PollFrame({
  pollId,
  question,
  options: initialOptions,
  voterSession,
  isActive,
  frameDurationSeconds,
  frameRemainingSeconds,
  viewerCount,
}) {
  const [pollData, setPollData] = useState(null)
  const [votedOptionId, setVotedOptionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchPoll = useCallback(() => {
    if (!pollId) return
    publicApi
      .getPoll(pollId)
      .then((data) => {
        setPollData(data)
        setError('')
      })
      .catch((err) => {
        setError(err.message || 'পোল লোড হতে ব্যর্থ')
      })
  }, [pollId])

  useEffect(() => {
    if (!pollId) return
    fetchPoll()
  }, [pollId, fetchPoll])

  useEffect(() => {
    if (!pollId || !isActive) return
    const iv = setInterval(fetchPoll, POLL_REFRESH_INTERVAL_MS)
    return () => clearInterval(iv)
  }, [pollId, isActive, fetchPoll])

  const handleVote = async (optionId) => {
    if (!voterSession) {
      setError('ভোট দেওয়ার জন্য রেজিস্ট্রেশন প্রয়োজন')
      return
    }
    if (votedOptionId) return
    setLoading(true)
    setError('')
    try {
      const updated = await publicApi.votePoll(pollId, { optionId, voterSession })
      setPollData(updated)
      setVotedOptionId(optionId)
    } catch (err) {
      setError(err.message || 'ভোট দেওয়া ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  const options = pollData?.options ?? initialOptions?.map((o) => ({ ...o, vote_count: 0 })) ?? []
  const maxCount = Math.max(1, ...options.map((o) => Number(o.vote_count) || 0))
  const totalVotes = options.reduce((sum, o) => sum + (Number(o.vote_count) || 0), 0)

  const rankByOptionId = {}
  ;[...options]
    .sort((a, b) => (Number(b.vote_count) || 0) - (Number(a.vote_count) || 0))
    .forEach((o, idx) => {
      rankByOptionId[o.id] = idx
    })

  const getBarColorClass = (rank) => {
    if (rank === 0) return 'vs-poll-bar-green'
    if (rank === 1) return 'vs-poll-bar-blue'
    if (rank === 2) return 'vs-poll-bar-yellow'
    return 'vs-poll-bar-red'
  }

  return (
    <div className="vs-item vs-poll vs-poll-interactive">
      <p className="vs-poll-q">{question}</p>
      {frameRemainingSeconds != null && (
        <p className="vs-poll-timer">{formatFrameTimer(frameRemainingSeconds)}</p>
      )}
      <p className="vs-poll-stats">
        এই মুহূর্তে দর্শক: <strong>{viewerCount ?? '—'}</strong> জন | মোট মতামত প্রদান: <strong>{totalVotes}</strong> জন
      </p>
      <div className="vs-poll-body">
        <div className="vs-poll-left">
          <div className="vs-poll-options">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                className="vs-poll-option-btn"
                disabled={!!votedOptionId || loading}
                onClick={() => handleVote(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
          {error && <p className="vs-poll-error">{error}</p>}
        </div>
        <div className="vs-poll-right">
          <div className="vs-poll-chart-vertical">
            {options.map((o) => {
              const count = Number(o.vote_count) || 0
              const pct = maxCount > 0 ? (count / maxCount) * 100 : 0
              const rank = rankByOptionId[o.id] ?? options.length
              const colorClass = getBarColorClass(rank)
              return (
                <div key={o.id} className="vs-poll-chart-col">
                  <span className="vs-poll-chart-count">{count}</span>
                  <div className="vs-poll-chart-bar-wrap">
                    <div
                      className={`vs-poll-chart-bar ${colorClass}`}
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className="vs-poll-chart-label">{o.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const QUIZ_RESPONDERS_POLL_INTERVAL_MS = 3500

function QuizFrame({
  quizId,
  question,
  option_a,
  option_b,
  option_c,
  option_d,
  voterSession,
  frameDurationSeconds,
  frameRemainingSeconds,
  isActive,
}) {
  const [selectedOption, setSelectedOption] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [correctResponders, setCorrectResponders] = useState([])

  const fetchResponders = useCallback(() => {
    if (!quizId) return
    publicApi
      .getQuizCorrectResponders(quizId)
      .then(setCorrectResponders)
      .catch(() => setCorrectResponders([]))
  }, [quizId])

  useEffect(() => {
    if (!quizId) return
    fetchResponders()
  }, [quizId, fetchResponders])

  useEffect(() => {
    if (!quizId || !isActive) return
    const iv = setInterval(fetchResponders, QUIZ_RESPONDERS_POLL_INTERVAL_MS)
    return () => clearInterval(iv)
  }, [quizId, isActive, fetchResponders])

  const options = [
    { key: 'a', label: option_a },
    { key: 'b', label: option_b },
    { key: 'c', label: option_c },
    { key: 'd', label: option_d },
  ].filter((o) => o.label)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedOption || !voterSession) {
      setError('উত্তর দেওয়ার জন্য রেজিস্ট্রেশন প্রয়োজন')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await publicApi.submitQuizAnswer(quizId, {
        voterSession,
        selectedOption: selectedOption,
      })
      setResult(res)
      setSubmitted(true)
    } catch (err) {
      setError(err.message || 'উত্তর জমা দেওয়া ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="vs-item vs-quiz vs-quiz-interactive">
      <p className="vs-quiz-q">{question}</p>
      {frameRemainingSeconds != null && (
        <p className="vs-quiz-timer">{formatFrameTimer(frameRemainingSeconds)}</p>
      )}
      <form onSubmit={handleSubmit} className="vs-quiz-form">
        <div className="vs-quiz-body">
          <div className="vs-quiz-left">
            <div className="vs-quiz-options">
              {options.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  className={`vs-quiz-option-btn ${selectedOption === o.key ? 'vs-quiz-option-selected' : ''}`}
                  disabled={submitted}
                  onClick={() => setSelectedOption(o.key)}
                >
                  {o.key.toUpperCase()}: {o.label}
                </button>
              ))}
            </div>
            {!submitted && (
              <button
                type="submit"
                disabled={!selectedOption || loading}
                className="vs-quiz-submit-btn"
              >
                {loading ? 'জমা হচ্ছে...' : 'জমা দিন'}
              </button>
            )}
            {error && <p className="vs-quiz-error">{error}</p>}
          </div>
          <div className="vs-quiz-right">
            {submitted && result && (
              <div className={`vs-quiz-result ${result.isCorrect ? 'vs-quiz-result-correct' : 'vs-quiz-result-wrong'}`}>
                {result.isCorrect ? 'সঠিক উত্তর!' : 'ভুল উত্তর'}
                <span className="vs-quiz-correct-answer">
                  সঠিক উত্তর: {result.correctAnswer?.toUpperCase()}
                </span>
              </div>
            )}
            {correctResponders.length > 0 && (
              <div className="vs-quiz-ticker-wrap">
                <p className="vs-quiz-ticker-heading">সঠিক উত্তরদাতা</p>
                <div className="vs-quiz-ticker">
                  <div className="vs-quiz-ticker-list">
                    {[...correctResponders, ...correctResponders].map((r, idx) => (
                      <div key={`${r.name}-${r.created_at}-${idx}`} className="vs-quiz-ticker-item">
                        {r.name}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

function WhiteboardContent({ frame, assetUrl, voterSession, isActive, frameDurationSeconds, frameRemainingSeconds, viewerCount }) {
  if (!frame || !frame.items?.length) {
    return (
      <div className="virtual-seminar-empty">
        <p>এই ফ্রেমে কোনো কন্টেন্ট নেই</p>
      </div>
    )
  }

  return (
    <div className="virtual-seminar-timeline-items">
      {frame.items.map((it) => {
        if (it.item_type === 'video' && it.data) {
          const vidId = it.data.embedId || extractYouTubeEmbedId(it.data.youtube_url)
          return (
            <div key={it.id} className="vs-item vs-video">
              {vidId ? (
                <iframe
                  key={`yt-${it.id}-${vidId}`}
                  src={`https://www.youtube.com/embed/${vidId}?autoplay=1&mute=1&playsinline=1&rel=0`}
                  title={it.data.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  loading="eager"
                />
              ) : (
                <span>{it.data.name || 'ভিডিও'}</span>
              )}
            </div>
          )
        }
        if (it.item_type === 'audio' && it.data) {
          return null
        }
        if (it.item_type === 'poll' && it.data) {
          return (
            <PollFrame
              key={it.id}
              pollId={it.item_ref}
              question={it.data.question}
              options={it.data.options}
              voterSession={voterSession}
              isActive={isActive}
              frameDurationSeconds={frameDurationSeconds}
              frameRemainingSeconds={frameRemainingSeconds}
              viewerCount={viewerCount}
            />
          )
        }
        if (it.item_type === 'quiz' && it.data) {
          return (
            <QuizFrame
              key={it.id}
              quizId={it.item_ref}
              question={it.data.question}
              option_a={it.data.option_a}
              option_b={it.data.option_b}
              option_c={it.data.option_c}
              option_d={it.data.option_d}
              voterSession={voterSession}
              frameDurationSeconds={frameDurationSeconds}
              frameRemainingSeconds={frameRemainingSeconds}
              isActive={true}
            />
          )
        }
        if (it.item_type === 'asset' && it.data) {
          const url = assetUrl(it.data.url || it.item_ref)
          const pathPart = String(it.data.url || it.item_ref || '').split('?')[0].split('#')[0]
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)([?#]|$)/i.test(pathPart) || it.data.type === 'image'
          return (
            <div key={it.id} className="vs-item vs-asset">
              {isImage ? (
                <img src={url} alt="" />
              ) : (
                <a href={url} target="_blank" rel="noreferrer">
                  অ্যাসেট
                </a>
              )}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

const VIEWER_SESSION_KEY = 'vs_viewer_session'
const HEARTBEAT_INTERVAL_MS = 10 * 1000

function getOrCreateViewerSessionId() {
  try {
    let id = sessionStorage.getItem(VIEWER_SESSION_KEY)
    if (!id) {
      id = `vs_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      sessionStorage.setItem(VIEWER_SESSION_KEY, id)
    }
    return id
  } catch {
    return `vs_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }
}

function formatCountdown(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

function formatFrameTimer(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(m)}:${pad(s)}`
}

function getSeminarIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const s = params.get('seminar')
  if (!s) return null
  const id = parseInt(s, 10)
  return Number.isNaN(id) ? null : id
}

function BikransVirtualSeminar({ onBack, headerSettings }) {
  const seminarId = getSeminarIdFromUrl()
  const fullscreenRef = useRef(null)
  const [showRotateMessage, setShowRotateMessage] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasEnteredFullscreen, setHasEnteredFullscreen] = useState(false)
  const [status, setStatus] = useState(null)
  const [countdownSeconds, setCountdownSeconds] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regName, setRegName] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regError, setRegError] = useState('')
  const [regSubmitting, setRegSubmitting] = useState(false)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [seminarEnded, setSeminarEnded] = useState(false)
  const [viewerCount, setViewerCount] = useState(null)
  const [frameRemainingSeconds, setFrameRemainingSeconds] = useState(null)
  const frameTimerRef = useRef(null)
  const frameStartTimeRef = useRef(null)
  const audioRef = useRef(null)

  const fullscreenSupported = typeof document !== 'undefined' && !!(
    document.documentElement.requestFullscreen ||
    document.documentElement.webkitRequestFullscreen ||
    document.documentElement.mozRequestFullScreen ||
    document.documentElement.msRequestFullscreen
  )

  const enterFullscreen = () => {
    const el = fullscreenRef.current || document.documentElement
    const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen
    if (req) {
      const opts = { navigationUI: 'hide' }
      const prom = req.call(el, opts)
      if (prom && typeof prom.catch === 'function') prom.catch(() => {})
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
      if (elem) setHasEnteredFullscreen(true)
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

  useEffect(() => {
    if (showRotateMessage) return
    setLoading(true)
    const token = sessionStorage.getItem(REGISTRATION_TOKEN_KEY)
    publicApi
      .getVirtualSeminarStatus(token, seminarId)
      .then((s) => {
        setStatus(s)
        if (s.countdownSeconds != null && s.countdownSeconds > 0) {
          setCountdownSeconds(s.countdownSeconds)
        }
      })
      .catch(() => setStatus({ startTime: null, canAccess: false, countdownSeconds: null, needsRegistration: false }))
      .finally(() => setLoading(false))
  }, [showRotateMessage, seminarId])

  useEffect(() => {
    if (countdownSeconds == null || countdownSeconds <= 0) return
    const iv = setInterval(() => {
      setCountdownSeconds((prev) => (prev == null ? 0 : Math.max(0, prev - 1)))
    }, 1000)
    return () => clearInterval(iv)
  }, [countdownSeconds])

  useEffect(() => {
    if (countdownSeconds === 0 && status?.startTime) {
      setCountdownSeconds(null)
      publicApi.getVirtualSeminarStatus(null, seminarId).then((s) => setStatus(s))
    }
  }, [countdownSeconds, seminarId])

  useEffect(() => {
    if (!showRotateMessage && status?.canAccess) {
      const token = sessionStorage.getItem(REGISTRATION_TOKEN_KEY)
      setLoading(true)
      setSeminarEnded(false)
      publicApi
        .getVirtualSeminarTimeline(token, seminarId)
        .then((res) => setTimeline(res.timeline))
        .catch(() => setTimeline(null))
        .finally(() => setLoading(false))
    } else if (!status?.canAccess) {
      setTimeline(null)
      setSeminarEnded(false)
    }
  }, [showRotateMessage, status?.canAccess, seminarId])

  useEffect(() => {
    if (!timeline?.frames?.length) return
    const frame = timeline.frames[currentFrameIndex]
    const durMs = (frame?.duration_seconds || 30) * 1000
    frameStartTimeRef.current = Date.now()
    setFrameRemainingSeconds(frame?.duration_seconds ?? 30)
    frameTimerRef.current = setTimeout(() => {
      const isLastFrame = currentFrameIndex === timeline.frames.length - 1
      if (isLastFrame) {
        setSeminarEnded(true)
      } else {
        setCurrentFrameIndex((prev) => prev + 1)
      }
    }, durMs)
    return () => {
      if (frameTimerRef.current) clearTimeout(frameTimerRef.current)
    }
  }, [timeline, currentFrameIndex])

  useEffect(() => {
    if (!timeline?.frames?.length) return
    const frame = timeline.frames[currentFrameIndex]
    const durationSeconds = frame?.duration_seconds ?? 30
    const iv = setInterval(() => {
      const elapsed = (Date.now() - (frameStartTimeRef.current || 0)) / 1000
      const remaining = Math.max(0, Math.ceil(durationSeconds - elapsed))
      setFrameRemainingSeconds(remaining)
    }, 1000)
    return () => clearInterval(iv)
  }, [timeline, currentFrameIndex])

  const currentFrame = timeline?.frames?.[currentFrameIndex]
  const audioItem = currentFrame?.items?.find((it) => it.item_type === 'audio')
  const audioUrl = audioItem?.data?.fileUrl || (audioItem?.data?.file_path ? assetUrl(audioItem.data.file_path) : '')

  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    if (!audioUrl) {
      el.pause()
      el.removeAttribute('src')
      return
    }
    el.src = audioUrl
    el.load()
    const onCanPlay = () => el.play().catch(() => {})
    el.addEventListener('canplay', onCanPlay)
    if (el.readyState >= 3) onCanPlay()
    return () => {
      el.removeEventListener('canplay', onCanPlay)
      el.pause()
    }
  }, [currentFrameIndex, audioUrl])

  useEffect(() => {
    if (showRotateMessage || !status?.canAccess) return
    const sid = getOrCreateViewerSessionId()

    const heartbeatAndCount = () => {
      publicApi.sendVirtualSeminarHeartbeat(sid).catch(() => {})
      publicApi.getVirtualSeminarViewerCount().then((r) => setViewerCount(r.count)).catch(() => {})
    }

    heartbeatAndCount()
    let iv = setInterval(heartbeatAndCount, HEARTBEAT_INTERVAL_MS)

    const onBeforeUnload = () => publicApi.leaveVirtualSeminarBeacon(sid)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        clearInterval(iv)
        iv = null
        publicApi.leaveVirtualSeminarBeacon(sid)
      } else if (document.visibilityState === 'visible' && !iv) {
        heartbeatAndCount()
        iv = setInterval(heartbeatAndCount, HEARTBEAT_INTERVAL_MS)
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      clearInterval(iv)
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      publicApi.leaveVirtualSeminarBeacon(sid)
    }
  }, [showRotateMessage, status?.canAccess])

  const handleRegister = async (e) => {
    e.preventDefault()
    setRegError('')
    setRegSubmitting(true)
    try {
      const body = { name: regName.trim(), phone: regPhone.trim() }
      if (seminarId) body.seminar_id = seminarId
      const { token } = await publicApi.registerVirtualSeminar(body)
      sessionStorage.setItem(REGISTRATION_TOKEN_KEY, token)
      const s = await publicApi.getVirtualSeminarStatus(token, seminarId)
      setStatus(s)
    } catch (err) {
      setRegError(err.message || 'রেজিস্ট্রেশন ব্যর্থ')
    } finally {
      setRegSubmitting(false)
    }
  }

  return (
    <div ref={fullscreenRef} className="virtual-seminar">
      {showRotateMessage ? (
        <div className="virtual-seminar-rotate-overlay">
          <div className="virtual-seminar-rotate-icon">📱</div>
          <h2>কৃপা করে মোবাইল ঘুরিয়ে ল্যান্ডস্কেপ মোডে খুলুন</h2>
          <p>এই পেজ শুধুমাত্র মোবাইলে ল্যান্ডস্কেপ মোডে উপলব্ধ</p>
        </div>
      ) : !hasEnteredFullscreen ? (
        <div className="virtual-seminar-fullscreen-popup">
          <div className="virtual-seminar-fullscreen-popup-box">
            <p className="virtual-seminar-fullscreen-popup-message">
              পূর্ণ স্ক্রিন / ফুল স্ক্রিন করুন
            </p>
            <p className="virtual-seminar-fullscreen-popup-hint">
              সেমিনার দেখতে ফুল স্ক্রিনে যান
            </p>
            {fullscreenSupported ? (
              <button
                type="button"
                className="virtual-seminar-fullscreen-popup-btn"
                onClick={enterFullscreen}
              >
                ফুল স্ক্রিনে যান
              </button>
            ) : (
              <>
                <p className="virtual-seminar-fullscreen-gate-fallback">
                  আপনার ব্রাউজার ফুল স্ক্রিন সাপোর্ট করে না
                </p>
                <button
                  type="button"
                  className="virtual-seminar-fullscreen-popup-btn"
                  onClick={() => setHasEnteredFullscreen(true)}
                >
                  যাইহোক দেখুন
                </button>
              </>
            )}
          </div>
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
            <h1 className="virtual-seminar-title">
              {status?.seminar?.title || 'Bikrans Virtual Seminar'}
            </h1>
            {viewerCount != null && (
              <span className="virtual-seminar-viewer-count">{viewerCount} জন</span>
            )}
            {!isFullscreen && (
              <button
                className="virtual-seminar-fullscreen-btn"
                onClick={enterFullscreen}
                aria-label="পূর্ণ স্ক্রিনে যান"
              >
                পূর্ণ স্ক্রিনে যান
              </button>
            )}
          </header>

          <main className="virtual-seminar-main">
            <div className="virtual-seminar-content">
              {loading && !status ? (
                <div className="virtual-seminar-loading">লোড হচ্ছে...</div>
              ) : !status?.startTime ? (
                <div className="virtual-seminar-empty">
                  <h2>সেমিনার সেট করা নেই</h2>
                  <p>অ্যাডমিন প্যানেল থেকে সেমিনার ম্যানেজমেন্টে গিয়ে নতুন সেমিনার তৈরি করুন</p>
                </div>
              ) : countdownSeconds != null && countdownSeconds > 0 ? (
                <div className="virtual-seminar-countdown">
                  <h2>পরবর্তী সেমিনার শুরু হতে বাকি</h2>
                  <div className="virtual-seminar-countdown-timer">
                    {formatCountdown(countdownSeconds)}
                  </div>
                </div>
              ) : status?.needsRegistration ? (
                <div className="virtual-seminar-register">
                  <h2>সেমিনারে যোগ দিতে রেজিস্ট্রেশন করুন</h2>
                  <form onSubmit={handleRegister} className="vs-register-form">
                    <input
                      type="text"
                      placeholder="আপনার নাম"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      required
                      className="vs-register-input"
                    />
                    <input
                      type="tel"
                      placeholder="মোবাইল নম্বর (উদাহরণ: ০১৭১২৩৪৫৬৭৮)"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      required
                      className="vs-register-input"
                    />
                    {regError && <p className="vs-register-error">{regError}</p>}
                    <button type="submit" disabled={regSubmitting} className="vs-register-btn">
                      {regSubmitting ? 'রেজিস্ট্রেশন হচ্ছে...' : 'যুক্ত হন'}
                    </button>
                  </form>
                </div>
              ) : loading && status?.canAccess ? (
                <div className="virtual-seminar-loading">লোড হচ্ছে...</div>
              ) : !timeline ? (
                <div className="virtual-seminar-empty">
                  <h2>কোনো টাইমলাইন সেট করা নেই</h2>
                  <p>অ্যাডমিন প্যানেল থেকে প্রেজেন্টেশন ম্যানেজমেন্টে গিয়ে একটি টাইমলাইন সেট করুন</p>
                </div>
              ) : status?.canAccess && timeline && !hasEnteredFullscreen ? (
                <div className="virtual-seminar-fullscreen-gate">
                  <p className="virtual-seminar-fullscreen-gate-message">সেমিনার দেখতে ফুল স্ক্রিনে যান</p>
                  {fullscreenSupported ? (
                    <button
                      type="button"
                      className="virtual-seminar-fullscreen-gate-btn"
                      onClick={enterFullscreen}
                    >
                      ফুল স্ক্রিনে যান
                    </button>
                  ) : (
                    <>
                      <p className="virtual-seminar-fullscreen-gate-fallback">
                        আপনার ব্রাউজার ফুল স্ক্রিন সাপোর্ট করে না
                      </p>
                      <button
                        type="button"
                        className="virtual-seminar-fullscreen-gate-btn"
                        onClick={() => setHasEnteredFullscreen(true)}
                      >
                        যাইহোক দেখুন
                      </button>
                    </>
                  )}
                </div>
              ) : seminarEnded ? (
                <div className="virtual-seminar-ended">
                  <h2>ধন্যবাদ</h2>
                  <p>সেমিনার শেষ</p>
                </div>
              ) : (
                <>
                  <audio ref={audioRef} preload="auto" className="vs-audio-hidden" aria-hidden />
                  <WhiteboardContent
                    frame={currentFrame}
                    assetUrl={assetUrl}
                    voterSession={typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(REGISTRATION_TOKEN_KEY) : null}
                    isActive={true}
                    frameDurationSeconds={currentFrame?.duration_seconds ?? 30}
                    frameRemainingSeconds={frameRemainingSeconds}
                    viewerCount={viewerCount}
                  />
                </>
              )}
            </div>
          </main>
        </>
      )}
    </div>
  )
}

export default BikransVirtualSeminar
