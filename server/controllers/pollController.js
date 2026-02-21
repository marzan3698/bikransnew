import { query } from '../config/database.js'

async function getPollsWithOptions(includeVoteCounts = false) {
  const polls = await query(
    'SELECT id, question, sort_order, created_at FROM polls ORDER BY sort_order ASC, id ASC'
  )

  for (const poll of polls) {
    const options = await query(
      'SELECT id, label, sort_order FROM poll_options WHERE poll_id = ? ORDER BY sort_order ASC, id ASC',
      [poll.id]
    )

    if (includeVoteCounts) {
      const voteCounts = await query(
        'SELECT option_id, COUNT(*) as cnt FROM poll_votes WHERE poll_id = ? GROUP BY option_id',
        [poll.id]
      )
      const countMap = Object.fromEntries(voteCounts.map((v) => [v.option_id, v.cnt]))
      poll.options = options.map((o) => ({
        ...o,
        vote_count: countMap[o.id] || 0,
      }))
    } else {
      poll.options = options
    }
  }

  return polls
}

export async function getAllPolls(req, res) {
  try {
    const polls = await getPollsWithOptions(true)
    res.json(polls)
  } catch (err) {
    console.error('Get polls error:', err)
    res.status(500).json({ error: 'পোল লোড করতে ব্যর্থ' })
  }
}

export async function getPoll(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const [poll] = await query('SELECT * FROM polls WHERE id = ?', [id])
    if (!poll) return res.status(404).json({ error: 'পোল পাওয়া যায়নি' })

    const options = await query(
      'SELECT id, label, sort_order FROM poll_options WHERE poll_id = ? ORDER BY sort_order ASC',
      [id]
    )
    const voteCounts = await query(
      'SELECT option_id, COUNT(*) as cnt FROM poll_votes WHERE poll_id = ? GROUP BY option_id',
      [id]
    )
    const countMap = Object.fromEntries(voteCounts.map((v) => [v.option_id, v.cnt]))
    poll.options = options.map((o) => ({ ...o, vote_count: countMap[o.id] || 0 }))

    res.json(poll)
  } catch (err) {
    console.error('Get poll error:', err)
    res.status(500).json({ error: 'পোল লোড করতে ব্যর্থ' })
  }
}

export async function createPoll(req, res) {
  try {
    const { question, options } = req.body
    const q = (question || '').trim()
    const opts = Array.isArray(options) ? options : []

    if (!q) return res.status(400).json({ error: 'প্রশ্ন আবশ্যক' })
    const labels = opts.map((o) => (o?.label || '').trim()).filter(Boolean)
    if (labels.length === 0) return res.status(400).json({ error: 'কমপক্ষে একটি অপশন আবশ্যক' })

    const [maxOrder] = await query('SELECT COALESCE(MAX(sort_order), 0) as mx FROM polls')
    const sortOrder = (maxOrder?.mx ?? 0) + 1

    const result = await query(
      'INSERT INTO polls (question, sort_order) VALUES (?, ?)',
      [q, sortOrder]
    )
    const pollId = result?.insertId ?? result?.[0]?.insertId

    for (let i = 0; i < labels.length; i++) {
      await query(
        'INSERT INTO poll_options (poll_id, label, sort_order) VALUES (?, ?, ?)',
        [pollId, labels[i], i]
      )
    }

    const [created] = await query('SELECT * FROM polls WHERE id = ?', [pollId])
    created.options = labels.map((l, i) => ({ label: l, sort_order: i }))
    res.status(201).json(created)
  } catch (err) {
    console.error('Create poll error:', err)
    res.status(500).json({ error: err.message || 'পোল যোগ করতে ব্যর্থ' })
  }
}

export async function updatePoll(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const { question, options } = req.body
    const q = (question || '').trim()
    const opts = Array.isArray(options) ? options : []

    if (!q) return res.status(400).json({ error: 'প্রশ্ন আবশ্যক' })
    const labels = opts.map((o) => (o?.label || '').trim()).filter(Boolean)
    if (labels.length === 0) return res.status(400).json({ error: 'কমপক্ষে একটি অপশন আবশ্যক' })

    await query('UPDATE polls SET question = ? WHERE id = ?', [q, id])
    await query('DELETE FROM poll_options WHERE poll_id = ?', [id])

    for (let i = 0; i < labels.length; i++) {
      await query(
        'INSERT INTO poll_options (poll_id, label, sort_order) VALUES (?, ?, ?)',
        [id, labels[i], i]
      )
    }

    const [updated] = await query('SELECT * FROM polls WHERE id = ?', [id])
    const newOpts = await query(
      'SELECT id, label, sort_order FROM poll_options WHERE poll_id = ? ORDER BY sort_order',
      [id]
    )
    updated.options = newOpts
    res.json(updated)
  } catch (err) {
    console.error('Update poll error:', err)
    res.status(500).json({ error: err.message || 'পোল আপডেট করতে ব্যর্থ' })
  }
}

export async function deletePoll(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const result = await query('DELETE FROM polls WHERE id = ?', [id])
    const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0
    if (affected === 0) return res.status(404).json({ error: 'পোল পাওয়া যায়নি' })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete poll error:', err)
    res.status(500).json({ error: 'পোল মুছে ফেলতে ব্যর্থ' })
  }
}

export async function reorderPolls(req, res) {
  try {
    const order = req.body?.order
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order অ্যারেটি প্রয়োজন' })
    }

    for (let i = 0; i < order.length; i++) {
      const id = parseInt(order[i])
      if (id) await query('UPDATE polls SET sort_order = ? WHERE id = ?', [i, id])
    }

    const polls = await getPollsWithOptions(true)
    res.json(polls)
  } catch (err) {
    console.error('Reorder polls error:', err)
    res.status(500).json({ error: 'পোল সাজাতে ব্যর্থ' })
  }
}

export async function getPublicPolls(req, res) {
  try {
    const polls = await getPollsWithOptions(true)
    res.json(polls)
  } catch (err) {
    console.error('Get public polls error:', err)
    res.status(500).json({ error: 'পোল লোড করতে ব্যর্থ' })
  }
}

export async function votePoll(req, res) {
  try {
    const pollId = parseInt(req.params.id)
    if (!pollId) return res.status(400).json({ error: 'অবৈধ পোল ID' })

    const { optionId, voterSession } = req.body
    const optionIdNum = parseInt(optionId)
    if (!optionIdNum) return res.status(400).json({ error: 'অপশন সিলেক্ট করুন' })

    let voterIdentifier = null
    if (req.userId) {
      voterIdentifier = `user:${req.userId}`
    } else if (voterSession && String(voterSession).trim()) {
      voterIdentifier = `session:${String(voterSession).trim()}`
    }
    if (!voterIdentifier) {
      return res.status(400).json({ error: 'ভোট দেওয়ার জন্য লগইন করুন অথবা সেশন প্রয়োজন' })
    }

    const [poll] = await query('SELECT id FROM polls WHERE id = ?', [pollId])
    if (!poll) return res.status(404).json({ error: 'পোল পাওয়া যায়নি' })

    const [option] = await query(
      'SELECT id FROM poll_options WHERE id = ? AND poll_id = ?',
      [optionIdNum, pollId]
    )
    if (!option) return res.status(400).json({ error: 'অবৈধ অপশন' })

    const [existing] = await query(
      'SELECT id FROM poll_votes WHERE poll_id = ? AND voter_identifier = ?',
      [pollId, voterIdentifier]
    )
    if (existing) {
      return res.status(409).json({ error: 'আপনি ইতিমধ্যে ভোট দিয়েছেন' })
    }

    await query(
      'INSERT INTO poll_votes (poll_id, option_id, voter_identifier) VALUES (?, ?, ?)',
      [pollId, optionIdNum, voterIdentifier]
    )

    const polls = await getPollsWithOptions(true)
    const updated = polls.find((p) => p.id === pollId)
    res.json(updated || { success: true })
  } catch (err) {
    console.error('Vote poll error:', err)
    res.status(500).json({ error: err.message || 'ভোট দেওয়া ব্যর্থ' })
  }
}
