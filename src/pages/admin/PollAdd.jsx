import { useState } from 'react'
import { adminApi } from '../../services/api'
import './PollAdd.css'

function PollAdd({ onTabChange, editingPoll }) {
  const isEdit = Boolean(editingPoll?.id)
  const initialOptions = editingPoll?.options?.length
    ? editingPoll.options.map((o) => o.label || '')
    : ['']

  const [question, setQuestion] = useState(editingPoll?.question || '')
  const [options, setOptions] = useState(initialOptions)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const addOption = () => setOptions((prev) => [...prev, ''])

  const removeOption = (index) => {
    if (options.length <= 1) return
    setOptions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateOption = (index, value) => {
    setOptions((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!question.trim()) {
      setError('প্রশ্ন লিখুন')
      return
    }
    const labels = options.map((o) => o.trim()).filter(Boolean)
    if (labels.length === 0) {
      setError('কমপক্ষে একটি অপশন যোগ করুন')
      return
    }

    setSubmitting(true)
    try {
      const payload = { question: question.trim(), options: labels.map((label) => ({ label })) }
      if (isEdit) {
        await adminApi.updatePoll(editingPoll.id, payload)
      } else {
        await adminApi.createPoll(payload)
      }
      if (onTabChange) onTabChange('poll-list')
    } catch (err) {
      setError(err.message || 'সংরক্ষণ ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="poll-add-page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'পোল সম্পাদনা' : 'নতুন পোলিং অ্যাড'}</h1>
        <button type="button" className="btn-secondary" onClick={() => onTabChange?.('poll-list')}>
          সকল পোলিং
        </button>
      </div>

      {error && <div className="poll-add-error">{error}</div>}

      <form className="poll-add-form" onSubmit={handleSubmit}>
        <div className="poll-section">
          <div className="form-group">
            <label>প্রশ্ন *</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="পোলের প্রশ্ন লিখুন (যেমন: তোমার ধর্ম কি?)"
              rows="3"
            />
          </div>
          <div className="options-section">
            <div className="options-header">
              <label>অপশনসমূহ *</label>
              <button type="button" className="btn-add-option" onClick={addOption}>
                + অপশন যোগ করুন
              </button>
            </div>
            {options.map((opt, index) => (
              <div key={index} className="option-row">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`অপশন ${index + 1} (যেমন: ইসলাম, হিন্দু, বৌদ্ধ)`}
                />
                <button
                  type="button"
                  className="btn-remove-option"
                  onClick={() => removeOption(index)}
                  disabled={options.length <= 1}
                  title="অপশন মুছুন"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => onTabChange?.('poll-list')}>
            বাতিল
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'সংরক্ষণ হচ্ছে...' : isEdit ? 'আপডেট' : 'যোগ করুন'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default PollAdd
