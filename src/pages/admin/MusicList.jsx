import { useState, useEffect, useRef } from 'react'
import { adminApi } from '../../services/api'
import './MusicList.css'

const AUDIO_BASE = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  ? (import.meta.env?.VITE_API_ORIGIN || 'http://localhost:3001')
  : ''
const CATEGORIES = ['', 'Background', 'Promo', 'Tutorial', 'Other']

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(sec) {
  if (sec == null) return '—'
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

function MusicList({ onTabChange }) {
  const [tracks, setTracks] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [detailTrack, setDetailTrack] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const audioRefs = useRef({})

  const loadList = (page = 1) => {
    setLoading(true)
    setError(null)
    const params = { page, limit: 20 }
    if (search) params.search = search
    if (category) params.category = category
    if (statusFilter) params.status = statusFilter
    adminApi
      .getAudioList(params)
      .then((res) => {
        setTracks(res.tracks || [])
        setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 })
      })
      .catch((err) => setError(err.message || 'লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadList()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadList(1), 300)
    return () => clearTimeout(t)
  }, [search, category, statusFilter])

  const handleEdit = (track) => {
    setEditForm({
      id: track.id,
      title: track.title,
      description: track.description || '',
      category: track.category || '',
      tags: track.tags || '',
      status: track.status,
    })
    setModal('edit')
  }

  const handleViewDetail = async (track) => {
    setDetailTrack(null)
    setModal('detail')
    try {
      const data = await adminApi.getAudio(track.id)
      setDetailTrack(data)
    } catch {
      setDetailTrack({ ...track, total_plays: 0, last_played_at: null, plays_last_7_days: 0 })
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    if (!editForm) return
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('title', editForm.title.trim())
      fd.append('description', editForm.description.trim())
      fd.append('category', editForm.category.trim())
      fd.append('tags', editForm.tags.trim())
      fd.append('status', editForm.status)
      const fileInput = document.getElementById('edit-audio-file')
      if (fileInput?.files?.[0]) fd.append('audio', fileInput.files[0])
      await adminApi.updateAudio(editForm.id, fd)
      setModal(null)
      loadList(pagination.page)
    } catch (err) {
      alert(err.message || 'আপডেট ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('এই অডিওটি মুছে ফেলবেন?')) return
    try {
      await adminApi.deleteAudio(id)
      loadList(pagination.page)
    } catch (err) {
      alert(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  const handleToggleStatus = async (track) => {
    const newStatus = track.status === 'active' ? 'inactive' : 'active'
    try {
      const fd = new FormData()
      fd.append('title', track.title)
      fd.append('description', track.description || '')
      fd.append('category', track.category || '')
      fd.append('tags', track.tags || '')
      fd.append('status', newStatus)
      await adminApi.updateAudio(track.id, fd)
      loadList(pagination.page)
    } catch (err) {
      alert(err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ')
    }
  }

  const audioUrl = (filePath) => (filePath ? `${AUDIO_BASE}${filePath}` : '')

  return (
    <div className="music-list">
      <div className="page-header">
        <h1 className="page-title">সকল মিউজিকের তালিকা</h1>
        {typeof onTabChange === 'function' && (
          <button type="button" className="btn-primary" onClick={() => onTabChange('music-add')}>
            নতুন মিউজিক অ্যাড করুন
          </button>
        )}
      </div>

      <div className="music-list-toolbar">
        <input
          type="text"
          className="toolbar-search"
          placeholder="টাইটেল দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="toolbar-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">সব ক্যাটাগরি</option>
          {CATEGORIES.filter(Boolean).map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="toolbar-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">সব স্ট্যাটাস</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table music-table">
            <thead>
              <tr>
                <th>প্লে</th>
                <th>টাইটেল</th>
                <th>ক্যাটাগরি</th>
                <th>সময়</th>
                <th>সাইজ</th>
                <th>স্ট্যাটাস</th>
                <th>প্লে কাউন্ট</th>
                <th>সর্বশেষ প্লে</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td className="cell-player">
                    <audio
                      ref={(el) => { audioRefs.current[track.id] = el }}
                      src={audioUrl(track.file_path)}
                      controls
                      className="row-audio"
                      preload="metadata"
                    />
                  </td>
                  <td>{track.title}</td>
                  <td>{track.category || '—'}</td>
                  <td>{formatDuration(track.duration_seconds)}</td>
                  <td>{formatBytes(track.file_size_bytes)}</td>
                  <td>
                    <span className={`badge badge-${track.status === 'active' ? 'active' : 'inactive'}`}>
                      {track.status}
                    </span>
                  </td>
                  <td className="cell-plays">{track.total_plays ?? 0}</td>
                  <td>{formatDate(track.last_played_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button type="button" className="btn-sm" onClick={() => handleViewDetail(track)}>
                        বিস্তারিত
                      </button>
                      <button type="button" className="btn-sm" onClick={() => handleEdit(track)}>
                        এডিট
                      </button>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => handleToggleStatus(track)}
                      >
                        {track.status === 'active' ? 'Inactive করুন' : 'Active করুন'}
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-danger"
                        onClick={() => handleDelete(track.id)}
                      >
                        ডিলিট
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tracks.length === 0 && (
            <div className="empty-state">কোনো মিউজিক নেই। নতুন মিউজিক অ্যাড করুন।</div>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => loadList(pagination.page - 1)}
          >
            আগে
          </button>
          <span className="pagination-info">
            পেজ {pagination.page} / {pagination.totalPages} (মোট {pagination.total})
          </span>
          <button
            type="button"
            className="btn-sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => loadList(pagination.page + 1)}
          >
            পরের
          </button>
        </div>
      )}

      {modal === 'detail' && detailTrack && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-detail" onClick={(e) => e.stopPropagation()}>
            <h2>অডিও বিস্তারিত</h2>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">টাইটেল</span>
                <span className="detail-value">{detailTrack.title}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">বিবরণ</span>
                <span className="detail-value">{detailTrack.description || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ক্যাটাগরি</span>
                <span className="detail-value">{detailTrack.category || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">ট্যাগ</span>
                <span className="detail-value">{detailTrack.tags || '—'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">মোট প্লে</span>
                <span className="detail-value highlight">{detailTrack.total_plays ?? 0}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">সর্বশেষ ৭ দিনে প্লে</span>
                <span className="detail-value highlight">{detailTrack.plays_last_7_days ?? 0}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">সর্বশেষ প্লে</span>
                <span className="detail-value">{formatDate(detailTrack.last_played_at)}</span>
              </div>
            </div>
            <audio controls src={audioUrl(detailTrack.file_path)} className="detail-audio" />
            <div className="modal-actions">
              <button type="button" onClick={() => setModal(null)}>বন্ধ করুন</button>
            </div>
          </div>
        </div>
      )}

      {modal === 'edit' && editForm && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>অডিও এডিট করুন</h2>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label>টাইটেল</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>বিবরণ</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="form-group">
                <label>ক্যাটাগরি</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c || 'empty'} value={c}>{c || '—'}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ট্যাগ</label>
                <input
                  type="text"
                  value={editForm.tags}
                  onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>স্ট্যাটাস</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="form-group">
                <label>নতুন অডিও (খালি রাখলে পুরনো থাকবে)</label>
                <input id="edit-audio-file" type="file" accept=".mp3,.wav,.webm,.ogg,audio/*" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>বাতিল</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'সেভ হচ্ছে...' : 'সেভ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default MusicList
