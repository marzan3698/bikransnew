import { query } from '../config/database.js'

export async function getAllAudio(req, res) {
  try {
    const rows = await query(
      'SELECT id, name, file_path, sort_order, created_at FROM presentation_audio ORDER BY sort_order ASC, id ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Get presentation audio error:', err)
    res.status(500).json({ error: 'অডিও লোড করতে ব্যর্থ' })
  }
}

export async function getAudio(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const [row] = await query('SELECT * FROM presentation_audio WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'অডিও পাওয়া যায়নি' })

    res.json(row)
  } catch (err) {
    console.error('Get audio error:', err)
    res.status(500).json({ error: 'অডিও লোড করতে ব্যর্থ' })
  }
}

export async function createAudio(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'অডিও ফাইল আবশ্যক' })

    const name = (req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'নাম আবশ্যক' })

    const [existing] = await query('SELECT id FROM presentation_audio WHERE name = ?', [name])
    if (existing) return res.status(400).json({ error: 'এই নাম আগে থেকেই আছে, অন্য নাম দিন' })

    const filePath = `/uploads/presentation-audio/${req.file.filename}`
    const [maxOrder] = await query(
      'SELECT COALESCE(MAX(sort_order), 0) as mx FROM presentation_audio'
    )
    const sortOrder = (maxOrder?.mx ?? 0) + 1

    await query(
      'INSERT INTO presentation_audio (name, file_path, sort_order) VALUES (?, ?, ?)',
      [name, filePath, sortOrder]
    )
    const [created] = await query(
      'SELECT * FROM presentation_audio WHERE name = ? ORDER BY id DESC LIMIT 1',
      [name]
    )
    res.status(201).json(created)
  } catch (err) {
    console.error('Create presentation audio error:', err)
    res.status(500).json({ error: err.message || 'অডিও যোগ করতে ব্যর্থ' })
  }
}

export async function updateAudio(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const name = (req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'নাম আবশ্যক' })

    const [existing] = await query(
      'SELECT id FROM presentation_audio WHERE name = ? AND id != ?',
      [name, id]
    )
    if (existing) return res.status(400).json({ error: 'এই নাম আগে থেকেই আছে, অন্য নাম দিন' })

    await query('UPDATE presentation_audio SET name = ? WHERE id = ?', [name, id])
    const [updated] = await query('SELECT * FROM presentation_audio WHERE id = ?', [id])
    if (!updated) return res.status(404).json({ error: 'অডিও পাওয়া যায়নি' })
    res.json(updated)
  } catch (err) {
    console.error('Update presentation audio error:', err)
    res.status(500).json({ error: err.message || 'অডিও আপডেট করতে ব্যর্থ' })
  }
}

export async function deleteAudio(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const result = await query('DELETE FROM presentation_audio WHERE id = ?', [id])
    const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0
    if (affected === 0) return res.status(404).json({ error: 'অডিও পাওয়া যায়নি' })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete presentation audio error:', err)
    res.status(500).json({ error: 'অডিও মুছে ফেলতে ব্যর্থ' })
  }
}

export async function reorderAudio(req, res) {
  try {
    const order = req.body?.order
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order অ্যারেটি প্রয়োজন' })
    }

    for (let i = 0; i < order.length; i++) {
      const id = parseInt(order[i])
      if (id) await query('UPDATE presentation_audio SET sort_order = ? WHERE id = ?', [i, id])
    }

    const rows = await query(
      'SELECT id, name, file_path, sort_order FROM presentation_audio ORDER BY sort_order ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Reorder presentation audio error:', err)
    res.status(500).json({ error: 'অডিও সাজাতে ব্যর্থ' })
  }
}

export async function getPublicAudio(req, res) {
  try {
    const rows = await query(
      'SELECT id, name, file_path, sort_order FROM presentation_audio ORDER BY sort_order ASC, id ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Get public presentation audio error:', err)
    res.status(500).json({ error: 'অডিও লোড করতে ব্যর্থ' })
  }
}
