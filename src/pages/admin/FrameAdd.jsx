import { useState } from 'react'
import { adminApi } from '../../services/api'
import './FrameAdd.css'

const FRAME_SPEC = 'ফ্রেম ইমেজ: PNG বা GIF, সাইজ অবশ্যই 1080px × 1920px। সর্বোচ্চ ৫ MB।'
const CATEGORIES = [
  { value: '', label: 'ক্যাটাগরি নির্বাচন করুন' },
  { value: 'Background', label: 'Background' },
  { value: 'Promo', label: 'Promo' },
  { value: 'Tutorial', label: 'Tutorial' },
  { value: 'Other', label: 'Other' },
]
const MAX_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/gif']
const REQUIRED_WIDTH = 1080
const REQUIRED_HEIGHT = 1920

function FrameAdd({ onTabChange }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    status: 'active',
  })
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const validateDimensions = (file) =>
    new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        const { naturalWidth, naturalHeight } = img
        URL.revokeObjectURL(url)
        if (naturalWidth === REQUIRED_WIDTH && naturalHeight === REQUIRED_HEIGHT) {
          resolve(true)
        } else {
          reject(
            new Error(`ছবির সাইজ  ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} পিক্সেল হতে হবে (পাওয়া গেছে ${naturalWidth}×${naturalHeight}).`)
          )
        }
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('ইমেজ লোড করা যায়নি, আবার চেষ্টা করুন।'))
      }
      img.src = url
    })

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    setError(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (!file) {
      setImageFile(null)
      return
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('শুধুমাত্র PNG ও GIF ইমেজ সমর্থিত।')
      setImageFile(null)
      return
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('ফাইলের সাইজ ৫ MB এর কম হতে হবে।')
      setImageFile(null)
      return
    }
    try {
      await validateDimensions(file)
    } catch (e) {
      setError(e.message)
      setImageFile(null)
      return
    }
    setImageFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!formData.name?.trim()) {
      setError('ফ্রেমের নাম দিন')
      return
    }
    if (!imageFile) {
      setError('ফ্রেম ইমেজ সিলেক্ট করুন')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('frame', imageFile)
      fd.append('name', formData.name.trim())
      fd.append('category', formData.category.trim())
      fd.append('status', formData.status)
      await adminApi.createFrame(fd)
      setSuccess(true)
      if (typeof onTabChange === 'function') {
        setTimeout(() => onTabChange('frame-list'), 1500)
      }
    } catch (err) {
      setError(err.message || 'আপলোড ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="frame-add">
      <div className="page-header">
        <h1 className="page-title">নতুন ফ্রেম অ্যাড করুন</h1>
      </div>
      <div className="frame-add-card">
        <p className="frame-spec">{FRAME_SPEC}</p>

        {success && (
          <div className="frame-add-success">
            ফ্রেম সফলভাবে যোগ হয়েছে। তালিকায় যাচ্ছেন...
          </div>
        )}

        {error && (
          <div className="frame-add-error">{error}</div>
        )}

        <form className="frame-add-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="name">নাম (অবশ্যক)</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ফ্রেমের নাম"
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

          <div className="form-row">
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
            <label htmlFor="frameFile">ফ্রেম ইমেজ (PNG/GIF, 1080×1920)</label>
            <input
              id="frameFile"
              type="file"
              accept=".png,.gif,image/png,image/gif"
              onChange={handleFileChange}
              disabled={submitting}
            />
            {previewUrl && (
              <div className="frame-preview-wrap">
                <img src={previewUrl} alt="Frame preview" className="frame-preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'আপলোড হচ্ছে...' : 'ফ্রেম যোগ করুন'}
            </button>
            {typeof onTabChange === 'function' && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onTabChange('frame-list')}
                disabled={submitting}
              >
                ফ্রেম তালিকা
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}

export default FrameAdd

