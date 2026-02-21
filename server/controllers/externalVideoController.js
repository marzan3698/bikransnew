import { query } from '../config/database.js'

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : null
}

function normalizeYoutubeUrl(url) {
  const id = extractYouTubeVideoId(url)
  return id ? `https://www.youtube.com/watch?v=${id}` : null
}

export async function getAllVideos(req, res) {
  try {
    const rows = await query(
      'SELECT id, name, youtube_url, sort_order, created_at FROM external_videos ORDER BY sort_order ASC, id ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Get external videos error:', err)
    res.status(500).json({ error: 'ভিডিও লোড করতে ব্যর্থ' })
  }
}

export async function getVideo(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const [row] = await query('SELECT * FROM external_videos WHERE id = ?', [id])
    if (!row) return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' })

    res.json(row)
  } catch (err) {
    console.error('Get video error:', err)
    res.status(500).json({ error: 'ভিডিও লোড করতে ব্যর্থ' })
  }
}

export async function createVideo(req, res) {
  try {
    const { name, youtube_url } = req.body || {}
    const trimmedName = (name || '').trim()
    if (!trimmedName) return res.status(400).json({ error: 'নাম আবশ্যক' })

    const normalizedUrl = normalizeYoutubeUrl(youtube_url)
    if (!normalizedUrl) return res.status(400).json({ error: 'সঠিক YouTube URL দিন' })

    const [existing] = await query('SELECT id FROM external_videos WHERE name = ?', [trimmedName])
    if (existing) return res.status(400).json({ error: 'এই নাম আগে থেকেই আছে, অন্য নাম দিন' })

    const [maxOrder] = await query('SELECT COALESCE(MAX(sort_order), 0) as mx FROM external_videos')
    const sortOrder = (maxOrder?.mx ?? 0) + 1

    await query(
      'INSERT INTO external_videos (name, youtube_url, sort_order) VALUES (?, ?, ?)',
      [trimmedName, normalizedUrl, sortOrder]
    )
    const [created] = await query(
      'SELECT * FROM external_videos WHERE name = ? ORDER BY id DESC LIMIT 1',
      [trimmedName]
    )
    res.status(201).json(created)
  } catch (err) {
    console.error('Create video error:', err)
    res.status(500).json({ error: err.message || 'ভিডিও যোগ করতে ব্যর্থ' })
  }
}

export async function updateVideo(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const { name, youtube_url } = req.body || {}
    const trimmedName = (name || '').trim()
    if (!trimmedName) return res.status(400).json({ error: 'নাম আবশ্যক' })

    const normalizedUrl = normalizeYoutubeUrl(youtube_url)
    if (!normalizedUrl) return res.status(400).json({ error: 'সঠিক YouTube URL দিন' })

    const [existing] = await query(
      'SELECT id FROM external_videos WHERE name = ? AND id != ?',
      [trimmedName, id]
    )
    if (existing) return res.status(400).json({ error: 'এই নাম আগে থেকেই আছে, অন্য নাম দিন' })

    await query(
      'UPDATE external_videos SET name = ?, youtube_url = ? WHERE id = ?',
      [trimmedName, normalizedUrl, id]
    )

    const [updated] = await query('SELECT * FROM external_videos WHERE id = ?', [id])
    if (!updated) return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' })
    res.json(updated)
  } catch (err) {
    console.error('Update video error:', err)
    res.status(500).json({ error: err.message || 'ভিডিও আপডেট করতে ব্যর্থ' })
  }
}

export async function deleteVideo(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'অবৈধ ID' })

    const result = await query('DELETE FROM external_videos WHERE id = ?', [id])
    const affected = result?.affectedRows ?? result?.[0]?.affectedRows ?? 0
    if (affected === 0) return res.status(404).json({ error: 'ভিডিও পাওয়া যায়নি' })

    res.json({ success: true })
  } catch (err) {
    console.error('Delete video error:', err)
    res.status(500).json({ error: 'ভিডিও মুছে ফেলতে ব্যর্থ' })
  }
}

export async function reorderVideos(req, res) {
  try {
    const order = req.body?.order
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'order অ্যারেটি প্রয়োজন' })
    }

    for (let i = 0; i < order.length; i++) {
      const id = parseInt(order[i])
      if (id) await query('UPDATE external_videos SET sort_order = ? WHERE id = ?', [i, id])
    }

    const rows = await query(
      'SELECT id, name, youtube_url, sort_order FROM external_videos ORDER BY sort_order ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Reorder videos error:', err)
    res.status(500).json({ error: 'ভিডিও সাজাতে ব্যর্থ' })
  }
}

export async function getPublicVideos(req, res) {
  try {
    const rows = await query(
      'SELECT id, name, youtube_url, sort_order FROM external_videos ORDER BY sort_order ASC, id ASC'
    )
    res.json(rows)
  } catch (err) {
    console.error('Get public external videos error:', err)
    res.status(500).json({ error: 'ভিডিও লোড করতে ব্যর্থ' })
  }
}
