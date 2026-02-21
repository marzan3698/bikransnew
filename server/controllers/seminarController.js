import { query } from '../config/database.js'
import crypto from 'crypto'

/** Bangladesh mobile: 01[3-9]XXXXXXXX */
const BD_PHONE_REGEX = /^(?:\+88)?01[3-9]\d{8}$/

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null
  const cleaned = phone.replace(/\s/g, '')
  const match = cleaned.match(BD_PHONE_REGEX)
  if (!match) return null
  return cleaned.startsWith('+88') ? '0' + cleaned.slice(3) : cleaned
}

function getTokenFromRequest(req) {
  return req.query?.token || req.headers?.authorization?.replace(/^Bearer\s+/i, '') || null
}

function toMysqlDatetime(isoStr) {
  if (!isoStr || typeof isoStr !== 'string') return null
  const d = new Date(isoStr)
  if (Number.isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}:${s}`
}

function getSeminarStatus(sem) {
  const now = new Date()
  const start = new Date(sem.start_time)
  const end = sem.end_time ? new Date(sem.end_time) : null
  if (start > now) return 'upcoming'
  if (end && end < now) return 'ended'
  return 'live'
}

function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : null
}

async function getActiveSeminar() {
  const rows = await query(`
    SELECT id, title, start_time, end_time, timeline_id
    FROM seminars
    WHERE start_time <= NOW() AND (end_time IS NULL OR end_time >= NOW())
    ORDER BY start_time DESC
    LIMIT 1
  `)
  return rows[0] ?? null
}

async function getNextUpcomingSeminar() {
  const rows = await query(`
    SELECT id, title, start_time, end_time, timeline_id
    FROM seminars
    WHERE start_time > NOW()
    ORDER BY start_time ASC
    LIMIT 1
  `)
  return rows[0] ?? null
}

async function getSeminarById(id) {
  if (!id) return null
  const [row] = await query(
    'SELECT id, title, start_time, end_time, timeline_id FROM seminars WHERE id = ?',
    [id]
  )
  return row ?? null
}

export async function getPublicSeminars(req, res) {
  try {
    const rows = await query(`
      SELECT id, title, start_time, end_time, cover_media_type, cover_media_value
      FROM seminars
      WHERE (start_time <= NOW() AND (end_time IS NULL OR end_time >= NOW()))
         OR start_time > NOW()
      ORDER BY start_time ASC
    `)
    const now = new Date()
    const baseUrl = req.protocol + '://' + (req.get('host') || '')
    const seminars = rows.map((r) => {
      const status = getSeminarStatus(r)
      let coverMediaType = r.cover_media_type || null
      let coverMediaValue = r.cover_media_value || null
      if (coverMediaValue && (coverMediaType === 'video' || coverMediaType === 'image')) {
        const path = coverMediaValue.startsWith('/') ? coverMediaValue : '/' + coverMediaValue
        coverMediaValue = baseUrl + path
      }
      return {
        id: r.id,
        title: r.title,
        start_time: new Date(r.start_time).toISOString(),
        end_time: r.end_time ? new Date(r.end_time).toISOString() : null,
        status,
        cover_media_type: coverMediaType,
        cover_media_value: coverMediaValue,
      }
    })
    res.json(seminars)
  } catch (err) {
    console.error('Get public seminars error:', err)
    res.status(500).json({ error: 'Failed to get seminars' })
  }
}

export async function getSeminarStatusPublic(req, res) {
  try {
    const now = Date.now()
    const token = getTokenFromRequest(req)
    const seminarId = req.query?.seminar ? parseInt(req.query.seminar, 10) : null

    let seminar = null
    if (seminarId && !Number.isNaN(seminarId)) {
      seminar = await getSeminarById(seminarId)
      if (seminar) {
        const status = getSeminarStatus(seminar)
        if (status === 'ended') seminar = null
      }
    }
    if (!seminar) {
      const active = await getActiveSeminar()
      const upcoming = await getNextUpcomingSeminar()
      seminar = active || upcoming
    }
    if (!seminar) {
      return res.json({
        seminar: null,
        startTime: null,
        canAccess: false,
        countdownSeconds: null,
        needsRegistration: false,
      })
    }

    const startTime = new Date(seminar.start_time).toISOString()
    const startMs = new Date(seminar.start_time).getTime()
    const endMs = seminar.end_time ? new Date(seminar.end_time).getTime() : null

    if (token) {
      const [reg] = await query(
        'SELECT id, seminar_id FROM virtual_seminar_registrations WHERE token = ?',
        [token]
      )
      if (reg && reg.seminar_id === seminar.id) {
        const inWindow = startMs <= now && (!endMs || endMs >= now)
        if (inWindow) {
          return res.json({
            seminar: {
              id: seminar.id,
              title: seminar.title,
              startTime,
              endTime: seminar.end_time ? new Date(seminar.end_time).toISOString() : null,
            },
            startTime,
            canAccess: true,
            countdownSeconds: 0,
            needsRegistration: false,
          })
        }
      }
    }

    if (startMs <= now && (!endMs || endMs >= now)) {
      return res.json({
        seminar: {
          id: seminar.id,
          title: seminar.title,
          startTime,
          endTime: seminar.end_time ? new Date(seminar.end_time).toISOString() : null,
        },
        startTime,
        canAccess: false,
        countdownSeconds: 0,
        needsRegistration: true,
      })
    }

    const countdownMs = new Date(seminar.start_time).getTime() - now
    const countdownSeconds = Math.max(0, Math.floor(countdownMs / 1000))

    return res.json({
      seminar: {
        id: seminar.id,
        title: seminar.title,
        startTime: new Date(seminar.start_time).toISOString(),
        endTime: seminar.end_time ? new Date(seminar.end_time).toISOString() : null,
      },
      startTime: new Date(seminar.start_time).toISOString(),
      canAccess: false,
      countdownSeconds,
      needsRegistration: false,
    })
  } catch (err) {
    console.error('Get seminar status error:', err)
    res.status(500).json({ error: 'স্ট্যাটাস লোড করতে ব্যর্থ' })
  }
}

export async function registerForSeminar(req, res) {
  try {
    const { name, phone } = req.body || {}
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'নাম প্রয়োজন' })
    }
    const trimmedName = name.trim()
    if (!trimmedName) return res.status(400).json({ error: 'নাম প্রয়োজন' })

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) {
      return res.status(400).json({
        error: 'বৈধ বাংলাদেশী মোবাইল নম্বর দিন (উদাহরণ: ০১৭১২৩৪৫৬৭৮)',
      })
    }

    const seminarId = req.body?.seminar_id ? parseInt(req.body.seminar_id, 10) : null
    let seminar = null
    if (seminarId && !Number.isNaN(seminarId)) {
      seminar = await getSeminarById(seminarId)
      if (seminar) {
        const status = getSeminarStatus(seminar)
        if (status === 'ended') seminar = null
      }
    }
    if (!seminar) seminar = await getActiveSeminar()
    if (!seminar) {
      return res.status(400).json({ error: 'এখন কোনো সেমিনার চলছে না' })
    }

    const token = crypto.randomUUID()
    await query(
      'INSERT INTO virtual_seminar_registrations (name, phone, token, seminar_id) VALUES (?, ?, ?, ?)',
      [trimmedName, normalizedPhone, token, seminar.id]
    )

    res.json({ token })
  } catch (err) {
    console.error('Register for seminar error:', err)
    res.status(500).json({ error: 'রেজিস্ট্রেশন ব্যর্থ' })
  }
}

export async function getAllSeminars(req, res) {
  try {
    const rows = await query(
      `SELECT s.id, s.title, s.start_time, s.end_time, s.timeline_id, s.cover_media_type, s.cover_media_value, t.name as timeline_name
       FROM seminars s
       LEFT JOIN timelines t ON s.timeline_id = t.id
       ORDER BY s.start_time DESC`
    )
    const now = new Date()
    const seminars = rows.map((r) => {
      const status = getSeminarStatus(r)
      return {
        id: r.id,
        title: r.title,
        start_time: r.start_time ? new Date(r.start_time).toISOString() : null,
        end_time: r.end_time ? new Date(r.end_time).toISOString() : null,
        timeline_id: r.timeline_id,
        timeline_name: r.timeline_name,
        status,
        cover_media_type: r.cover_media_type || null,
        cover_media_value: r.cover_media_value || null,
      }
    })
    res.json(seminars)
  } catch (err) {
    console.error('Get seminars error:', err)
    res.status(500).json({ error: 'Failed to get seminars' })
  }
}

export async function getSeminar(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid ID' })

    const [row] = await query(
      `SELECT s.*, t.name as timeline_name FROM seminars s
       LEFT JOIN timelines t ON s.timeline_id = t.id
       WHERE s.id = ?`,
      [id]
    )
    if (!row) return res.status(404).json({ error: 'সেমিনার পাওয়া যায়নি' })

    const status = getSeminarStatus(row)
    const regCount = await query(
      'SELECT COUNT(*) as c FROM virtual_seminar_registrations WHERE seminar_id = ?',
      [id]
    )

    res.json({
      id: row.id,
      title: row.title,
      start_time: new Date(row.start_time).toISOString(),
      end_time: row.end_time ? new Date(row.end_time).toISOString() : null,
      timeline_id: row.timeline_id,
      timeline_name: row.timeline_name,
      status,
      registration_count: regCount[0]?.c ?? 0,
      cover_media_type: row.cover_media_type || null,
      cover_media_value: row.cover_media_value || null,
    })
  } catch (err) {
    console.error('Get seminar error:', err)
    res.status(500).json({ error: 'Failed to get seminar' })
  }
}

export async function createSeminar(req, res) {
  try {
    const { title, start_time, end_time, timeline_id, cover_media_type, cover_media_value } = req.body || {}
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ error: 'টাইটেল প্রয়োজন' })
    }
    if (!start_time) return res.status(400).json({ error: 'শুরুর সময় প্রয়োজন' })

    const startVal = toMysqlDatetime(start_time)
    if (!startVal) return res.status(400).json({ error: 'অবৈধ শুরুর সময়' })

    const endVal = end_time ? toMysqlDatetime(end_time) : null
    const tid = timeline_id == null || timeline_id === '' ? null : parseInt(timeline_id, 10)
    const timelineVal = tid != null && !Number.isNaN(tid) ? tid : null

    let coverType = null
    let coverValue = null
    if (cover_media_type === 'youtube' && cover_media_value) {
      const ytId = extractYouTubeId(cover_media_value)
      if (ytId) {
        coverType = 'youtube'
        coverValue = ytId
      }
    }

    const result = await query(
      'INSERT INTO seminars (title, start_time, end_time, timeline_id, cover_media_type, cover_media_value) VALUES (?, ?, ?, ?, ?, ?)',
      [title.trim(), startVal, endVal, timelineVal, coverType, coverValue]
    )

    res.status(201).json({ id: result.insertId })
  } catch (err) {
    console.error('Create seminar error:', err)
    res.status(500).json({ error: err.message || 'সেমিনার তৈরি ব্যর্থ' })
  }
}

export async function updateSeminar(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid ID' })

    const { title, start_time, end_time, timeline_id, cover_media_type, cover_media_value } = req.body || {}

    const [existing] = await query('SELECT id FROM seminars WHERE id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'সেমিনার পাওয়া যায়নি' })

    const updates = []
    const params = []

    if (title !== undefined) {
      updates.push('title = ?')
      params.push(typeof title === 'string' ? title.trim() : title)
    }
    if (start_time !== undefined) {
      const v = toMysqlDatetime(start_time)
      if (v) {
        updates.push('start_time = ?')
        params.push(v)
      }
    }
    if (end_time !== undefined) {
      const v = end_time ? toMysqlDatetime(end_time) : null
      updates.push('end_time = ?')
      params.push(v)
    }
    if (timeline_id !== undefined) {
      updates.push('timeline_id = ?')
      const tid = timeline_id == null || timeline_id === '' ? null : parseInt(timeline_id, 10)
      params.push(tid != null && !Number.isNaN(tid) ? tid : null)
    }
    if (cover_media_type !== undefined) {
      if (cover_media_type === '' || cover_media_type === null) {
        updates.push('cover_media_type = ?', 'cover_media_value = ?')
        params.push(null, null)
      } else if (cover_media_type === 'youtube' && cover_media_value) {
        const ytId = extractYouTubeId(cover_media_value)
        if (ytId) {
          updates.push('cover_media_type = ?', 'cover_media_value = ?')
          params.push('youtube', ytId)
        }
      }
    }

    if (updates.length === 0) {
      return res.json({ ok: true })
    }

    params.push(id)
    await query(`UPDATE seminars SET ${updates.join(', ')} WHERE id = ?`, params)
    res.json({ ok: true })
  } catch (err) {
    console.error('Update seminar error:', err)
    res.status(500).json({ error: err.message || 'আপডেট ব্যর্থ' })
  }
}

export async function getSeminarRegistrations(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid ID' })

    const rows = await query(
      'SELECT id, name, phone, registered_at FROM virtual_seminar_registrations WHERE seminar_id = ? ORDER BY registered_at DESC',
      [id]
    )
    res.json({
      registrations: rows.map((r) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        registered_at: r.registered_at,
      })),
    })
  } catch (err) {
    console.error('Get seminar registrations error:', err)
    res.status(500).json({ error: 'Failed to get registrations' })
  }
}

export async function uploadSeminarCover(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid ID' })
    if (!req.file) return res.status(400).json({ error: 'কভার ফাইল প্রয়োজন' })

    const [existing] = await query('SELECT id FROM seminars WHERE id = ?', [id])
    if (!existing) return res.status(404).json({ error: 'সেমিনার পাওয়া যায়নি' })

    const isVideo = /^video\//.test(req.file.mimetype)
    const isImage = /^image\//.test(req.file.mimetype)
    const coverType = isVideo ? 'video' : isImage ? 'image' : null
    if (!coverType) {
      return res.status(400).json({ error: 'শুধুমাত্র ভিডিও অথবা ছবি আপলোড করুন' })
    }

    const coverPath = `/uploads/seminars/${req.file.filename}`
    await query(
      'UPDATE seminars SET cover_media_type = ?, cover_media_value = ? WHERE id = ?',
      [coverType, coverPath, id]
    )
    res.json({ ok: true, cover_media_type: coverType, cover_media_value: coverPath })
  } catch (err) {
    console.error('Upload seminar cover error:', err)
    res.status(500).json({ error: err.message || 'কভার আপলোড ব্যর্থ' })
  }
}

export async function getSeminarStats(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (!id) return res.status(400).json({ error: 'Invalid ID' })

    const [sem] = await query('SELECT id, start_time, end_time FROM seminars WHERE id = ?', [id])
    if (!sem) return res.status(404).json({ error: 'সেমিনার পাওয়া যায়নি' })

    const status = getSeminarStatus(sem)
    const [regCount] = await query(
      'SELECT COUNT(*) as c FROM virtual_seminar_registrations WHERE seminar_id = ?',
      [id]
    )

    let viewer_count = 0
    if (status === 'live') {
      const { getViewerCountSync } = await import('./virtualSeminarViewController.js')
      viewer_count = getViewerCountSync()
    }

    res.json({
      status,
      registration_count: regCount?.c ?? 0,
      viewer_count,
    })
  } catch (err) {
    console.error('Get seminar stats error:', err)
    res.status(500).json({ error: 'Failed to get stats' })
  }
}
