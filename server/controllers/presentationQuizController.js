import { query } from '../config/database.js'

function getOptionValue(quiz, key) {
  const val = quiz?.[key]
  return val != null && String(val).trim() !== '' ? String(val).trim() : null
}

function validateQuiz(data) {
  const question = data?.question?.trim()
  const optionA = getOptionValue(data, 'option_a')
  const optionB = getOptionValue(data, 'option_b')
  const optionC = getOptionValue(data, 'option_c')
  const optionD = getOptionValue(data, 'option_d')
  const answer = (data?.answer || '').toLowerCase()

  if (!question) return { ok: false, error: 'প্রশ্ন আবশ্যক' }
  if (!optionA) return { ok: false, error: 'অপশন ক আবশ্যক' }
  if (!['a', 'b', 'c', 'd'].includes(answer)) return { ok: false, error: 'সঠিক উত্তর সিলেক্ট করুন' }

  const optionMap = { a: optionA, b: optionB, c: optionC, d: optionD }
  if (!optionMap[answer]) return { ok: false, error: 'সঠিক উত্তর অবশ্যই কোনো অপশনের সাথে মিলতে হবে' }

  return {
    ok: true,
    data: { question, option_a: optionA, option_b: optionB, option_c: optionC, option_d: optionD, answer },
  }
}

export async function getPublicQuizzes(req, res) {
  try {
    const rows = await query(
      'SELECT id, question, option_a, option_b, option_c, option_d, answer, sort_order FROM presentation_quizzes ORDER BY sort_order ASC, id ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Get public presentation quizzes error:', err)
    res.status(500).json({ error: 'কুইজ লোড করতে ব্যর্থ' })
  }
}

export async function getAllQuizzes(req, res) {
  try {
    const rows = await query(
      'SELECT id, question, option_a, option_b, option_c, option_d, answer, sort_order, created_at FROM presentation_quizzes ORDER BY sort_order ASC, id ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Get presentation quizzes error:', err)
    res.status(500).json({ error: 'কুইজ লোড করতে ব্যর্থ' })
  }
}

export async function getQuiz(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const [row] = await query('SELECT * FROM presentation_quizzes WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'কুইজ পাওয়া যায়নি' })

    res.json(row)
  } catch (err) {
    console.error('Get quiz error:', err)
    res.status(500).json({ error: 'কুইজ লোড করতে ব্যর্থ' })
  }
}

export async function createQuiz(req, res) {
  try {
    const v = validateQuiz(req.body)
    if (!v.ok) return res.status(400).json({ error: v.error })

    const { question, option_a, option_b, option_c, option_d, answer } = v.data

    const [maxOrder] = await query('SELECT COALESCE(MAX(sort_order), 0) as mx FROM presentation_quizzes')
    const sortOrder = (maxOrder?.mx ?? 0) + 1

    const result = await query(
      'INSERT INTO presentation_quizzes (question, option_a, option_b, option_c, option_d, answer, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [question, option_a, option_b, option_c, option_d, answer, sortOrder]
    )

    const insertId = result?.insertId ?? result?.[0]?.insertId
    const [created] = await query('SELECT * FROM presentation_quizzes WHERE id = ?', [insertId])
    res.status(201).json(created)
  } catch (err) {
    console.error('Create quiz error:', err)
    res.status(500).json({ error: err.message || 'কুইজ যোগ করতে ব্যর্থ' })
  }
}

export async function updateQuiz(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const v = validateQuiz(req.body)
    if (!v.ok) return res.status(400).json({ error: v.error })

    const { question, option_a, option_b, option_c, option_d, answer } = v.data

    await query(
      'UPDATE presentation_quizzes SET question = ?, option_a = ?, option_b = ?, option_c = ?, option_d = ?, answer = ? WHERE id = ?',
      [question, option_a, option_b, option_c, option_d, answer, id]
    )

    const [updated] = await query('SELECT * FROM presentation_quizzes WHERE id = ?', [id])
    if (!updated) return res.status(404).json({ error: 'কুইজ পাওয়া যায়নি' })
    res.json(updated)
  } catch (err) {
    console.error('Update quiz error:', err)
    res.status(500).json({ error: err.message || 'কুইজ আপডেট করতে ব্যর্থ' })
  }
}

export async function deleteQuiz(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const result = await query('DELETE FROM presentation_quizzes WHERE id = ?', [id])
    const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0
    if (affected === 0) return res.status(404).json({ error: 'কুইজ পাওয়া যায়নি' })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete quiz error:', err)
    res.status(500).json({ error: 'কুইজ মুছে ফেলতে ব্যর্থ' })
  }
}

export async function submitQuizAnswer(req, res) {
  try {
    const quizId = parseInt(req.params.id)
    if (!quizId) return res.status(400).json({ error: 'অবৈধ কুইজ ID' })

    const { voterSession, selectedOption } = req.body
    const selected = (selectedOption || '').toLowerCase().trim()
    if (!['a', 'b', 'c', 'd'].includes(selected)) {
      return res.status(400).json({ error: 'সঠিক অপশন সিলেক্ট করুন' })
    }

    let voterIdentifier = null
    if (req.userId) {
      voterIdentifier = `user:${req.userId}`
    } else if (voterSession && String(voterSession).trim()) {
      voterIdentifier = `session:${String(voterSession).trim()}`
    }
    if (!voterIdentifier) {
      return res.status(400).json({ error: 'উত্তর দেওয়ার জন্য লগইন করুন অথবা সেশন প্রয়োজন' })
    }

    const [quiz] = await query(
      'SELECT id, answer FROM presentation_quizzes WHERE id = ?',
      [quizId]
    )
    if (!quiz) return res.status(404).json({ error: 'কুইজ পাওয়া যায়নি' })

    const correctAnswer = (quiz.answer || '').toLowerCase()
    const isCorrect = correctAnswer === selected

    const [existing] = await query(
      'SELECT is_correct FROM quiz_responses WHERE quiz_id = ? AND voter_identifier = ?',
      [quizId, voterIdentifier]
    )
    if (existing) {
      return res.json({
        isCorrect: !!existing.is_correct,
        correctAnswer,
        alreadyAnswered: true,
      })
    }

    await query(
      'INSERT INTO quiz_responses (quiz_id, voter_identifier, selected_option, is_correct) VALUES (?, ?, ?, ?)',
      [quizId, voterIdentifier, selected, isCorrect ? 1 : 0]
    )

    res.json({ isCorrect, correctAnswer })
  } catch (err) {
    console.error('Submit quiz answer error:', err)
    res.status(500).json({ error: err.message || 'উত্তর জমা দেওয়া ব্যর্থ' })
  }
}

export async function getQuizCorrectResponders(req, res) {
  try {
    const quizId = parseInt(req.params.id)
    if (!quizId) return res.status(400).json({ error: 'অবৈধ কুইজ ID' })

    const [quiz] = await query('SELECT id FROM presentation_quizzes WHERE id = ?', [quizId])
    if (!quiz) return res.status(404).json({ error: 'কুইজ পাওয়া যায়নি' })

    const sessionRows = await query(
      `SELECT qr.created_at, COALESCE(r.name, 'অতিথি') as name
       FROM quiz_responses qr
       LEFT JOIN virtual_seminar_registrations r ON r.token = SUBSTRING(qr.voter_identifier, 9)
       WHERE qr.quiz_id = ? AND qr.is_correct = 1 AND qr.voter_identifier LIKE 'session:%'
       ORDER BY qr.created_at ASC`,
      [quizId]
    )

    const userRows = await query(
      `SELECT qr.created_at, COALESCE(u.name, 'অতিথি') as name
       FROM quiz_responses qr
       LEFT JOIN users u ON u.id = CAST(SUBSTRING(qr.voter_identifier, 6) AS UNSIGNED)
       WHERE qr.quiz_id = ? AND qr.is_correct = 1 AND qr.voter_identifier LIKE 'user:%'
       ORDER BY qr.created_at ASC`,
      [quizId]
    )

    const combined = [...sessionRows, ...userRows].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    )
    const result = combined.map((r) => ({ name: r.name || 'অতিথি', created_at: r.created_at }))

    res.json(result)
  } catch (err) {
    console.error('Get quiz correct responders error:', err)
    res.status(500).json({ error: 'সঠিক উত্তরদাতা লোড করতে ব্যর্থ' })
  }
}

export async function reorderQuizzes(req, res) {
  try {
    const order = req.body?.order
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order অ্যারেটি প্রয়োজন' })
    }

    for (let i = 0; i < order.length; i++) {
      const id = parseInt(order[i])
      if (id) await query('UPDATE presentation_quizzes SET sort_order = ? WHERE id = ?', [i, id])
    }

    const rows = await query(
      'SELECT id, question, option_a, option_b, option_c, option_d, answer, sort_order FROM presentation_quizzes ORDER BY sort_order ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Reorder quizzes error:', err)
    res.status(500).json({ error: 'কুইজ সাজাতে ব্যর্থ' })
  }
}
