import { query } from '../config/database.js'

// Enrich frame items with resolved data from presentation tables
async function resolveFrameItems(items) {
  if (!items || items.length === 0) return []
  const result = []
  for (const it of items) {
    let resolved = null
    switch (it.item_type) {
      case 'video': {
        const [row] = await query('SELECT id, name, youtube_url FROM external_videos WHERE id = ?', [
          it.item_ref,
        ])
        resolved = row ? { ...it, data: row } : { ...it, data: null }
        break
      }
      case 'audio': {
        const [row] = await query(
          'SELECT id, name, file_path FROM presentation_audio WHERE id = ?',
          [it.item_ref]
        )
        resolved = row ? { ...it, data: row } : { ...it, data: null }
        break
      }
      case 'poll': {
        const [poll] = await query('SELECT id, question FROM polls WHERE id = ?', [it.item_ref])
        if (poll) {
          const opts = await query(
            'SELECT id, label, sort_order FROM poll_options WHERE poll_id = ? ORDER BY sort_order ASC',
            [poll.id]
          )
          resolved = { ...it, data: { ...poll, options: opts } }
        } else {
          resolved = { ...it, data: null }
        }
        break
      }
      case 'quiz': {
        const [row] = await query(
          'SELECT id, question, option_a, option_b, option_c, option_d, answer FROM presentation_quizzes WHERE id = ?',
          [it.item_ref]
        )
        resolved = row ? { ...it, data: row } : { ...it, data: null }
        break
      }
      case 'asset': {
        let assetType = null
        const [assetRow] = await query(
          'SELECT file_type, mime_type FROM assets WHERE file_path = ? LIMIT 1',
          [it.item_ref]
        )
        if (assetRow) {
          assetType = assetRow.file_type || (assetRow.mime_type?.startsWith('image/') ? 'image' : null)
        }
        if (!assetType && /\.(jpg|jpeg|png|gif|webp|svg)([?#]|$)/i.test(it.item_ref)) {
          assetType = 'image'
        }
        resolved = {
          ...it,
          data: {
            id: it.item_ref,
            url: it.item_ref,
            type: assetType,
          },
        }
        break
      }
      default:
        resolved = { ...it, data: null }
    }
    result.push(resolved)
  }
  return result.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
}

export async function getAllTimelines(req, res) {
  try {
    const rows = await query(
      'SELECT id, name, sort_order, created_at, updated_at FROM timelines ORDER BY sort_order ASC, id ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Get timelines error:', err)
    res.status(500).json({ error: 'টাইমলাইন লোড করতে ব্যর্থ' })
  }
}

export async function getTimeline(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const [tl] = await query('SELECT * FROM timelines WHERE id = ?', [id])
    if (!tl) return res.status(404).json({ error: 'টাইমলাইন পাওয়া যায়নি' })

    const frames = await query(
      'SELECT * FROM timeline_frames WHERE timeline_id = ? ORDER BY sort_order ASC, id ASC',
      [id]
    )

    for (const f of frames) {
      const items = await query(
        'SELECT * FROM timeline_frame_items WHERE frame_id = ? ORDER BY sort_order ASC, id ASC',
        [f.id]
      )
      f.items = await resolveFrameItems(items)
    }

    res.json({ ...tl, frames })
  } catch (err) {
    console.error('Get timeline error:', err)
    res.status(500).json({ error: 'টাইমলাইন লোড করতে ব্যর্থ' })
  }
}

export async function createTimeline(req, res) {
  try {
    const name = (req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'নাম আবশ্যক' })

    const [maxOrder] = await query('SELECT COALESCE(MAX(sort_order), 0) as mx FROM timelines')
    const sortOrder = (maxOrder?.mx ?? 0) + 1

    await query('INSERT INTO timelines (name, sort_order) VALUES (?, ?)', [name, sortOrder])
    const [created] = await query('SELECT * FROM timelines WHERE name = ? ORDER BY id DESC LIMIT 1', [
      name,
    ])
    res.status(201).json(created)
  } catch (err) {
    console.error('Create timeline error:', err)
    res.status(500).json({ error: err.message || 'টাইমলাইন যোগ করতে ব্যর্থ' })
  }
}

export async function updateTimeline(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const name = (req.body?.name || '').trim()
    if (!name) return res.status(400).json({ error: 'নাম আবশ্যক' })

    const [exists] = await query('SELECT id FROM timelines WHERE id = ?', [id])
    if (!exists) return res.status(404).json({ error: 'টাইমলাইন পাওয়া যায়নি' })

    await query('UPDATE timelines SET name = ? WHERE id = ?', [name, id])
    const [updated] = await query('SELECT * FROM timelines WHERE id = ?', [id])
    res.json(updated)
  } catch (err) {
    console.error('Update timeline error:', err)
    res.status(500).json({ error: err.message || 'টাইমলাইন আপডেট করতে ব্যর্থ' })
  }
}

export async function deleteTimeline(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const result = await query('DELETE FROM timelines WHERE id = ?', [id])
    const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0
    if (affected === 0) return res.status(404).json({ error: 'টাইমলাইন পাওয়া যায়নি' })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete timeline error:', err)
    res.status(500).json({ error: 'টাইমলাইন মুছে ফেলতে ব্যর্থ' })
  }
}

export async function addFrame(req, res) {
  try {
    const timelineId = parseInt(req.params.id)
    if (!timelineId) return res.status(400).json({ error: 'অবৈধ টাইমলাইন ID' })

    const [exists] = await query('SELECT id FROM timelines WHERE id = ?', [timelineId])
    if (!exists) return res.status(404).json({ error: 'টাইমলাইন পাওয়া যায়নি' })

    const durationSeconds = parseInt(req.body?.duration_seconds, 10) || 30
    const [maxOrder] = await query(
      'SELECT COALESCE(MAX(sort_order), -1) as mx FROM timeline_frames WHERE timeline_id = ?',
      [timelineId]
    )
    const sortOrder = (maxOrder?.mx ?? -1) + 1

    await query(
      'INSERT INTO timeline_frames (timeline_id, duration_seconds, sort_order) VALUES (?, ?, ?)',
      [timelineId, durationSeconds, sortOrder]
    )
    const [created] = await query(
      'SELECT * FROM timeline_frames WHERE timeline_id = ? ORDER BY id DESC LIMIT 1',
      [timelineId]
    )
    res.status(201).json(created)
  } catch (err) {
    console.error('Add frame error:', err)
    res.status(500).json({ error: err.message || 'ফ্রেম যোগ করতে ব্যর্থ' })
  }
}

export async function updateFrame(req, res) {
  try {
    const timelineId = parseInt(req.params.id)
    const frameId = parseInt(req.params.frameId)
    if (!timelineId || !frameId) return res.status(400).json({ error: 'অবৈধ ID' })

    const [frame] = await query(
      'SELECT * FROM timeline_frames WHERE id = ? AND timeline_id = ?',
      [frameId, timelineId]
    )
    if (!frame) return res.status(404).json({ error: 'ফ্রেম পাওয়া যায়নি' })

    const durationSeconds = parseInt(req.body?.duration_seconds, 10)
    const sortOrder = req.body?.sort_order != null ? parseInt(req.body.sort_order, 10) : undefined

    const updates = []
    const values = []
    if (durationSeconds >= 0) {
      updates.push('duration_seconds = ?')
      values.push(durationSeconds)
    }
    if (sortOrder !== undefined) {
      updates.push('sort_order = ?')
      values.push(sortOrder)
    }
    if (updates.length > 0) {
      values.push(frameId)
      await query(
        `UPDATE timeline_frames SET ${updates.join(', ')} WHERE id = ?`,
        values
      )
    }

    const [updated] = await query('SELECT * FROM timeline_frames WHERE id = ?', [frameId])
    res.json(updated)
  } catch (err) {
    console.error('Update frame error:', err)
    res.status(500).json({ error: err.message || 'ফ্রেম আপডেট করতে ব্যর্থ' })
  }
}

export async function deleteFrame(req, res) {
  try {
    const timelineId = parseInt(req.params.id)
    const frameId = parseInt(req.params.frameId)
    if (!timelineId || !frameId) return res.status(400).json({ error: 'অবৈধ ID' })

    const [frame] = await query(
      'SELECT id FROM timeline_frames WHERE id = ? AND timeline_id = ?',
      [frameId, timelineId]
    )
    if (!frame) return res.status(404).json({ error: 'ফ্রেম পাওয়া যায়নি' })

    await query('DELETE FROM timeline_frames WHERE id = ?', [frameId])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete frame error:', err)
    res.status(500).json({ error: 'ফ্রেম মুছে ফেলতে ব্যর্থ' })
  }
}

export async function addFrameItem(req, res) {
  try {
    const timelineId = parseInt(req.params.id)
    const frameId = parseInt(req.params.frameId)
    if (!timelineId || !frameId) return res.status(400).json({ error: 'অবৈধ ID' })

    const validTypes = ['video', 'audio', 'poll', 'quiz', 'asset']
    const itemType = req.body?.item_type
    const itemRef = String(req.body?.item_ref || '').trim()
    if (!validTypes.includes(itemType) || !itemRef) {
      return res.status(400).json({ error: 'item_type এবং item_ref আবশ্যক' })
    }

    const [frame] = await query(
      'SELECT * FROM timeline_frames WHERE id = ? AND timeline_id = ?',
      [frameId, timelineId]
    )
    if (!frame) return res.status(404).json({ error: 'ফ্রেম পাওয়া যায়নি' })

    const [maxOrder] = await query(
      'SELECT COALESCE(MAX(sort_order), -1) as mx FROM timeline_frame_items WHERE frame_id = ?',
      [frameId]
    )
    const sortOrder = (maxOrder?.mx ?? -1) + 1

    await query(
      'INSERT INTO timeline_frame_items (frame_id, item_type, item_ref, sort_order) VALUES (?, ?, ?, ?)',
      [frameId, itemType, itemRef, sortOrder]
    )
    const [created] = await query(
      'SELECT * FROM timeline_frame_items WHERE frame_id = ? ORDER BY id DESC LIMIT 1',
      [frameId]
    )
    const resolved = await resolveFrameItems([created])
    res.status(201).json({ ...created, data: resolved[0]?.data })
  } catch (err) {
    console.error('Add frame item error:', err)
    res.status(500).json({ error: err.message || 'আইটেম যোগ করতে ব্যর্থ' })
  }
}

export async function updateFrameItem(req, res) {
  try {
    const timelineId = parseInt(req.params.id)
    const frameId = parseInt(req.params.frameId)
    const itemId = parseInt(req.params.itemId)
    if (!timelineId || !frameId || !itemId) return res.status(400).json({ error: 'অবৈধ ID' })

    const [item] = await query(
      `SELECT tfi.* FROM timeline_frame_items tfi
       JOIN timeline_frames tf ON tf.id = tfi.frame_id AND tf.timeline_id = ?
       WHERE tfi.id = ? AND tfi.frame_id = ?`,
      [timelineId, itemId, frameId]
    )
    if (!item) return res.status(404).json({ error: 'আইটেম পাওয়া যায়নি' })

    const sortOrder = req.body?.sort_order != null ? parseInt(req.body.sort_order, 10) : undefined
    if (sortOrder !== undefined) {
      await query('UPDATE timeline_frame_items SET sort_order = ? WHERE id = ?', [
        sortOrder,
        itemId,
      ])
    }

    const [updated] = await query('SELECT * FROM timeline_frame_items WHERE id = ?', [itemId])
    res.json(updated)
  } catch (err) {
    console.error('Update frame item error:', err)
    res.status(500).json({ error: err.message || 'আইটেম আপডেট করতে ব্যর্থ' })
  }
}

export async function deleteFrameItem(req, res) {
  try {
    const timelineId = parseInt(req.params.id)
    const frameId = parseInt(req.params.frameId)
    const itemId = parseInt(req.params.itemId)
    if (!timelineId || !frameId || !itemId) return res.status(400).json({ error: 'অবৈধ ID' })

    const [item] = await query(
      `SELECT tfi.id FROM timeline_frame_items tfi
       JOIN timeline_frames tf ON tf.id = tfi.frame_id AND tf.timeline_id = ?
       WHERE tfi.id = ? AND tfi.frame_id = ?`,
      [timelineId, itemId, frameId]
    )
    if (!item) return res.status(404).json({ error: 'আইটেম পাওয়া যায়নি' })

    await query('DELETE FROM timeline_frame_items WHERE id = ?', [itemId])
    res.json({ success: true })
  } catch (err) {
    console.error('Delete frame item error:', err)
    res.status(500).json({ error: 'আইটেম মুছে ফেলতে ব্যর্থ' })
  }
}

export async function getTimelineDataById(id, origin = '') {
  const [tl] = await query('SELECT id, name, sort_order FROM timelines WHERE id = ?', [id])
  if (!tl) return null
  const frames = await query(
    'SELECT id, duration_seconds, sort_order FROM timeline_frames WHERE timeline_id = ? ORDER BY sort_order ASC, id ASC',
    [id]
  )
  for (const f of frames) {
    const items = await query(
      'SELECT * FROM timeline_frame_items WHERE frame_id = ? ORDER BY sort_order ASC, id ASC',
      [f.id]
    )
    f.items = await resolveFrameItems(items)
    for (const it of f.items) {
      if (it.item_type === 'audio' && it.data?.file_path) {
        it.data.fileUrl = it.data.file_path.startsWith('http')
          ? it.data.file_path
          : `${origin}${it.data.file_path}`
      }
      if (it.item_type === 'video' && it.data?.youtube_url) {
        const match = it.data.youtube_url.match(/(?:v=|\/)([^&\s]+)/)
        it.data.embedId = match ? match[1] : null
      }
    }
  }
  return { ...tl, frames }
}

export async function getPublicTimeline(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })
    const origin = req.protocol + '://' + (req.get('host') || '')
    const data = await getTimelineDataById(id, origin)
    if (!data) return res.status(404).json({ error: 'টাইমলাইন পাওয়া যায়নি' })
    res.json(data)
  } catch (err) {
    console.error('Get public timeline error:', err)
    res.status(500).json({ error: 'টাইমলাইন লোড করতে ব্যর্থ' })
  }
}
