import './AdminPlaceholder.css'

function AdminPlaceholder({ title, description }) {
  return (
    <div className="admin-placeholder">
      <h1 className="page-title">{title}</h1>
      <p className="admin-placeholder-desc">{description || 'এই সেকশনের কাজ শীঘ্রই যোগ করা হবে।'}</p>
    </div>
  )
}

export default AdminPlaceholder
