import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import PollAdd from './PollAdd'
import './PollList.css'

function PollList({ onTabChange }) {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingPoll, setEditingPoll] = useState(null)

  const loadPolls = () => {
    setLoading(true)
    setError(null)
    adminApi
      .getPolls()
      .then((data) => setPolls(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'পোল লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadPolls()
  }, [])

  const handleEdit = (poll) => setEditingPoll(poll)

  const handleDelete = async (poll) => {
    if (!confirm(`"${(poll.question || '').slice(0, 50)}..." পোলটি মুছে ফেলতে চান?`)) return
    try {
      await adminApi.deletePoll(poll.id)
      loadPolls()
    } catch (err) {
      alert(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  const totalVotes = (poll) =>
    (poll.options || []).reduce((sum, o) => sum + (o.vote_count || 0), 0)

  if (editingPoll) {
    return (
      <PollAdd
        editingPoll={editingPoll}
        onTabChange={(tab) => {
          setEditingPoll(null)
          if (tab === 'poll-list') {
            loadPolls()
          } else if (onTabChange) {
            onTabChange(tab)
          }
        }}
      />
    )
  }

  if (loading) {
    return (
      <div className="poll-list-page">
        <div className="admin-loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="poll-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">সকল পোলিং</h1>
          <span className="poll-count">{polls.length} টি পোল</span>
        </div>
        <button type="button" className="btn-primary" onClick={() => onTabChange?.('poll-add')}>
          <span className="btn-icon">+</span>
          নতুন পোলিং অ্যাড
        </button>
      </div>

      {error && <div className="poll-list-error">{error}</div>}

      {polls.length === 0 && !error ? (
        <div className="poll-list-empty">কোনো পোল নেই</div>
      ) : (
        <div className="poll-list-grid">
          {polls.map((poll) => (
            <div key={poll.id} className="poll-card">
              <div className="poll-card-body">
                <p className="poll-question">{poll.question}</p>
                <div className="poll-options-list">
                  {(poll.options || []).map((opt) => (
                    <div key={opt.id} className="poll-option-row">
                      <span className="poll-option-label">{opt.label}</span>
                      <span className="poll-option-votes">{opt.vote_count || 0} ভোট</span>
                    </div>
                  ))}
                </div>
                <div className="poll-meta">
                  মোট ভোট: {totalVotes(poll)}
                </div>
              </div>
              <div className="poll-card-actions">
                <button type="button" className="btn-edit" onClick={() => handleEdit(poll)}>
                  সম্পাদনা
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(poll)}>
                  মুছুন
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PollList
