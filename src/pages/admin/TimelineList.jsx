import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import './TimelineList.css'

function TimelineList({ onTabChange }) {
  const [timelines, setTimelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadTimelines = () => {
    setLoading(true)
    setError(null)
    adminApi
      .getTimelines()
      .then((data) => setTimelines(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'টাইমলাইন লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadTimelines()
  }, [])

  const handleBuild = (timeline) => {
    sessionStorage.setItem('timeline_edit_id', String(timeline.id))
    if (onTabChange) onTabChange('timeline-add')
  }

  const handleSetVirtualSeminar = async (timeline) => {
    try {
      await adminApi.setVirtualSeminarTimeline(timeline.id)
      alert('Virtual Seminar এ সেট করা হয়েছে')
    } catch (err) {
      alert(err.message || 'সেট করতে ব্যর্থ')
    }
  }

  const handleDelete = async (timeline) => {
    if (!confirm(`"${timeline.name}" টাইমলাইনটি মুছে ফেলতে চান?`)) return
    try {
      await adminApi.deleteTimeline(timeline.id)
      loadTimelines()
    } catch (err) {
      alert(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  if (loading) {
    return (
      <div className="timeline-list-page">
        <div className="admin-loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="timeline-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">সকল টাইমলাইন</h1>
          <span className="timeline-count">{timelines.length} টি টাইমলাইন</span>
        </div>
        <button type="button" className="btn-primary" onClick={() => onTabChange?.('timeline-add')}>
          <span className="btn-icon">+</span>
          নতুন টাইমলাইন অ্যাড
        </button>
      </div>

      {error && <div className="timeline-list-error">{error}</div>}

      {timelines.length === 0 && !error ? (
        <div className="timeline-list-empty">কোনো টাইমলাইন নেই</div>
      ) : (
        <div className="timeline-list-grid">
          {timelines.map((t) => (
            <div key={t.id} className="timeline-card">
              <div className="timeline-card-body">
                <p className="timeline-name">{t.name}</p>
              </div>
              <div className="timeline-card-actions">
                <button type="button" className="btn-edit" onClick={() => handleBuild(t)}>
                  সম্পাদনা / বিল্ড
                </button>
                <button type="button" className="btn-virtual-seminar" onClick={() => handleSetVirtualSeminar(t)}>
                  Virtual Seminar এ সেট করুন
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(t)}>
                  মুছুন
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TimelineList
