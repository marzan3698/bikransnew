import { query } from '../config/database.js'

function inferType(path, mimeType, fileType) {
  if (fileType) {
    const t = String(fileType).toLowerCase()
    if (['image', 'video', 'audio', 'document'].includes(t)) return t
  }
  if (mimeType) {
    const m = String(mimeType).toLowerCase()
    if (m.startsWith('image/')) return 'image'
    if (m.startsWith('video/')) return 'video'
    if (m.startsWith('audio/')) return 'audio'
    if (m.includes('pdf') || m.includes('document') || m.includes('word')) return 'document'
  }
  const ext = (path || '').split('.').pop()?.toLowerCase()
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const videoExts = ['mp4', 'webm', 'mov', 'avi']
  const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'webm']
  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'
  if (audioExts.includes(ext)) return 'audio'
  return 'document'
}

export async function getAllMedia(req, res) {
  try {
    const items = []
    const seen = new Set()
    let idSeq = 0

    const add = (path, source, name, type, size) => {
      if (!path || seen.has(path)) return
      seen.add(path)
      const url = path.startsWith('http') ? path : path.startsWith('/') ? path : `/${path}`
      items.push({
        id: `asset-${++idSeq}`,
        url,
        path: url,
        type: type || inferType(path),
        source,
        name: name || path.split('/').pop() || 'ফাইল',
        size: size || null,
      })
    }

    const sliders = await query('SELECT id, image, title FROM sliders')
    for (const s of sliders) {
      if (s.image) add(s.image, 'slider', s.title || s.image.split('/').pop(), 'image')
    }

    const frames = await query('SELECT id, file_path, name, mime_type, file_size_bytes FROM frames')
    for (const f of frames) {
      if (f.file_path) add(f.file_path, 'frame', f.name, inferType(f.file_path, f.mime_type), f.file_size_bytes)
    }

    const audioTracks = await query('SELECT id, file_path, title, mime_type, file_size_bytes FROM audio_tracks')
    for (const a of audioTracks) {
      if (a.file_path) add(a.file_path, 'audio', a.title, 'audio', a.file_size_bytes)
    }

    const taskAttachments = await query(
      'SELECT id, file_path, file_name, file_type, file_size FROM task_attachments'
    )
    for (const t of taskAttachments) {
      if (t.file_path) add(t.file_path, 'task', t.file_name, t.file_type, t.file_size)
    }

    const assets = await query('SELECT id, file_path, file_name, mime_type, file_size FROM assets')
    for (const a of assets) {
      if (a.file_path) {
        const assetType = inferType(a.file_path, a.mime_type)
        add(a.file_path, 'asset', a.file_name, assetType, a.file_size)
      }
    }

    const [headerRow] = await query('SELECT logo_image FROM header_settings ORDER BY id LIMIT 1')
    if (headerRow?.logo_image && headerRow.logo_image.startsWith('/uploads/')) {
      add(headerRow.logo_image, 'header', 'লোগো', 'image')
    }

    const landingServices = await query('SELECT id, icon, title, is_image FROM landing_services')
    for (const ls of landingServices) {
      if (ls.is_image && ls.icon && ls.icon.startsWith('/uploads/')) {
        add(ls.icon, 'landing', ls.title, 'image')
      }
    }

    const typeFilter = req.query.type || ''
    const sourceFilter = req.query.source || ''
    let filtered = items
    if (typeFilter) filtered = filtered.filter((i) => i.type === typeFilter)
    if (sourceFilter) filtered = filtered.filter((i) => i.source === sourceFilter)

    filtered.sort((a, b) => (b.name || '').localeCompare(a.name || ''))

    res.json({ items: filtered })
  } catch (err) {
    console.error('Get asset gallery error:', err)
    res.status(500).json({ error: 'Failed to get media' })
  }
}

export async function uploadAsset(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'কোনো ফাইল পাওয়া যায়নি' })
    }
    if (!req.userId) {
      return res.status(401).json({ error: 'লগইন প্রয়োজন' })
    }

    const filePath = `/uploads/assets/${req.file.filename}`
    const fileType = inferType(req.file.path, req.file.mimetype)

    await query(
      'INSERT INTO assets (file_path, file_name, mime_type, file_size, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)',
      [
        filePath,
        req.file.originalname || req.file.filename,
        req.file.mimetype || null,
        req.file.size || 0,
        fileType,
        req.userId,
      ]
    )

    res.json({
      id: req.file.filename,
      url: filePath,
      name: req.file.originalname || req.file.filename,
      type: fileType,
      size: req.file.size,
    })
  } catch (err) {
    console.error('Upload asset error:', err)
    res.status(500).json({ error: err.message || 'আপলোড ব্যর্থ' })
  }
}
