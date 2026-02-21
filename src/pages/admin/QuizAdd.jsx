import { useState } from 'react'
import { adminApi } from '../../services/api'
import './QuizAdd.css'

const OPTION_LABELS = { a: 'ক', b: 'খ', c: 'গ', d: 'ঘ' }

function QuizAdd({ onTabChange, editingQuiz }) {
  const isEdit = Boolean(editingQuiz?.id)
  const [formData, setFormData] = useState({
    question: editingQuiz?.question || '',
    option_a: editingQuiz?.option_a || '',
    option_b: editingQuiz?.option_b || '',
    option_c: editingQuiz?.option_c || '',
    option_d: editingQuiz?.option_d || '',
    answer: (editingQuiz?.answer || 'a').toLowerCase(),
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      if (['option_b', 'option_c', 'option_d'].includes(name) && prev.answer === name.replace('option_', '')) {
        if (!value?.trim()) next.answer = 'a'
      }
      return next
    })
  }

  const getAvailableAnswerOptions = () => {
    const opts = []
    if (formData.option_a?.trim()) opts.push({ value: 'a', label: OPTION_LABELS.a })
    if (formData.option_b?.trim()) opts.push({ value: 'b', label: OPTION_LABELS.b })
    if (formData.option_c?.trim()) opts.push({ value: 'c', label: OPTION_LABELS.c })
    if (formData.option_d?.trim()) opts.push({ value: 'd', label: OPTION_LABELS.d })
    return opts
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!formData.question?.trim()) {
      setError('প্রশ্ন লিখুন')
      return
    }
    if (!formData.option_a?.trim()) {
      setError('অপশন ক আবশ্যক')
      return
    }
    const available = getAvailableAnswerOptions()
    if (available.length === 0) return
    const answerValid = available.some((o) => o.value === formData.answer)
    if (!answerValid) {
      setError('সঠিক উত্তর সিলেক্ট করুন')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        question: formData.question.trim(),
        option_a: formData.option_a.trim(),
        option_b: formData.option_b?.trim() || null,
        option_c: formData.option_c?.trim() || null,
        option_d: formData.option_d?.trim() || null,
        answer: effectiveAnswer,
      }
      if (isEdit) {
        await adminApi.updatePresentationQuiz(editingQuiz.id, payload)
      } else {
        await adminApi.createPresentationQuiz(payload)
      }
      if (onTabChange) onTabChange('quiz-list')
    } catch (err) {
      setError(err.message || 'সংরক্ষণ ব্যর্থ')
    } finally {
      setSubmitting(false)
    }
  }

  const availableAnswers = getAvailableAnswerOptions()
  const effectiveAnswer = availableAnswers.some((o) => o.value === formData.answer)
    ? formData.answer
    : availableAnswers[0]?.value || 'a'

  return (
    <div className="quiz-add-page">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'কুইজ সম্পাদনা' : 'নতুন কুইজ অ্যাড'}</h1>
        <button type="button" className="btn-secondary" onClick={() => onTabChange?.('quiz-list')}>
          সকল কুইজ
        </button>
      </div>

      {error && <div className="quiz-add-error">{error}</div>}

      <form className="quiz-add-form" onSubmit={handleSubmit}>
        <div className="mcq-section">
          <div className="form-group">
            <label>প্রশ্ন *</label>
            <textarea
              name="question"
              value={formData.question}
              onChange={handleChange}
              placeholder="কুইজের প্রশ্ন লিখুন"
              rows="3"
            />
          </div>
          <div className="options-grid">
            <div className="form-group">
              <label>অপশন ক *</label>
              <input
                type="text"
                name="option_a"
                value={formData.option_a}
                onChange={handleChange}
                placeholder="অপশন ক"
              />
            </div>
            <div className="form-group">
              <label>অপশন খ (ঐচ্ছিক)</label>
              <input
                type="text"
                name="option_b"
                value={formData.option_b}
                onChange={handleChange}
                placeholder="অপশন খ"
              />
            </div>
            <div className="form-group">
              <label>অপশন গ (ঐচ্ছিক)</label>
              <input
                type="text"
                name="option_c"
                value={formData.option_c}
                onChange={handleChange}
                placeholder="অপশন গ"
              />
            </div>
            <div className="form-group">
              <label>অপশন ঘ (ঐচ্ছিক)</label>
              <input
                type="text"
                name="option_d"
                value={formData.option_d}
                onChange={handleChange}
                placeholder="অপশন ঘ"
              />
            </div>
          </div>
          <div className="form-group answer-select">
            <label>সঠিক উত্তর *</label>
            <select name="answer" value={effectiveAnswer} onChange={handleChange}>
              {availableAnswers.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => onTabChange?.('quiz-list')}>
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

export default QuizAdd
