import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import './VirtualSeminarManagement.css'

const STATUS_LABELS = { upcoming: 'আসন্ন', live: 'চলছে', ended: 'সম্পন্ন' }

function VirtualSeminarManagement({ onTabChange }) {
  const [seminars, setSeminars] = useState([])
  const [timelines, setTimelines] = useState([])
  const [selectedSeminarId, setSelectedSeminarId] = useState(null)
  const [detail, setDetail] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [stats, setStats] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    title: '',
    start_time: '',
    end_time: '',
    timeline_id: '',
    cover_media_type: '',
    cover_youtube_url: '',
    cover_file: null,
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadSeminars = () => {
    adminApi
      .getSeminars()
      .then((data) => setSeminars(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'লোড ব্যর্থ'))
  }

  const loadTimelines = () => {
    adminApi
      .getTimelines()
      .then((data) => setTimelines(Array.isArray(data) ? data : []))
      .catch(() => setTimelines([]))
  }

  const loadDetail = (id) => {
    if (!id) return
    setSelectedSeminarId(id)
    Promise.all([
      adminApi.getSeminar(id),
      adminApi.getSeminarRegistrations(id),
      adminApi.getSeminarStats(id),
    ])
      .then(([d, regRes, statsRes]) => {
        setDetail(d)
        setRegistrations(Array.isArray(regRes?.registrations) ? regRes.registrations : [])
        setStats(statsRes)
      })
      .catch((err) => setError(err.message || 'লোড ব্যর্থ'))
  }

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      await Promise.all([
        adminApi.getTimelines().then((d) => setTimelines(Array.isArray(d) ? d : [])),
        adminApi.getSeminars().then((d) => setSeminars(Array.isArray(d) ? d : [])),
      ])
      if (selectedSeminarId) loadDetail(selectedSeminarId)
    } catch (err) {
      setError(err.message || 'লোড ব্যর্থ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const iv = setInterval(() => {
      adminApi.getSeminars().then((d) => setSeminars(Array.isArray(d) ? d : [])).catch(() => {})
      if (selectedSeminarId) {
        adminApi.getSeminarStats(selectedSeminarId).then(setStats).catch(() => {})
      }
    }, 15000)
    return () => clearInterval(iv)
  }, [selectedSeminarId])

  const resetForm = () => {
    setForm({ title: '', start_time: '', end_time: '', timeline_id: '', cover_media_type: '', cover_youtube_url: '', cover_file: null })
    setEditingId(null)
    setShowForm(false)
  }

  const toDatetimeLocal = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const handleEdit = (s) => {
    const isYoutube = s.cover_media_type === 'youtube'
    setForm({
      title: s.title || '',
      start_time: toDatetimeLocal(s.start_time),
      end_time: toDatetimeLocal(s.end_time),
      timeline_id: s.timeline_id ?? '',
      cover_media_type: s.cover_media_type || '',
      cover_youtube_url: isYoutube && s.cover_media_value ? `https://www.youtube.com/watch?v=${s.cover_media_value}` : '',
      cover_file: null,
    })
    setEditingId(s.id)
    setShowForm(true)
  }

  const handleCreate = () => {
    resetForm()
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title.trim(),
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        timeline_id: form.timeline_id || null,
      }
      if (form.cover_media_type === 'youtube' && form.cover_youtube_url?.trim()) {
        payload.cover_media_type = 'youtube'
        payload.cover_media_value = form.cover_youtube_url.trim()
      } else if (form.cover_media_type === '' || form.cover_media_type === null) {
        payload.cover_media_type = ''
        payload.cover_media_value = null
      }

      let seminarId = editingId
      if (editingId) {
        await adminApi.updateSeminar(editingId, payload)
      } else {
        const res = await adminApi.createSeminar(payload)
        seminarId = res.id
      }

      if (form.cover_file && (form.cover_media_type === 'video' || form.cover_media_type === 'image')) {
        await adminApi.uploadSeminarCover(seminarId, form.cover_file)
      }

      resetForm()
      loadSeminars()
      if (selectedSeminarId === seminarId) loadDetail(seminarId)
    } catch (err) {
      setError(err.message || 'সেভ ব্যর্থ')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (str) => {
    if (!str) return '-'
    const d = new Date(str)
    return d.toLocaleString('bn-BD')
  }

  if (loading && seminars.length === 0) {
    return (
      <div className="virtual-seminar-mgmt">
        <div className="admin-loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="virtual-seminar-mgmt">
      <div className="vs-mgmt-header">
        <h1 className="page-title">Virtual Seminar ম্যানেজমেন্ট</h1>
        <div className="vs-mgmt-actions">
          <button type="button" className="btn-secondary" onClick={() => onTabChange?.('timeline-list')}>
            টাইমলাইন সেট করুন
          </button>
          <button type="button" className="btn-primary" onClick={handleCreate}>
            নতুন সেমিনার
          </button>
        </div>
      </div>

      {error && <div className="vs-mgmt-error">{error}</div>}

      {showForm && (
        <section className="vs-mgmt-card vs-mgmt-form-card">
          <h2>{editingId ? 'সেমিনার সম্পাদনা' : 'নতুন সেমিনার তৈরি'}</h2>
          <form onSubmit={handleSubmit} className="vs-mgmt-form-full">
            <div className="vs-form-group">
              <label>টাইটেল</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="সেমিনারের নাম"
                required
              />
            </div>
            <div className="vs-form-row">
              <div className="vs-form-group">
                <label>শুরুর সময়</label>
                <input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
                  required
                />
              </div>
              <div className="vs-form-group">
                <label>শেষের সময়</label>
                <input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
                />
              </div>
            </div>
            <div className="vs-form-group">
              <label>টাইমলাইন</label>
              <select
                value={form.timeline_id}
                onChange={(e) => setForm((f) => ({ ...f, timeline_id: e.target.value }))}
              >
                <option value="">টাইমলাইন নির্বাচন করুন</option>
                {timelines.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="vs-form-group vs-cover-section">
              <label>কভার মিডিয়া (ঐচ্ছিক)</label>
              <div className="vs-cover-options">
                <label className="vs-cover-radio">
                  <input
                    type="radio"
                    name="cover_type"
                    checked={form.cover_media_type === ''}
                    onChange={() => setForm((f) => ({ ...f, cover_media_type: '', cover_youtube_url: '', cover_file: null }))}
                  />
                  কভার নেই
                </label>
                <label className="vs-cover-radio">
                  <input
                    type="radio"
                    name="cover_type"
                    checked={form.cover_media_type === 'youtube'}
                    onChange={() => setForm((f) => ({ ...f, cover_media_type: 'youtube', cover_file: null }))}
                  />
                  ইউটিউব ভিডিও
                </label>
                <label className="vs-cover-radio">
                  <input
                    type="radio"
                    name="cover_type"
                    checked={form.cover_media_type === 'video'}
                    onChange={() => setForm((f) => ({ ...f, cover_media_type: 'video', cover_youtube_url: '' }))}
                  />
                  ভিডিও আপলোড
                </label>
                <label className="vs-cover-radio">
                  <input
                    type="radio"
                    name="cover_type"
                    checked={form.cover_media_type === 'image'}
                    onChange={() => setForm((f) => ({ ...f, cover_media_type: 'image', cover_youtube_url: '' }))}
                  />
                  ছবি আপলোড
                </label>
              </div>
              {form.cover_media_type === 'youtube' && (
                <input
                  type="url"
                  className="vs-form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.cover_youtube_url}
                  onChange={(e) => setForm((f) => ({ ...f, cover_youtube_url: e.target.value }))}
                  style={{ marginTop: 8 }}
                />
              )}
              {(form.cover_media_type === 'video' || form.cover_media_type === 'image') && (
                <input
                  type="file"
                  accept={form.cover_media_type === 'video' ? 'video/*' : 'image/*'}
                  onChange={(e) => setForm((f) => ({ ...f, cover_file: e.target.files?.[0] || null }))}
                  style={{ marginTop: 8 }}
                />
              )}
            </div>
            <div className="vs-form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>
                বাতিল
              </button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="vs-mgmt-card">
        <h2>সেমিনার তালিকা</h2>
        {seminars.length === 0 ? (
          <p className="vs-mgmt-empty">কোনো সেমিনার নেই। নতুন সেমিনার তৈরি করুন।</p>
        ) : (
          <div className="vs-seminar-list">
            {seminars.map((s) => (
              <div
                key={s.id}
                className={`vs-seminar-card ${selectedSeminarId === s.id ? 'selected' : ''}`}
                onClick={() => loadDetail(s.id)}
                onKeyDown={(e) => e.key === 'Enter' && loadDetail(s.id)}
                role="button"
                tabIndex={0}
              >
                <div className="vs-seminar-card-header">
                  <span className="vs-seminar-title">{s.title}</span>
                  <span className={`vs-status-badge vs-status-${s.status}`}>
                    {STATUS_LABELS[s.status] || s.status}
                  </span>
                </div>
                <div className="vs-seminar-card-meta">
                  <span>{formatDate(s.start_time)}</span>
                  {s.end_time && <span> - {formatDate(s.end_time)}</span>}
                </div>
                {s.timeline_name && (
                  <div className="vs-seminar-card-timeline">টাইমলাইন: {s.timeline_name}</div>
                )}
                <button
                  type="button"
                  className="vs-edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(s)
                  }}
                >
                  সম্পাদনা
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {detail && selectedSeminarId && (
        <section className="vs-mgmt-card">
          <h2>{detail.title} - বিস্তারিত</h2>
          <div className="vs-detail-meta">
            <p>শুরু: {formatDate(detail.start_time)}</p>
            <p>শেষ: {detail.end_time ? formatDate(detail.end_time) : '-'}</p>
            {detail.timeline_name && <p>টাইমলাইন: {detail.timeline_name}</p>}
          </div>
          <div className="vs-mgmt-stats">
            {stats?.status === 'live' && (
              <div className="vs-stat">
                <span className="vs-stat-value">{stats?.viewer_count ?? 0}</span>
                <span className="vs-stat-label">বর্তমানে দেখছেন</span>
              </div>
            )}
            <div className="vs-stat">
              <span className="vs-stat-value">{registrations.length}</span>
              <span className="vs-stat-label">মোট রেজিস্টার্ড</span>
            </div>
          </div>
          <h3>রেজিস্টার্ড ইউজার</h3>
          {registrations.length === 0 ? (
            <p className="vs-mgmt-empty">কেউ এখনো রেজিস্টার করেনি</p>
          ) : (
            <div className="vs-reg-table-wrap">
              <table className="vs-reg-table">
                <thead>
                  <tr>
                    <th>নাম</th>
                    <th>মোবাইল</th>
                    <th>সময়</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.name}</td>
                      <td>{r.phone}</td>
                      <td>{formatDate(r.registered_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default VirtualSeminarManagement
