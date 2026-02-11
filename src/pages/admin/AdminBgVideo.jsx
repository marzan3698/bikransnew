import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import './AdminBgVideo.css'

const DEFAULT_VIDEO_ID = 'mfoRx20c7Us'

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : null
}

function AdminBgVideo() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [videoId, setVideoId] = useState(DEFAULT_VIDEO_ID)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await adminApi.getAdminBgVideo()
      setVideoId(data.admin_bg_video_id || DEFAULT_VIDEO_ID)
      setYoutubeUrl(data.youtube_url || '')
    } catch (err) {
      const msg = err.message || 'Failed to load settings'
      const hint = msg.includes('Not Found') || msg.includes('404')
        ? ' Node API সার্ভার চালু আছে কিনা চেক করুন — টার্মিনালে npm run dev:all অথবা npm run server চালান।'
        : ''
      setError(msg + hint)
    } finally {
      setLoading(false)
    }
  }

  const handleUrlChange = (e) => {
    const url = e.target.value
    setYoutubeUrl(url)
    const id = extractYouTubeVideoId(url)
    if (id) setVideoId(id)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const id = extractYouTubeVideoId(youtubeUrl)
    if (!id && !videoId) {
      setError('Please enter a valid YouTube URL')
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      await adminApi.updateAdminBgVideo({ youtube_url: youtubeUrl || undefined, admin_bg_video_id: id || videoId })
      setVideoId(id || videoId)
      if (!youtubeUrl && id) {
        setYoutubeUrl(`https://www.youtube.com/watch?v=${id || videoId}`)
      }
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      window.dispatchEvent(new Event('admin-bg-video-updated'))
    } catch (err) {
      setError(err.message || 'Failed to update video')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="admin-loading">Loading...</div>
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1&controls=1&showinfo=0&rel=0&modestbranding=1`

  return (
    <div className="admin-bg-video">
      <div className="page-header">
        <h1 className="page-title">Admin Panel Background Video</h1>
        <p className="page-desc">অ্যাডমিন প্যানেলের ব্যাকগ্রাউন্ডে যে ভিডিও প্লে হবে সেটা এখান থেকে পরিবর্তন করুন। YouTube URL দিন।</p>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">ভিডিও সফলভাবে আপডেট হয়েছে!</div>}

      <form onSubmit={handleSubmit} className="admin-bg-video-form">
        <div className="form-section">
          <h2>YouTube ভিডিও URL</h2>
          <div className="form-group">
            <label htmlFor="youtube_url">YouTube ভিডিও লিংক</label>
            <input
              type="url"
              id="youtube_url"
              value={youtubeUrl}
              onChange={handleUrlChange}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <small>উদাহরণ: youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID</small>
          </div>

          {videoId && (
            <div className="form-group">
              <label>বর্তমান প্রিভিউ</label>
              <div className="video-preview-wrap">
                <iframe
                  src={embedUrl}
                  title="Background video preview"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-preview-iframe"
                />
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AdminBgVideo
