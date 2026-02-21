import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import VideoAdd from './VideoAdd'
import './VideoList.css'

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : null
}

function VideoList({ onTabChange }) {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingVideo, setEditingVideo] = useState(null)

  const loadVideos = () => {
    setLoading(true)
    setError(null)
    adminApi
      .getExternalVideos()
      .then((data) => setVideos(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'ভিডিও লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadVideos()
  }, [])

  const handleEdit = (video) => setEditingVideo(video)

  const handleDelete = async (video) => {
    if (!confirm(`"${video.name}" ভিডিওটি মুছে ফেলতে চান?`)) return
    try {
      await adminApi.deleteExternalVideo(video.id)
      loadVideos()
    } catch (err) {
      alert(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  if (editingVideo) {
    return (
      <VideoAdd
        editingVideo={editingVideo}
        onTabChange={(tab) => {
          setEditingVideo(null)
          if (tab === 'video-list') {
            loadVideos()
          } else if (onTabChange) {
            onTabChange(tab)
          }
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="video-list-page">
        <div className="admin-loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="video-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">সকল ভিডিও তালিকা</h1>
          <span className="video-count">{videos.length} টি ভিডিও</span>
        </div>
        <button type="button" className="btn-primary" onClick={() => onTabChange?.('video-add')}>
          <span className="btn-icon">+</span>
          নতুন ভিডিও অ্যাড
        </button>
      </div>

      {error && <div className="video-list-error">{error}</div>}

      {videos.length === 0 && !error ? (
        <div className="video-list-empty">কোনো ভিডিও নেই</div>
      ) : (
        <div className="video-list-grid">
          {videos.map((v) => {
            const vidId = extractYouTubeVideoId(v.youtube_url)
            return (
              <div key={v.id} className="video-card">
                <div className="video-card-body">
                  <p className="video-name">{v.name}</p>
                  {vidId && (
                    <div className="video-thumb-wrap">
                      <img
                        src={`https://img.youtube.com/vi/${vidId}/mqdefault.jpg`}
                        alt={v.name}
                        className="video-thumb"
                      />
                    </div>
                  )}
                </div>
                <div className="video-card-actions">
                  <button type="button" className="btn-edit" onClick={() => handleEdit(v)}>
                    সম্পাদনা
                  </button>
                  <button type="button" className="btn-delete" onClick={() => handleDelete(v)}>
                    মুছুন
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default VideoList
