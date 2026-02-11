import { useState } from 'react'
import { adminApi } from '../../services/api'
import './MusicAdd.css'

const AUDIO_SPEC = 'অডিও ফরম্যাট: MP3, WAV, WebM, OGG। সর্বোচ্চ ২০ MB।'
const CATEGORIES = [
  { value: '', label: 'ক্যাটাগরি নির্বাচন করুন' },
  { value: 'Background', label: 'Background' },
  { value: 'Promo', label: 'Promo' },
  { value: 'Tutorial', label: 'Tutorial' },
  { value: 'Other', label: 'Other' },
]
const MAX_SIZE_BYTES = 20 * 1024 * 1024
const ALLOWED_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-wav']

function MusicAdd({ onTabChange }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    status: 'active',
  })
  const [audioFile, setAudioFile] = useState(null)
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

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
    if (!formData.title?.trim()) {
      setError('টাইটেল দিন')
      return
    }
    if (!audioFile) {
      setError('অডিও ফাইল সিলেক্ট করুন')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('audio', audioFile)
      fd.append('title', formData.title.trim())
      fd.append('description', formData.description.trim())
      fd.append('category', formData.category.trim())
      fd.append('tags', formData.tags.trim())
      fd.append('status', formData.status)
      await adminApi.createAudio(fd)
      setSuccess(true)
      if (typeof onTabChange === 'function') {
        setTimeout(() => onTabChange('music-list'), 1500)
      }
    } catch (err) {
      setError(err.message || 'আপলোড ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="music-add">
      <div className="page-header">
        <h1 className="page-title">নতুন মিউজিক অ্যাড করুন</h1>
      </div>
      <div className="music-add-card">
        <p className="audio-spec">{AUDIO_SPEC}</p>

        {success && (
          <div className="music-add-success">
            মিউজিক সফলভাবে যোগ হয়েছে। তালিকায় যাচ্ছেন...
          </div>
        )}

        {error && (
          <div className="music-add-error">{error}</div>
        )}

        <form className="music-add-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="title">টাইটেল (অবশ্যক)</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="অডিওর নাম"
                disabled={submitting}
              />
            </div>
            <div className="form-group half">
              <label htmlFor="category">ক্যাটাগরি</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                disabled={submitting}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value || 'empty'} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">বিবরণ</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="সংক্ষিপ্ত বিবরণ (ঐচ্ছিক)"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="tags">ট্যাগ (কমা দিয়ে আলাদা করুন)</label>
              <input
                id="tags"
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="উদাহরণ: happy, promo, bg"
                disabled={submitting}
              />
            </div>
            <div className="form-group half">
              <label>স্ট্যাটাস</label>
              <div className="checkbox-row">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    disabled={submitting}
                  />
                  Active
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="status"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    disabled={submitting}
                  />
                  Inactive
                </label>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="audio">অডিও ফাইল (অবশ্যক)</label>
            <input
              id="audio"
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
          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'আপলোড হচ্ছে...' : 'మিউজిక যোগ করুন'}
            </button>
            {typeof onTabChange === 'function' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onTabChange('music-list')}
                disabled={submitting}
              >
                তালিকায় যান
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default MusicAdd
