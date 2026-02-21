import { useState } from 'react'
import { adminApi } from '../../services/api'
import './VideoAdd.css'

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : null
}

function VideoAdd({ onTabChange, editingVideo }) {
  const isEdit = Boolean(editingVideo?.id)
  const [name, setName] = useState(editingVideo?.name || '')
  const [youtubeUrl, setYoutubeUrl] = useState(editingVideo?.youtube_url || '')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const videoId = extractYouTubeVideoId(youtubeUrl)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('নাম দিন')
      return
    }
    if (!youtubeUrl.trim()) {
      setError('YouTube URL দিন')
      return
    }
    if (!videoId) {
      setError('সঠিক YouTube URL দিন (যেমন: youtube.com/watch?v=VIDEO_ID)')
      return
    }

    setSubmitting(true)
    try {
      const payload = { name: name.trim(), youtube_url: youtubeUrl.trim() }
      if (isEdit) {
        await adminApi.updateExternalVideo(editingVideo.id, payload)
      } else {
        await adminApi.createExternalVideo(payload)
      }
      if (onTabChange) onTabChange('video-list')
    } catch (err) {
      setError(err.message || 'সংরক্ষণ ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="video-add-page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'ভিডিও সম্পাদনা' : 'নতুন ভিডিও অ্যাড'}</h1>
        <button type="button" className="btn-secondary" onClick={() => onTabChange?.('video-list')}>
          সকল ভিডিও তালিকা
        </button>
      </div>

      {error && <div className="video-add-error">{error}</div>}

      <form className="video-add-form" onSubmit={handleSubmit}>
        <div className="video-section">
          <div className="form-group">
            <label>নাম *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ভিডিওর নাম (ইউনিক হতে হবে)"
            />
          </div>
          <div className="form-group">
            <label>YouTube URL *</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <small>উদাহরণ: youtube.com/watch?v=VIDEO_ID, youtu.be/VIDEO_ID</small>
          </div>
          {videoId && (
            <div className="form-group">
              <label>প্রিভিউ</label>
              <div className="video-preview-wrap">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=0&mute=1`}
                  title="Video preview"
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
          <button type="button" className="btn-secondary" onClick={() => onTabChange?.('video-list')}>
            বাতিল
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'আপডেট' : 'যোগ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default VideoAdd
