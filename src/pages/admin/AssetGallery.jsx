import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import './AssetGallery.css'

const TYPE_OPTIONS = [
  { value: '', label: 'সব টাইপ' },
  { value: 'image', label: 'ইমেজ' },
  { value: 'video', label: 'ভিডিও' },
  { value: 'audio', label: 'অডিও' },
  { value: 'document', label: 'ডকুমেন্ট' },
]

const SOURCE_OPTIONS = [
  { value: '', label: 'সব সোর্স' },
  { value: 'slider', label: 'স্লাইডার' },
  { value: 'frame', label: 'ফ্রেম' },
  { value: 'audio', label: 'অডিও' },
  { value: 'task', label: 'টাস্ক' },
  { value: 'header', label: 'হেডার' },
  { value: 'landing', label: 'ল্যান্ডিং' },
  { value: 'asset', label: 'অ্যাসেট' },
]

const SOURCE_LABELS = {
  slider: 'স্লাইডার',
  frame: 'ফ্রেম',
  audio: 'অডিও',
  task: 'টাস্ক',
  header: 'হেডার',
  landing: 'ল্যান্ডিং',
  asset: 'অ্যাসেট',
}

const TYPE_LABELS = { image: 'ইমেজ', video: 'ভিডিও', audio: 'অডিও', document: 'ডকুমেন্ট' }

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AssetGallery() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [typeFilter, setTypeFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [preview, setPreview] = useState(null)
  const [copiedId, setCopiedId] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [filePreview, setFilePreview] = useState(null)
  const [dragActive, setDragActive] = useState(false)

  const fileUrl = (path) =>
    !path ? '' : path.startsWith('http') ? path : `${window.location.origin}${path}`

  const loadGallery = () => {
    setLoading(true)
    setError(null)
    const params = {}
    if (typeFilter) params.type = typeFilter
    if (sourceFilter) params.source = sourceFilter
    adminApi
      .getAssetGallery(params)
      .then((res) => setItems(res.items || []))
      .catch((err) => setError(err.message || 'লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadGallery()
  }, [typeFilter, sourceFilter])

  const copyUrl = (item) => {
    const url = fileUrl(item.url)
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(item.id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  const openPreview = (item) => setPreview(item)
  const closePreview = () => setPreview(null)

  const handleFileSelect = (file) => {
    if (!file) return
    setSelectedFile(file)
    setUploadError(null)
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader()
      reader.onload = (e) => setFilePreview({ type: file.type, url: e.target.result, name: file.name })
      reader.readAsDataURL(file)
    } else {
      setFilePreview({ type: file.type, url: null, name: file.name })
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    setUploadError(null)
    const formData = new FormData()
    formData.append('file', selectedFile)
    try {
      await adminApi.uploadAsset(formData)
      setSelectedFile(null)
      setFilePreview(null)
      loadGallery()
    } catch (err) {
      setUploadError(err.message || 'আপলোড ব্যর্থ')
    } finally {
      setUploading(false)
    }
  }

  const clearFilePreview = () => {
    setSelectedFile(null)
    setFilePreview(null)
    setUploadError(null)
  }

  return (
    <div className="asset-gallery-page">
      <div className="page-header">
        <h1 className="page-title">অ্যাসেট গ্যালারি</h1>
      </div>

      <div
        className={`asset-upload-zone ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {filePreview ? (
          <div className="file-preview-container">
            {filePreview.type.startsWith('image/') && (
              <img src={filePreview.url} alt="Preview" className="file-preview-img" />
            )}
            {filePreview.type.startsWith('video/') && (
              <video src={filePreview.url} className="file-preview-video" controls />
            )}
            {!filePreview.type.startsWith('image/') && !filePreview.type.startsWith('video/') && (
              <div className="file-preview-icon">📄</div>
            )}
            <span className="file-preview-name">{filePreview.name}</span>
            {uploadError && <span className="asset-upload-error">{uploadError}</span>}
            <div className="file-preview-actions">
              <button type="button" className="btn-xs" onClick={clearFilePreview} disabled={uploading}>
                বাতিল
              </button>
              <button type="button" className="btn-xs btn-primary" onClick={handleUpload} disabled={uploading}>
                {uploading ? 'আপলোড হচ্ছে...' : 'আপলোড'}
              </button>
            </div>
          </div>
        ) : (
          <label className="asset-upload-label">
            <input
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              disabled={uploading}
            />
            <span className="upload-icon">📁</span>
            <span className="upload-text">ড্র্যাগ করুন অথবা ক্লিক করুন</span>
            <span className="upload-hint">ইমেজ, ভিডিও, অডিও, PDF, DOC</span>
          </label>
        )}
      </div>

      <div className="asset-filters">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="filter-select"
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="filter-select"
        >
          {SOURCE_OPTIONS.map((o) => (
            <option key={o.value || 'all'} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">লোড হচ্ছে...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="asset-grid">
          {items.map((item) => (
            <div
              key={item.id}
              className="asset-card"
              onClick={() => item.type !== 'document' && openPreview(item)}
            >
              <div className="asset-thumb">
                {item.type === 'image' && (
                  <img src={fileUrl(item.url)} alt={item.name} loading="lazy" />
                )}
                {item.type === 'video' && (
                  <video src={fileUrl(item.url)} muted preload="metadata" />
                )}
                {item.type === 'audio' && (
                  <div className="asset-audio-placeholder">
                    <span>🎵</span>
                    <span>{item.name}</span>
                  </div>
                )}
                {item.type === 'document' && (
                  <div className="asset-doc-placeholder">
                    <span>📄</span>
                    <span>{item.name}</span>
                  </div>
                )}
                <span className="asset-type-badge">{TYPE_LABELS[item.type] || item.type}</span>
                <span className="asset-source-badge">{SOURCE_LABELS[item.source] || item.source}</span>
              </div>
              <div className="asset-info">
                <span className="asset-name" title={item.name}>
                  {item.name}
                </span>
                {item.size && <span className="asset-size">{formatBytes(item.size)}</span>}
                <button
                  type="button"
                  className="asset-copy-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    copyUrl(item)
                  }}
                  title="URL কপি করুন"
                >
                  {copiedId === item.id ? 'কপি হয়েছে!' : 'URL কপি'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !loading && !error && (
        <div className="asset-empty">কোনো মিডিয়া নেই</div>
      )}

      {preview && (
        <div className="asset-preview-overlay" onClick={closePreview}>
          <div className="asset-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="asset-preview-close" onClick={closePreview} aria-label="বন্ধ">
              ×
            </button>
            <div className="asset-preview-content">
              {preview.type === 'image' && (
                <img src={fileUrl(preview.url)} alt={preview.name} />
              )}
              {preview.type === 'video' && (
                <video src={fileUrl(preview.url)} controls autoPlay />
              )}
              {preview.type === 'audio' && (
                <div className="asset-preview-audio">
                  <p>{preview.name}</p>
                  <audio src={fileUrl(preview.url)} controls autoPlay />
                </div>
              )}
            </div>
            <div className="asset-preview-meta">
              <span>{preview.name}</span>
              <button
                type="button"
                className="btn-sm btn-primary"
                onClick={() => copyUrl(preview)}
              >
                URL কপি
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetGallery
