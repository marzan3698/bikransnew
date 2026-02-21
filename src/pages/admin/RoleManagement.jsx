import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import './RoleManagement.css'

function RoleManagement() {
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [byModule, setByModule] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    permission_ids: [],
  })
  const [editingId, setEditingId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [rolesRes, permsRes] = await Promise.all([
        adminApi.getRoles(),
        adminApi.getPermissions(),
      ])
      setRoles(Array.isArray(rolesRes) ? rolesRes : [])
      setPermissions(permsRes?.permissions || [])
      setByModule(permsRes?.byModule || {})
    } catch (err) {
      setError(err.message || 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const slugFromName = (name) =>
    name
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^\w\u0980-\u09FF]+/g, '')

  const handleOpenCreate = () => {
    setFormData({ name: '', slug: '', description: '', permission_ids: [] })
    setModal('create')
    setEditingId(null)
  }

  const handleOpenEdit = (role) => {
    const ids = role.permission_ids || (role.permission_slugs || [])
      .map((s) => (typeof s === 'number' ? s : permissions.find((x) => x.slug === s)?.id))
      .filter(Boolean)
    setFormData({
      name: role.name,
      slug: role.slug,
      description: role.description || '',
      permission_ids: ids,
    })
    setEditingId(role.id)
    setModal('edit')
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    const slug = formData.slug.trim() || slugFromName(formData.name)
    try {
      await adminApi.createRole({
        name: formData.name.trim(),
        slug,
        description: formData.description.trim() || null,
        permission_ids: formData.permission_ids,
      })
      setModal(null)
      loadData()
    } catch (err) {
      setError(err.message || 'Failed to create role')
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingId || !formData.name.trim()) return
    try {
      await adminApi.updateRole(editingId, {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        permission_ids: formData.permission_ids,
      })
      setModal(null)
      loadData()
    } catch (err) {
      setError(err.message || 'Failed to update role')
    }
  }

  const handleDelete = async (id, slug) => {
    if (!window.confirm(`রোল "${slug}" মুছে ফেলতে চান?`)) return
    try {
      await adminApi.deleteRole(id)
      loadData()
    } catch (err) {
      setError(err.message || 'Failed to delete role')
    }
  }

  const togglePermission = (id) => {
    setFormData((prev) => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(id)
        ? prev.permission_ids.filter((p) => p !== id)
        : [...prev.permission_ids, id],
    }))
  }

  const isSystemRole = (slug) => ['admin', 'manager', 'user'].includes(slug)

  return (
    <div className="role-management-page">
      <div className="page-header">
        <h1 className="page-title">রোল ও পারমিশন ম্যানেজমেন্ট</h1>
        <button className="btn-primary" onClick={handleOpenCreate}>
          নতুন রোল তৈরি
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : error ? (
        <div className="admin-error">{error}</div>
      ) : (
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>রোলের নাম</th>
                <th>Slug</th>
                <th>বিবরণ</th>
                <th>পারমিশন সংখ্যা</th>
                <th>কার্যক্রম</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td><code>{r.slug}</code></td>
                  <td>{r.description || '—'}</td>
                  <td>{(r.permission_ids || r.permission_slugs || []).length}</td>
                  <td>
                    <button className="btn-sm" onClick={() => handleOpenEdit(r)}>
                      সম্পাদনা
                    </button>
                    {!isSystemRole(r.slug) && (
                      <button
                        className="btn-sm btn-danger"
                        onClick={() => handleDelete(r.id, r.slug)}
                      >
                        মুছুন
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-role" onClick={(e) => e.stopPropagation()}>
            <h2>{modal === 'create' ? 'নতুন রোল তৈরি' : 'রোল সম্পাদনা'}</h2>
            <form onSubmit={modal === 'create' ? handleCreate : handleUpdate}>
              <label>রোলের নাম *</label>
              <input
                required
                placeholder="যেমন: প্রেজেন্টেশন ম্যানেজার"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: modal === 'create' ? slugFromName(e.target.value) : formData.slug,
                  })
                }
              />
              <label>Slug</label>
              <input
                placeholder="ইংলিশ নাম, যেমন: presentation_manager"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                readOnly={modal === 'edit'}
              />
              <label>বিবরণ</label>
              <input
                placeholder="রোল সম্পর্কে সংক্ষিপ্ত বিবরণ"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <label>পারমিশন নির্বাচন করুন</label>
              <div className="permissions-grid">
                {Object.entries(byModule).map(([module, perms]) => (
                  <div key={module} className="permission-module">
                    <h4>{module}</h4>
                    {perms.map((p) => (
                      <label key={p.id} className="permission-checkbox">
                        <input
                          type="checkbox"
                          checked={formData.permission_ids.includes(p.id)}
                          onChange={() => togglePermission(p.id)}
                        />
                        <span>{p.name}</span>
                      </label>
                    ))}
                  </div>
                ))}
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>
                  বাতিল
                </button>
                <button type="submit" className="btn-primary">
                  {modal === 'create' ? 'তৈরি করুন' : 'আপডেট করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default RoleManagement
