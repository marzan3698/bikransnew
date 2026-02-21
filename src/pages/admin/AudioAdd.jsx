import { useState } from 'react'
import { adminApi } from '../../services/api'
import './AudioAdd.css'

const AUDIO_SPEC = 'অডিও ফরম্যাট: MP3, WAV, WebM, OGG। সর্বোচ্চ ২০ MB।'
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-wav']
const MAX_SIZE_BYTES = 20 * 1024 * 1024

function AudioAdd({ onTabChange, editingAudio }) {
  const isEdit = Boolean(editingAudio?.id)
  const [name, setName] = useState(editingAudio?.name || '')
  const [audioFile, setAudioFile] = useState(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    setError(null)
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl)
      setAudioPreviewUrl(null)
    }
    if (!file) {
      setAudioFile(null)
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('শুধুমাত্র MP3, WAV, WebM, OGG ফরম্যাট সমর্থিত।')
      setAudioFile(null)
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('ফাইলের আকার ২০ MB এর কম হতে হবে।')
      setAudioFile(null)
      return
    }
    setAudioFile(file)
    setAudioPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('নাম দিন (ইউনিক হতে হবে)')
      return
    }
    if (!isEdit && !audioFile) {
      setError('অডিও ফাইল সিলেক্ট করুন')
      return
    }

    setSubmitting(true)
    try {
      if (isEdit) {
        await adminApi.updatePresentationAudio(editingAudio.id, { name: name.trim() })
      } else {
        const fd = new FormData()
        fd.append('audio', audioFile)
        fd.append('name', name.trim())
        await adminApi.createPresentationAudio(fd)
      }
      if (onTabChange) onTabChange('audio-list')
    } catch (err) {
      setError(err.message || 'সংরক্ষণ ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="audio-add-page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'অডিও সম্পাদনা' : 'নতুন অডিও অ্যাড'}</h1>
        <button type="button" className="btn-secondary" onClick={() => onTabChange?.('audio-list')}>
          সকল অডিও তালিকা
        </button>
      </div>

      {error && <div className="audio-add-error">{error}</div>}

      <form className="audio-add-form" onSubmit={handleSubmit}>
        <div className="audio-section">
          <p className="audio-spec">{AUDIO_SPEC}</p>
          <div className="form-group">
            <label>নাম * (ইউনিক)</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="অডিওর নাম"
            />
          </div>
          {!isEdit && (
          <div className="form-group">
            <label>অডিও ফাইল *</label>
            <input
              type="file"
              accept=".mp3,.wav,.webm,.ogg,audio/mpeg,audio/wav,audio/webm,audio/ogg"
              onChange={handleFileChange}
              disabled={submitting}
            />
            {audioPreviewUrl && (
              <div className="audio-preview-wrap">
                <audio controls src={audioPreviewUrl} className="audio-preview" />
              </div>
            )}
          </div>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => onTabChange?.('audio-list')}>
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

export default AudioAdd
