import { query } from '../config/database.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { imageSize } from 'image-size'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const FRAME_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'frames')
const REQUIRED_WIDTH = 1080
const REQUIRED_HEIGHT = 1920

function ensureFrameDir() {
  if (!fs.existsSync(FRAME_UPLOAD_DIR)) {
    fs.mkdirSync(FRAME_UPLOAD_DIR, { recursive: true })
  }
}

function validateDimensionsOrThrow(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error(`Invalid file path for image. Use PNG or GIF, exactly ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} pixels.`)
  }
  let buffer
  try {
    buffer = fs.readFileSync(filePath)
  } catch (e) {
    throw new Error(`Could not read image file. Use PNG or GIF, exactly ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} pixels.`)
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error(`Could not read image. Use PNG or GIF, exactly ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} pixels.`)
  }
  let dims
  try {
    dims = imageSize(buffer)
  } catch (e) {
    throw new Error(`Could not read image dimensions. Use PNG or GIF, exactly ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} pixels.`)
  }
  if (!dims || dims.width == null || dims.height == null) {
    throw new Error(`Could not read image size. Use PNG or GIF, exactly ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} pixels.`)
  }
  if (dims.width !== REQUIRED_WIDTH || dims.height !== REQUIRED_HEIGHT) {
    throw new Error(`ছবির সাইজ অবশ্যই ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} পিক্সেল হতে হবে। আপনার ছবি: ${dims.width}×${dims.height}।`)
  }
}

// ----- Admin: list frames -----
export async function getAdminFrameList(req, res) {
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
      where.push('f.name LIKE ?')
      params.push(`%${search}%`)
    }
    if (category) {
      where.push('f.category = ?')
      params.push(category)
    }
    if (status && ['active', 'inactive'].includes(status)) {
      where.push('f.status = ?')
      params.push(status)
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const countParams = [...params]
    const listParams = [...params, limit, offset]

    const [countRow] = await query(
      `SELECT COUNT(*) AS total FROM frames f ${whereClause}`,
      countParams
    )
    const total = Number(countRow?.total ?? 0)

    const frames = await query(
      `SELECT f.id, f.name, f.category, f.file_path, f.file_size_bytes, f.mime_type, f.status, f.created_at, f.updated_at
       FROM frames f
       ${whereClause}
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      listParams
    )

    res.json({
      frames,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Get admin frames error:', err)
    res.status(500).json({ error: 'Failed to list frames' })
  }
}

// ----- Admin: create frame (expects req.file from uploadFrame) -----
export async function createFrame(req, res) {
  try {
    ensureFrameDir()
    if (!req.file) {
      return res.status(400).json({
        error: 'ফ্রেম ইমেজ পাঠানো হয়নি। ফাইল সিলেক্ট করুন (PNG বা GIF, ১০৮০×১৯২০ পিক্সেল)।',
      })
    }
    const { name, category, status } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'ফ্রেমের নাম দিন।' })
    }

    // Validate dimensions on temp file
    try {
      validateDimensionsOrThrow(req.file.path)
    } catch (e) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path)
      }
      return res.status(400).json({ error: e.message || 'Invalid frame dimensions' })
    }

    const ext = path.extname(req.file.originalname) || '.png'
    const newName = `frame_${Date.now()}${ext}`
    const destPath = path.join(FRAME_UPLOAD_DIR, newName)
    fs.renameSync(req.file.path, destPath)
    const filePath = `/uploads/frames/${newName}`
    const fileSizeBytes = req.file.size || 0
    const mimeType = req.file.mimetype || null
    const statusVal = status === 'inactive' ? 'inactive' : 'active'

    await query(
      `INSERT INTO frames (name, category, file_path, file_size_bytes, mime_type, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), category?.trim() || null, filePath, fileSizeBytes, mimeType, statusVal]
    )
    const rows = await query('SELECT * FROM frames ORDER BY id DESC LIMIT 1')
    res.status(201).json(rows[0])
  } catch (err) {
    console.error('Create frame error:', err)
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: 'Failed to create frame' })
  }
}

// ----- Admin: get single frame -----
export async function getFrame(req, res) {
  try {
    const id = parseInt(req.params.id)
    const [frame] = await query('SELECT * FROM frames WHERE id = ?', [id])
    if (!frame) {
      return res.status(404).json({ error: 'Frame not found' })
    }
    res.json(frame)
  } catch (err) {
    console.error('Get frame error:', err)
    res.status(500).json({ error: 'Failed to get frame' })
  }
}

// ----- Admin: update frame -----
export async function updateFrame(req, res) {
  try {
    const id = parseInt(req.params.id)
    const [existing] = await query('SELECT * FROM frames WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: 'Frame not found' })
    }

    const { name, category, status } = req.body
    let filePath = existing.file_path
    let fileSizeBytes = existing.file_size_bytes
    let mimeType = existing.mime_type

    if (req.file) {
      ensureFrameDir()
      // Validate dimensions of new image
      try {
        validateDimensionsOrThrow(req.file.path)
      } catch (e) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path)
        }
        return res.status(400).json({ error: e.message || 'Invalid frame dimensions' })
      }

      const ext = path.extname(req.file.originalname) || '.png'
      const newName = `frame_${Date.now()}${ext}`
      const destPath = path.join(FRAME_UPLOAD_DIR, newName)
      fs.renameSync(req.file.path, destPath)
      filePath = `/uploads/frames/${newName}`
      fileSizeBytes = req.file.size || 0
      mimeType = req.file.mimetype || null

      // delete old file
      if (existing.file_path?.startsWith('/uploads/frames/')) {
        const oldPath = path.join(process.cwd(), 'public', existing.file_path)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
    }

    const nameVal = name !== undefined ? name.trim() : existing.name
    if (!nameVal) {
      return res.status(400).json({ error: 'Name is required' })
    }
    const categoryVal = category !== undefined ? (category?.trim() || null) : existing.category
    const statusVal =
      status === 'inactive' ? 'inactive' : status === 'active' ? 'active' : existing.status

    await query(
      `UPDATE frames SET name = ?, category = ?, file_path = ?, file_size_bytes = ?, mime_type = ?, status = ? WHERE id = ?`,
      [nameVal, categoryVal, filePath, fileSizeBytes, mimeType, statusVal, id]
    )
    const [updated] = await query('SELECT * FROM frames WHERE id = ?', [id])
    res.json(updated)
  } catch (err) {
    console.error('Update frame error:', err)
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: 'Failed to update frame' })
  }
}

// ----- Admin: delete frame -----
export async function deleteFrame(req, res) {
  try {
    const id = parseInt(req.params.id)
    const [row] = await query('SELECT file_path FROM frames WHERE id = ?', [id])
    if (!row) {
      return res.status(404).json({ error: 'Frame not found' })
    }
    await query('DELETE FROM frames WHERE id = ?', [id])
    if (row.file_path?.startsWith('/uploads/frames/')) {
      const fp = path.join(process.cwd(), 'public', row.file_path)
      if (fs.existsSync(fp)) fs.unlinkSync(fp)
    }
    res.json({ message: 'Frame deleted' })
  } catch (err) {
    console.error('Delete frame error:', err)
    res.status(500).json({ error: 'Failed to delete frame' })
  }
}

// ----- Public: list active frames -----
export async function getPublicFrameList(req, res) {
  try {
    const rows = await query(
      `SELECT id, name, category, file_path, file_size_bytes, mime_type, status, created_at
       FROM frames WHERE status = 'active' ORDER BY created_at DESC`
    )
    const baseUrl = req.protocol + '://' + req.get('host')
    const frames = rows.map((f) => ({
      id: f.id,
      name: f.name,
      category: f.category,
      fileUrl: baseUrl + f.file_path,
      file_size_bytes: f.file_size_bytes,
      mime_type: f.mime_type,
      status: f.status,
      created_at: f.created_at,
    }))
    res.json(frames)
  } catch (err) {
    console.error('Get public frames error:', err)
    res.status(500).json({ error: 'Failed to get frames' })
  }
}

