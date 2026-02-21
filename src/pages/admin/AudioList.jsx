import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import AudioAdd from './AudioAdd'
import './AudioList.css'

const AUDIO_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.DEV
    ? (import.meta.env?.VITE_API_ORIGIN || 'http://localhost:3001')
    : ''

function AudioList({ onTabChange }) {
  const [audios, setAudios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingAudio, setEditingAudio] = useState(null)

  const loadAudios = () => {
    setLoading(true)
    setError(null)
    adminApi
      .getPresentationAudio()
      .then((data) => setAudios(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'অডিও লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAudios()
  }, [])

  const handleEdit = (audio) => setEditingAudio(audio)

  const handleDelete = async (audio) => {
    if (!confirm(`"${audio.name}" অডিওটি মুছে ফেলতে চান?`)) return
    try {
      await adminApi.deletePresentationAudio(audio.id)
      loadAudios()
    } catch (err) {
      alert(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  const audioUrl = (path) => (path ? `${AUDIO_BASE}${path}` : '')

  if (editingAudio) {
    return (
      <AudioAdd
        editingAudio={editingAudio}
        onTabChange={(tab) => {
          setEditingAudio(null)
          if (tab === 'audio-list') {
            loadAudios()
          } else if (onTabChange) {
            onTabChange(tab)
          }
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="audio-list-page">
        <div className="admin-loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="audio-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">সকল অডিও তালিকা</h1>
          <span className="audio-count">{audios.length} টি অডিও</span>
        </div>
        <button type="button" className="btn-primary" onClick={() => onTabChange?.('audio-add')}>
          <span className="btn-icon">+</span>
          নতুন অডিও অ্যাড
        </button>
      </div>

      {error && <div className="audio-list-error">{error}</div>}

      {audios.length === 0 && !error ? (
        <div className="audio-list-empty">কোনো অডিও নেই</div>
      ) : (
        <div className="audio-list-grid">
          {audios.map((a) => (
            <div key={a.id} className="audio-card">
              <div className="audio-card-body">
                <p className="audio-name">{a.name}</p>
                <audio controls src={audioUrl(a.file_path)} className="audio-player" />
              </div>
              <div className="audio-card-actions">
                <button type="button" className="btn-edit" onClick={() => handleEdit(a)}>
                  সম্পাদনা
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(a)}>
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

export default AudioList
