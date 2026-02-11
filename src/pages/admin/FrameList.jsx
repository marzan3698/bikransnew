import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'
import './FrameList.css'

const FRAME_CATEGORIES = ['', 'Background', 'Promo', 'Tutorial', 'Other']

function formatBytes(bytes) {
  if (bytes == null || bytes === 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(str) {
  if (!str) return '—'
  const d = new Date(str)
  return isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

const IMAGE_BASE = typeof import.meta !== 'undefined' && import.meta.env?.DEV
  ? (import.meta.env?.VITE_API_ORIGIN || 'http://localhost:3001')
  : ''

function FrameList({ onTabChange }) {
  const [frames, setFrames] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const loadFrames = (page = 1) => {
    setLoading(true)
    setError(null)
    const params = { page, limit: 20 }
    if (search) params.search = search
    if (category) params.category = category
    if (statusFilter) params.status = statusFilter
    adminApi
      .getFrameList(params)
      .then((res) => {
        setFrames(res.frames || [])
        setPagination(res.pagination || { page: 1, totalPages: 1, total: 0 })
      })
      .catch((err) => setError(err.message || 'লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFrames()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadFrames(1), 300)
    return () => clearTimeout(t)
  }, [search, category, statusFilter])

  const handleEditOpen = (frame) => {
    setEditForm({
      id: frame.id,
      name: frame.name,
      category: frame.category || '',
      status: frame.status,
    })
    setModal('edit')
  }

  const handleDelete = async (id) => {
    if (!confirm('এই ফ্রেমটি মুছে ফেলবেন?')) return
    try {
      await adminApi.deleteFrame(id)
      loadFrames(pagination.page)
    } catch (err) {
      alert(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  const handleToggleStatus = async (frame) => {
    const newStatus = frame.status === 'active' ? 'inactive' : 'active'
    try {
      const fd = new FormData()
      fd.append('name', frame.name)
      fd.append('category', frame.category || '')
      fd.append('status', newStatus)
      await adminApi.updateFrame(frame.id, fd)
      loadFrames(pagination.page)
    } catch (err) {
      alert(err.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ')
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    if (!editForm) return
    if (!editForm.name?.trim()) {
      alert('নাম দিন')
      return
    }
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', editForm.name.trim())
      fd.append('category', editForm.category.trim())
      fd.append('status', editForm.status)
      const fileInput = document.getElementById('edit-frame-file')
      if (fileInput?.files?.[0]) {
        fd.append('frame', fileInput.files[0])
      }
      await adminApi.updateFrame(editForm.id, fd)
      setModal(null)
      loadFrames(pagination.page)
    } catch (err) {
      alert(err.message || 'আপডেট ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  const imageUrl = (filePath) => (filePath ? `${IMAGE_BASE}${filePath}` : '')

  return (
    <div className="frame-list">
      <div className="page-header">
        <h1 className="page-title">ফ্রেম তালিকা</h1>
        {typeof onTabChange === 'function' && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => onTabChange('frame-add')}
          >
            নতুন ফ্রেম অ্যাড করুন
          </button>
        )}
      </div>

      <div className="frame-toolbar">
        <input
          type="text"
          className="toolbar-search"
          placeholder="নাম দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="toolbar-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">সব ক্যাটাগরি</option>
          {FRAME_CATEGORIES.filter(Boolean).map((c) => (
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
          <table className="admin-table frame-table">
            <thead>
              <tr>
                <th>Preview</th>
                <th>নাম</th>
                <th>ক্যাটাগরি</th>
                <th>সাইজ</th>
                <th>স্ট্যাটাস</th>
                <th>ক্রিয়েটেড</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {frames.map((frame) => (
                <tr key={frame.id}>
                  <td className="cell-thumb">
                    {frame.file_path && (
                      <img
                        src={imageUrl(frame.file_path)}
                        alt={frame.name}
                        className="frame-thumb"
                      />
                    )}
                  </td>
                  <td>{frame.name}</td>
                  <td>{frame.category || '—'}</td>
                  <td>{formatBytes(frame.file_size_bytes)}</td>
                  <td>
                    <span className={`badge badge-${frame.status === 'active' ? 'active' : 'inactive'}`}>
                      {frame.status}
                    </span>
                  </td>
                  <td>{formatDate(frame.created_at)}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => handleEditOpen(frame)}
                      >
                        এডিট
                      </button>
                      <button
                        type="button"
                        className="btn-sm"
                        onClick={() => handleToggleStatus(frame)}
                      >
                        {frame.status === 'active' ? 'Inactive করুন' : 'Active করুন'}
                      </button>
                      <button
                        type="button"
                        className="btn-sm btn-danger"
                        onClick={() => handleDelete(frame.id)}
                      >
                        ডিলিট
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {frames.length === 0 && (
            <div className="empty-state">এখনো কোনো ফ্রেম যোগ করা হয়নি।</div>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => loadFrames(pagination.page - 1)}
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
            onClick={() => loadFrames(pagination.page + 1)}
          >
            পরের
          </button>
        </div>
      )}

      {modal === 'edit' && editForm && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>ফ্রেম এডিট করুন</h2>
            <form onSubmit={handleSubmitEdit}>
              <div className="form-group">
                <label>নাম</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>ক্যাটাগরি</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  {FRAME_CATEGORIES.map((c) => (
                    <option key={c || 'empty'} value={c}>{c || '—'}</option>
                  ))}
                </select>
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
                <label>নতুন ফ্রেম (PNG/GIF, 1080×1920) – খালি রাখলে পূর্বেরটাই থাকবে</label>
                <input
                  id="edit-frame-file"
                  type="file"
                  accept=".png,.gif,image/png,image/gif"
                />
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

export default FrameList

