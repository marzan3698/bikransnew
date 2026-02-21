import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import './UserManagement.css'

function UserManagement({ currentUser }) {
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '', role: 'user' })

  const loadUsers = (page = 1) => {
    setLoading(true)
    const params = { page, limit: 20 }
    if (search) params.search = search
    if (roleFilter) params.role = roleFilter
    adminApi.getUsers(params)
      .then((res) => {
        setUsers(res.users)
        setPagination(res.pagination)
      })
      .catch(setError)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadUsers(1), 300)
    return () => clearTimeout(t)
  }, [search, roleFilter])

  const handleCreate = () => {
    setFormData({ name: '', email: '', phone: '', password: '', role: 'user' })
    setModal('create')
  }

  const handleEdit = (u) => {
    setFormData({ name: u.name, email: u.email, phone: u.phone, status: u.status, id: u.id })
    setModal('edit')
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return
    try {
      await adminApi.deleteUser(id)
      loadUsers(pagination.page)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSubmitCreate = async (e) => {
    e.preventDefault()
    try {
      await adminApi.createUser(formData)
      setModal(null)
      loadUsers()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    try {
      await adminApi.updateUser(formData.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
      })
      setModal(null)
      loadUsers(pagination.page)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleRoleChange = async (id, role) => {
    try {
      await adminApi.updateUserRole(id, role)
      loadUsers(pagination.page)
    } catch (err) {
      alert(err.message)
    }
  }

  const isAdmin = currentUser?.role === 'admin'

  return (
    <div className="user-management">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        {isAdmin && (
          <button className="btn-primary" onClick={handleCreate}>Create User</button>
        )}
      </div>

      <div className="filters">
        <input
          type="search"
          placeholder="Search by name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="filter-input"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="manager">Manager</option>
          <option value="presentation_manager">প্রেজেন্টেশন ম্যানেজার</option>
          <option value="user">User</option>
        </select>
      </div>

      {loading ? (
        <div className="admin-loading">Loading...</div>
      ) : error ? (
        <div className="admin-error">{error.message}</div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="col-login-pin">Login PIN</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.phone}</td>
                    <td>
                      {isAdmin && u.id !== currentUser?.id ? (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="role-select"
                        >
                          <option value="user">user</option>
                          <option value="presentation_manager">প্রেজেন্টেশন ম্যানেজার</option>
                          <option value="manager">manager</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <span className={`badge badge-${u.role}`}>{u.role}</span>
                      )}
                    </td>
                    <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                    <td className="col-login-pin">{u.login_pin ?? '—'}</td>
                    {isAdmin && (
                      <td>
                        <button className="btn-sm" onClick={() => handleEdit(u)}>Edit</button>
                        {u.id !== currentUser?.id && (
                          <button className="btn-sm btn-danger" onClick={() => handleDelete(u.id)}>Delete</button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadUsers(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Create User</h2>
            <form onSubmit={handleSubmitCreate}>
              <input required placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input required type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <input required placeholder="Phone (01XXXXXXXXX)" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <input required type="password" placeholder="Password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
              <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                <option value="user">user</option>
                <option value="presentation_manager">প্রেজেন্টেশন ম্যানেজার</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'edit' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit User</h2>
            <form onSubmit={handleSubmitEdit}>
              <input required placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input required type="email" placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <input required placeholder="Phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
                <option value="suspended">suspended</option>
              </select>
              <div className="modal-actions">
                <button type="button" onClick={() => setModal(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
