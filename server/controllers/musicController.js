import { query } from '../config/database.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const AUDIO_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'audio')

function ensureAudioDir() {
  if (!fs.existsSync(AUDIO_UPLOAD_DIR)) {
    fs.mkdirSync(AUDIO_UPLOAD_DIR, { recursive: true })
  }
}

// ----- Admin: list with filters and stats -----
export async function getAdminAudioList(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const search = (req.query.search || '').trim()
    const category = (req.query.category || '').trim()
    const status = req.query.status || ''

    let where = []
    let params = []
    if (search) {
      where.push('(a.title LIKE ? OR a.description LIKE ?)')
      params.push(`%${search}%`, `%${search}%`)
    }
    if (category) {
      where.push('a.category = ?')
      params.push(category)
    }
    if (status && ['active', 'inactive'].includes(status)) {
      where.push('a.status = ?')
      params.push(status)
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const countParams = [...params]
    const listParams = [...params, limit, offset]

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM audio_tracks a ${whereClause}`,
      countParams
    )
    const total = Number(countRow?.total ?? 0)

    const tracks = await query(
      `SELECT a.id, a.title, a.description, a.file_path, a.duration_seconds, a.file_size_bytes, a.mime_type, a.category, a.tags, a.status, a.created_at, a.updated_at,
        (SELECT COUNT(*) FROM audio_play_logs l WHERE l.audio_id = a.id) AS total_plays,
        (SELECT MAX(created_at) FROM audio_play_logs l WHERE l.audio_id = a.id) AS last_played_at
       FROM audio_tracks a
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      listParams
    )

    res.json({
      tracks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Get admin audio list error:', err)
    res.status(500).json({ error: 'Failed to list audio' })
  }
}

// ----- Admin: create (expects req.file from uploadMusic) -----
export async function createAudio(req, res) {
  try {
    ensureAudioDir()
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' })
    }
    const { title, description, category, tags, status } = req.body
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const ext = path.extname(req.file.originalname) || '.mp3'
    const newName = `audio_${Date.now()}${ext}`
    const destPath = path.join(AUDIO_UPLOAD_DIR, newName)
    fs.renameSync(req.file.path, destPath)
    const filePath = `/uploads/audio/${newName}`
    const fileSizeBytes = req.file.size || 0
    const mimeType = req.file.mimetype || null
    const statusVal = status === 'inactive' ? 'inactive' : 'active'
    const tagsVal = tags && String(tags).trim() ? String(tags).trim() : null

    await query(
      `INSERT INTO audio_tracks (title, description, file_path, duration_seconds, file_size_bytes, mime_type, category, tags, status)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
      [title.trim(), description?.trim() || null, filePath, fileSizeBytes, mimeType, category?.trim() || null, tagsVal, statusVal]
    )
    const result = await query('SELECT * FROM audio_tracks ORDER BY id DESC LIMIT 1')
    const row = result[0]
    res.status(201).json(row)
  } catch (err) {
    console.error('Create audio error:', err)
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: 'Failed to create audio' })
  }
}

// ----- Admin: get single with stats -----
export async function getAudio(req, res) {
  try {
    const id = parseInt(req.params.id)
    const [track] = await query('SELECT * FROM audio_tracks WHERE id = ?', [id])
    if (!track) {
      return res.status(404).json({ error: 'Audio not found' })
    }
    const [playsRow] = await query(
      'SELECT COUNT(*) AS total_plays, MAX(created_at) AS last_played_at FROM audio_play_logs WHERE audio_id = ?',
      [id]
    )
    const plays7d = await query(
      'SELECT COUNT(*) AS count FROM audio_play_logs WHERE audio_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
      [id]
    )
    res.json({
      ...track,
      total_plays: Number(playsRow?.total_plays ?? 0),
      last_played_at: playsRow?.last_played_at ?? null,
      plays_last_7_days: Number(plays7d[0]?.count ?? 0),
    })
  } catch (err) {
    console.error('Get audio error:', err)
    res.status(500).json({ error: 'Failed to get audio' })
  }
}

// ----- Admin: update (optional new file) -----
export async function updateAudio(req, res) {
  try {
    const id = parseInt(req.params.id)
    const [existing] = await query('SELECT * FROM audio_tracks WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: 'Audio not found' })
    }

    const { title, description, category, tags, status } = req.body
    let filePath = existing.file_path
    let fileSizeBytes = existing.file_size_bytes
    let mimeType = existing.mime_type

    if (req.file) {
      ensureAudioDir()
      const ext = path.extname(req.file.originalname) || '.mp3'
      const newName = `audio_${Date.now()}${ext}`
      const destPath = path.join(AUDIO_UPLOAD_DIR, newName)
      fs.renameSync(req.file.path, destPath)
      filePath = `/uploads/audio/${newName}`
      fileSizeBytes = req.file.size || 0
      mimeType = req.file.mimetype || null
      // Remove old file
      if (existing.file_path?.startsWith('/uploads/audio/')) {
        const oldPath = path.join(process.cwd(), 'public', existing.file_path)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
    }

    const titleVal = title !== undefined ? title.trim() : existing.title
    const descriptionVal = description !== undefined ? (description?.trim() || null) : existing.description
    const categoryVal = category !== undefined ? (category?.trim() || null) : existing.category
    const tagsVal = tags !== undefined ? (tags?.trim() || null) : existing.tags
    const statusVal = status === 'inactive' ? 'inactive' : (status === 'active' ? 'active' : existing.status)

    await query(
      `UPDATE audio_tracks SET title = ?, description = ?, file_path = ?, file_size_bytes = ?, mime_type = ?, category = ?, tags = ?, status = ? WHERE id = ?`,
      [titleVal, descriptionVal, filePath, fileSizeBytes, mimeType, categoryVal, tagsVal, statusVal, id]
    )
    const [updated] = await query('SELECT * FROM audio_tracks WHERE id = ?', [id])
    res.json(updated)
  } catch (err) {
    console.error('Update audio error:', err)
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: 'Failed to update audio' })
  }
}

// ----- Admin: delete -----
export async function deleteAudio(req, res) {
  try {
    const id = parseInt(req.params.id)
    const [row] = await query('SELECT file_path FROM audio_tracks WHERE id = ?', [id])
    if (!row) {
      return res.status(404).json({ error: 'Audio not found' })
    }
    await query('DELETE FROM audio_tracks WHERE id = ?', [id])
    if (row.file_path?.startsWith('/uploads/audio/')) {
      const filePath = path.join(process.cwd(), 'public', row.file_path)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    res.json({ message: 'Audio deleted' })
  } catch (err) {
    console.error('Delete audio error:', err)
    res.status(500).json({ error: 'Failed to delete audio' })
  }
}

// ----- Public: list active tracks for video editor -----
export async function getPublicAudioList(req, res) {
  try {
    const tracks = await query(
      `SELECT id, title, description, file_path, duration_seconds, file_size_bytes, mime_type, category, tags, status
       FROM audio_tracks WHERE status = 'active' ORDER BY created_at DESC`
    )
    const baseUrl = req.protocol + '://' + req.get('host')
    const list = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      fileUrl: baseUrl + t.file_path,
      duration_seconds: t.duration_seconds,
      file_size_bytes: t.file_size_bytes,
      mime_type: t.mime_type,
      category: t.category,
      tags: t.tags,
      status: t.status,
    }))
    res.json(list)
  } catch (err) {
    console.error('Get public audio list error:', err)
    res.status(500).json({ error: 'Failed to get audio list' })
  }
}

// ----- Public/Editor: log play -----
export async function logAudioPlay(req, res) {
  try {
    const id = parseInt(req.params.id)
    const [track] = await query('SELECT id FROM audio_tracks WHERE id = ? AND status = ?', [id, 'active'])
    if (!track) {
      return res.status(404).json({ error: 'Audio not found' })
    }
    const source = ['editor', 'preview', 'other'].includes(req.body?.source) ? req.body.source : 'other'
    const userId = req.userId || null
    await query(
      'INSERT INTO audio_play_logs (audio_id, user_id, source) VALUES (?, ?, ?)',
      [id, userId, source]
    )
    res.status(201).json({ success: true })
  } catch (err) {
    console.error('Log audio play error:', err)
    res.status(500).json({ error: 'Failed to log play' })
  }
}
