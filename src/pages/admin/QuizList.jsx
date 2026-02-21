import { useState, useEffect } from 'react'
import { adminApi } from '../../services/api'
import QuizAdd from './QuizAdd'
import './QuizList.css'

const OPTION_LABELS = { a: 'ক', b: 'খ', c: 'গ', d: 'ঘ' }

function QuizList({ onTabChange }) {
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingQuiz, setEditingQuiz] = useState(null)

  const loadQuizzes = () => {
    setLoading(true)
    setError(null)
    adminApi
      .getPresentationQuizzes()
      .then((data) => setQuizzes(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'কুইজ লোড ব্যর্থ'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadQuizzes()
  }, [])

  const handleEdit = (quiz) => setEditingQuiz(quiz)

  const handleDelete = async (quiz) => {
    if (!confirm(`"${(quiz.question || '').slice(0, 50)}..." কুইজটি মুছে ফেলতে চান?`)) return
    try {
      await adminApi.deletePresentationQuiz(quiz.id)
      loadQuizzes()
    } catch (err) {
      alert(err.message || 'ডিলিট ব্যর্থ')
    }
  }

  if (editingQuiz) {
    return (
      <QuizAdd
        editingQuiz={editingQuiz}
        onTabChange={(tab) => {
          setEditingQuiz(null)
          if (tab === 'quiz-list') {
            loadQuizzes()
          } else if (onTabChange) {
            onTabChange(tab)
          }
        }}
      />
    )
  }

  const countOptions = (q) => {
    let n = 0
    if (q.option_a) n++
    if (q.option_b) n++
    if (q.option_c) n++
    if (q.option_d) n++
    return n
  }

  if (loading) {
    return (
      <div className="quiz-list-page">
        <div className="admin-loading">লোড হচ্ছে...</div>
      </div>
    )
  }

  return (
    <div className="quiz-list-page">
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">সকল কুইজ</h1>
          <span className="quiz-count">{quizzes.length} টি কুইজ</span>
        </div>
        <button type="button" className="btn-primary" onClick={() => onTabChange?.('quiz-add')}>
          <span className="btn-icon">+</span>
          নতুন কুইজ অ্যাড
        </button>
      </div>

      {error && <div className="quiz-list-error">{error}</div>}

      {quizzes.length === 0 && !error ? (
        <div className="quiz-list-empty">কোনো কুইজ নেই</div>
      ) : (
        <div className="quiz-list-grid">
          {quizzes.map((q) => (
            <div key={q.id} className="quiz-card">
              <div className="quiz-card-body">
                <p className="quiz-question">{q.question}</p>
                <div className="quiz-meta">
                  <span className="quiz-options-count">{countOptions(q)} টি অপশন</span>
                  <span className="quiz-answer">
                    সঠিক: {OPTION_LABELS[(q.answer || 'a').toLowerCase()]}
                  </span>
                </div>
              </div>
              <div className="quiz-card-actions">
                <button type="button" className="btn-edit" onClick={() => handleEdit(q)}>
                  সম্পাদনা
                </button>
                <button type="button" className="btn-delete" onClick={() => handleDelete(q)}>
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

export default QuizList
