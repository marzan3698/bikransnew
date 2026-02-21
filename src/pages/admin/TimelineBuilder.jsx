import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../services/api'
import './TimelineBuilder.css'

const API_ORIGIN =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? (import.meta.env?.VITE_API_ORIGIN || 'http://localhost:3001')
    : ''

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

function CanvasPreview({ frame, assetUrl }) {
  if (!frame || !frame.items?.length)
    return (
      <div className="canvas-empty">
        <p>এই ফ্রেমে কোনো আইটেম নেই</p>
        <span>বাম প্যানেল থেকে ক্লিক করে যোগ করুন</span>
      </div>
    )

  return (
    <div className="canvas-items">
      {frame.items.map((it) => {
        if (it.item_type === 'video' && it.data) {
          const vidId = extractYouTubeEmbedId(it.data.youtube_url)
          return (
            <div key={it.id} className="canvas-item canvas-video">
              {vidId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${vidId}`}
                  title={it.data.name}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                />
              ) : (
                <span>{it.data.name || 'ভিডিও'}</span>
              )}
            </div>
          )
        }
        if (it.item_type === 'audio' && it.data) {
          const url = it.data.file_path?.startsWith('http')
            ? it.data.file_path
            : assetUrl(it.data.file_path)
          return (
            <div key={it.id} className="canvas-item canvas-audio">
              <p>{it.data.name}</p>
              <audio controls src={url} className="canvas-audio-el" />
            </div>
          )
        }
        if (it.item_type === 'poll' && it.data) {
          return (
            <div key={it.id} className="canvas-item canvas-poll">
              <p className="canvas-poll-q">{it.data.question}</p>
              <ul>
                {it.data.options?.map((o) => (
                  <li key={o.id}>{o.label}</li>
                ))}
              </ul>
            </div>
          )
        }
        if (it.item_type === 'quiz' && it.data) {
          return (
            <div key={it.id} className="canvas-item canvas-quiz">
              <p className="canvas-quiz-q">{it.data.question}</p>
              <ul>
                <li>A: {it.data.option_a}</li>
                <li>B: {it.data.option_b}</li>
                <li>C: {it.data.option_c}</li>
                <li>D: {it.data.option_d}</li>
              </ul>
            </div>
          )
        }
        if (it.item_type === 'asset' && it.data) {
          const url = assetUrl(it.data.url || it.item_ref)
          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url) || url.includes('image')
          return (
            <div key={it.id} className="canvas-item canvas-asset">
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

function TimelineBuilder({ onTabChange }) {
  const [timeline, setTimeline] = useState(null)
  const [name, setName] = useState('')
  const [selectedFrameIndex, setSelectedFrameIndex] = useState(0)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [needsCreate, setNeedsCreate] = useState(false)
  const previewTimerRef = useRef(null)
  const [data, setData] = useState({
    videos: [],
    audio: [],
    polls: [],
    quizzes: [],
    assets: [],
  })

  const loadPresentationData = async () => {
    try {
      const [videos, audio, polls, quizzes, assetsRes] = await Promise.all([
        adminApi.getExternalVideos(),
        adminApi.getPresentationAudio(),
        adminApi.getPolls(),
        adminApi.getPresentationQuizzes(),
        adminApi.getAssetGallery({}),
      ])
      setData({
        videos: Array.isArray(videos) ? videos : [],
        audio: Array.isArray(audio) ? audio : [],
        polls: Array.isArray(polls) ? polls : [],
        quizzes: Array.isArray(quizzes) ? quizzes : [],
        assets: Array.isArray(assetsRes?.items) ? assetsRes.items : [],
      })
    } catch (err) {
      console.error('Load presentation data:', err)
    }
  }

  useEffect(() => {
    const editId = sessionStorage.getItem('timeline_edit_id')
    sessionStorage.removeItem('timeline_edit_id')

    const init = async () => {
      setLoading(true)
      setError(null)
      await loadPresentationData()
      if (editId) {
        try {
          const tl = await adminApi.getTimeline(editId)
          setTimeline(tl)
          setName(tl.name || '')
          setSelectedFrameIndex(0)
          if (!tl.frames?.length) {
            try {
              const frame = await adminApi.addTimelineFrame(tl.id, { duration_seconds: 30 })
              setTimeline((prev) => ({
                ...prev,
                frames: prev?.frames ? [...prev.frames, frame] : [frame],
              }))
            } catch (_) {}
          }
        } catch (err) {
          setError(err.message || 'টাইমলাইন লোড ব্যর্থ')
          setNeedsCreate(true)
        }
      } else {
        setNeedsCreate(true)
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleCreate = async () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('নাম দিন')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const created = await adminApi.createTimeline({ name: trimmed })
      const frame = await adminApi.addTimelineFrame(created.id, { duration_seconds: 30 })
      setTimeline({ ...created, frames: [frame] })
      setNeedsCreate(false)
      setSelectedFrameIndex(0)
    } catch (err) {
      setError(err.message || 'তৈরি ব্যর্থ')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    if (!timeline?.id) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('নাম দিন')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await adminApi.updateTimeline(timeline.id, { name: trimmed })
      setTimeline((prev) => (prev ? { ...prev, name: trimmed } : prev))
    } catch (err) {
      setError(err.message || 'সংরক্ষণ ব্যর্থ')
    } finally {
      setSaving(false)
    }
  }

  const handleAddFrame = async () => {
    if (!timeline?.id) return
    setError(null)
    try {
      const frame = await adminApi.addTimelineFrame(timeline.id, { duration_seconds: 30 })
      setTimeline((prev) => ({
        ...prev,
        frames: [...(prev?.frames || []), frame],
      }))
      setSelectedFrameIndex((prev) => prev + 1)
    } catch (err) {
      setError(err.message || 'ফ্রেম যোগ ব্যর্থ')
    }
  }

  const handleUpdateFrameDuration = async (frame, newDuration) => {
    if (!timeline?.id || !frame?.id || newDuration < 1) return
    try {
      await adminApi.updateTimelineFrame(timeline.id, frame.id, { duration_seconds: newDuration })
      setTimeline((prev) => ({
        ...prev,
        frames: prev.frames.map((f) =>
          f.id === frame.id ? { ...f, duration_seconds: newDuration } : f
        ),
      }))
    } catch (err) {
      setError(err.message || 'আপডেট ব্যর্থ')
    }
  }

  const handleDeleteFrame = async (frame, index) => {
    if (!timeline?.id || !frame?.id) return
    if (!confirm('এই ফ্রেম মুছে ফেলতে চান?')) return
    try {
      await adminApi.deleteTimelineFrame(timeline.id, frame.id)
      setTimeline((prev) => ({
        ...prev,
        frames: prev.frames.filter((f) => f.id !== frame.id),
      }))
      setSelectedFrameIndex((prev) => Math.max(0, prev - 1))
    } catch (err) {
      setError(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  const handleAddItem = async (itemType, itemRef) => {
    const frame = timeline?.frames?.[selectedFrameIndex]
    if (!timeline?.id || !frame?.id) {
      setError('প্রথমে একটি ফ্রেম সিলেক্ট করুন')
      return
    }
    setError(null)
    try {
      const created = await adminApi.addTimelineFrameItem(timeline.id, frame.id, itemType, itemRef)
      setTimeline((prev) => {
        const frames = [...(prev?.frames || [])]
        const idx = frames.findIndex((f) => f.id === frame.id)
        if (idx >= 0) {
          frames[idx] = {
            ...frames[idx],
            items: [...(frames[idx].items || []), { ...created, data: created.data }],
          }
        }
        return { ...prev, frames }
      })
    } catch (err) {
      setError(err.message || 'আইটেম যোগ ব্যর্থ')
    }
  }

  const handleSetVirtualSeminar = async () => {
    if (!timeline?.id) return
    setError(null)
    try {
      await adminApi.setVirtualSeminarTimeline(timeline.id)
    } catch (err) {
      setError(err.message || 'সেট করতে ব্যর্থ')
    }
  }

  const handleRemoveItem = async (frameId, itemId) => {
    if (!timeline?.id) return
    try {
      await adminApi.deleteTimelineFrameItem(timeline.id, frameId, itemId)
      setTimeline((prev) => ({
        ...prev,
        frames: prev.frames.map((f) =>
          f.id === frameId
            ? { ...f, items: (f.items || []).filter((i) => i.id !== itemId) }
            : f
        ),
      }))
    } catch (err) {
      setError(err.message || 'আইটেম মুছুন ব্যর্থ')
    }
  }

  useEffect(() => {
    if (!isPreviewMode || !timeline?.frames?.length) return
    const frame = timeline.frames[previewFrameIndex]
    const dur = (frame?.duration_seconds || 30) * 1000
    previewTimerRef.current = setTimeout(() => {
      setPreviewFrameIndex((prev) => (prev + 1) % timeline.frames.length)
    }, dur)
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current)
    }
  }, [isPreviewMode, previewFrameIndex, timeline?.frames])

  if (loading) {
    return (
      <div className="timeline-builder">
        <div className="admin-loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  if (needsCreate && !timeline) {
    return (
      <div className="timeline-builder timeline-builder-create">
        <div className="page-header">
          <h1 className="page-title">নতুন টাইমলাইন অ্যাড</h1>
          <button type="button" className="btn-secondary" onClick={() => onTabChange?.('timeline-list')}>
            সকল টাইমলাইন
          </button>
        </div>
        {error && <div className="timeline-builder-error">{error}</div>}
        <div className="timeline-create-form">
          <div className="form-group">
            <label>টাইমলাইন নাম *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="টাইমলাইনের নাম"
            />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => onTabChange?.('timeline-list')}>
              বাতিল
            </button>
            <button type="button" className="btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? 'তৈরি হচ্ছে...' : 'তৈরি করুন'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentFrame = timeline?.frames?.[selectedFrameIndex]
  const previewFrame = isPreviewMode ? timeline?.frames?.[previewFrameIndex] : currentFrame

  return (
    <div className="timeline-builder">
      <div className="timeline-builder-top">
        <div className="timeline-builder-header">
          <input
            type="text"
            className="timeline-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="টাইমলাইন নাম"
          />
          <div className="timeline-builder-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
            >
              {isPreviewMode ? 'প্রিভিউ বন্ধ' : 'প্রিভিউ'}
            </button>
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
            </button>
            <button
              type="button"
              className="btn-virtual-seminar"
              onClick={handleSetVirtualSeminar}
              title="Virtual Seminar পেজে এই টাইমলাইন প্রদর্শন হবে"
            >
              Virtual Seminar এ ব্যবহার করুন
            </button>
            <button type="button" className="btn-secondary" onClick={() => onTabChange?.('timeline-list')}>
              তালিকায় যান
            </button>
          </div>
        </div>
      </div>

      {error && <div className="timeline-builder-error">{error}</div>}

      <div className="timeline-builder-body">
        <aside className="timeline-sidebar">
          <div className="sidebar-section">
            <h3>ভিডিও</h3>
            <div className="sidebar-items">
              {data.videos.map((v) => {
                const vidId = extractYouTubeEmbedId(v.youtube_url)
                return (
                  <button
                    key={v.id}
                    type="button"
                    className="sidebar-item"
                    onClick={() => handleAddItem('video', v.id)}
                  >
                    {vidId && (
                      <img
                        src={`https://img.youtube.com/vi/${vidId}/mqdefault.jpg`}
                        alt=""
                        className="sidebar-thumb"
                      />
                    )}
                    <span>{v.name}</span>
                  </button>
                )
              })}
              {data.videos.length === 0 && <span className="sidebar-empty">কোনো ভিডিও নেই</span>}
            </div>
          </div>
          <div className="sidebar-section">
            <h3>অডিও</h3>
            <div className="sidebar-items">
              {data.audio.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="sidebar-item"
                  onClick={() => handleAddItem('audio', a.id)}
                >
                  <span className="sidebar-icon">🎵</span>
                  <span>{a.name}</span>
                </button>
              ))}
              {data.audio.length === 0 && <span className="sidebar-empty">কোনো অডিও নেই</span>}
            </div>
          </div>
          <div className="sidebar-section">
            <h3>পোলিং</h3>
            <div className="sidebar-items">
              {data.polls.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="sidebar-item"
                  onClick={() => handleAddItem('poll', p.id)}
                >
                  <span>{p.question}</span>
                </button>
              ))}
              {data.polls.length === 0 && <span className="sidebar-empty">কোনো পোল নেই</span>}
            </div>
          </div>
          <div className="sidebar-section">
            <h3>কুইজ</h3>
            <div className="sidebar-items">
              {data.quizzes.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className="sidebar-item"
                  onClick={() => handleAddItem('quiz', q.id)}
                >
                  <span>{q.question}</span>
                </button>
              ))}
              {data.quizzes.length === 0 && <span className="sidebar-empty">কোনো কুইজ নেই</span>}
            </div>
          </div>
          <div className="sidebar-section">
            <h3>অ্যাসেট</h3>
            <div className="sidebar-items sidebar-assets">
              {data.assets.slice(0, 20).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  className="sidebar-item sidebar-asset"
                  onClick={() => handleAddItem('asset', a.path || a.url)}
                >
                  {a.type === 'image' ? (
                    <img src={assetUrl(a.url || a.path)} alt="" className="sidebar-asset-img" />
                  ) : (
                    <span className="sidebar-icon">📄</span>
                  )}
                  <span className="sidebar-asset-name">{a.name}</span>
                </button>
              ))}
              {data.assets.length === 0 && <span className="sidebar-empty">কোনো অ্যাসেট নেই</span>}
            </div>
          </div>
        </aside>

        <main className="timeline-canvas-wrap">
          {isPreviewMode ? (
            <div className="canvas-preview-mobile-mockup">
              <div className="mockup-header">Bikrans Virtual Seminar</div>
              <div className="canvas-preview canvas-preview-whiteboard">
                <CanvasPreview frame={previewFrame} assetUrl={assetUrl} />
              </div>
              <div className="mockup-label">মোবাইল ল্যান্ডস্কেপ – Virtual Seminar এ এমন দেখাবে</div>
            </div>
          ) : (
            <div className="canvas-preview">
              <CanvasPreview frame={currentFrame} assetUrl={assetUrl} />
            </div>
          )}
          {!isPreviewMode && currentFrame?.items?.length > 0 && (
            <div className="canvas-item-actions">
              {currentFrame.items.map((it) => (
                <div key={it.id} className="canvas-item-badge">
                  <span>
                    {it.item_type}: {it.data?.name || it.data?.question || 'আইটেম'}
                  </span>
                  <button
                    type="button"
                    className="canvas-remove-btn"
                    onClick={() => handleRemoveItem(currentFrame.id, it.id)}
                  >
                    মুছুন
                  </button>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <div className="timeline-strip">
        <div className="timeline-strip-inner">
          {timeline?.frames?.map((f, i) => (
            <div
              key={f.id}
              className={`timeline-frame-block ${selectedFrameIndex === i && !isPreviewMode ? 'selected' : ''} ${previewFrameIndex === i && isPreviewMode ? 'playing' : ''}`}
              onClick={() => !isPreviewMode && setSelectedFrameIndex(i)}
              style={{ minWidth: `${Math.max(60, (f.duration_seconds || 30) * 2)}px` }}
            >
              <span className="frame-duration">{f.duration_seconds || 30}s</span>
              {!isPreviewMode && (
                <>
                  <input
                    key={`${f.id}-${f.duration_seconds}`}
                    type="number"
                    min={1}
                    max={300}
                    defaultValue={f.duration_seconds || 30}
                    onBlur={(e) => {
                      const v = parseInt(e.target.value, 10)
                      if (v >= 1 && v <= 300 && v !== (f.duration_seconds || 30))
                        handleUpdateFrameDuration(f, v)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="frame-duration-input"
                  />
                  <button
                    type="button"
                    className="frame-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFrame(f, i)
                    }}
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          ))}
          {!isPreviewMode && (
            <button type="button" className="timeline-add-frame" onClick={handleAddFrame}>
              + ফ্রেম যোগ
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimelineBuilder
