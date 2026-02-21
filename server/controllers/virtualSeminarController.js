import { query } from '../config/database.js'
import crypto from 'crypto'

/** Bangladesh mobile: 01[3-9]XXXXXXXX (11 digits) or +8801XXXXXXXX */
const BD_PHONE_REGEX = /^(?:\+88)?01[3-9]\d{8}$/

function normalizePhone(phone) {
  if (!phone || typeof phone !== 'string') return null
  const cleaned = phone.replace(/\s/g, '')
  const match = cleaned.match(BD_PHONE_REGEX)
  if (!match) return null
  if (cleaned.startsWith('+88')) return '0' + cleaned.slice(3)
  return cleaned
}

function getTokenFromRequest(req) {
  const token = req.query?.token || req.headers?.authorization?.replace(/^Bearer\s+/i, '')
  return token || null
}

export async function getSeminarStatus(req, res) {
  try {
    const rows = await query(
      'SELECT virtual_seminar_start_time FROM admin_panel_settings LIMIT 1'
    )
    const startTimeRaw = rows[0]?.virtual_seminar_start_time ?? null
    const startTime = startTimeRaw ? new Date(startTimeRaw).toISOString() : null
    const now = Date.now()

    if (!startTime) {
      return res.json({
        startTime: null,
        canAccess: false,
        countdownSeconds: null,
        needsRegistration: false,
      })
    }

    const startMs = new Date(startTime).getTime()

    const token = getTokenFromRequest(req)
    if (token) {
      const [reg] = await query('SELECT id FROM virtual_seminar_registrations WHERE token = ?', [
        token,
      ])
      if (reg && startMs <= now) {
        return res.json({
          startTime,
          canAccess: true,
          countdownSeconds: 0,
          needsRegistration: false,
        })
      }
    }

    if (startMs > now) {
      const countdownSeconds = Math.max(0, Math.floor((startMs - now) / 1000))
      return res.json({
        startTime,
        canAccess: false,
        countdownSeconds,
        needsRegistration: false,
      })
    }

    return res.json({
      startTime,
      canAccess: false,
      countdownSeconds: 0,
      needsRegistration: true,
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
    if (!trimmedName) {
      return res.status(400).json({ error: 'নাম প্রয়োজন' })
    }

    const normalizedPhone = normalizePhone(phone)
    if (!normalizedPhone) {
      return res.status(400).json({
        error: 'বৈধ বাংলাদেশী মোবাইল নম্বর দিন (উদাহরণ: ০১৭১২৩৪৫৬৭৮)',
      })
    }

    const rows = await query(
      'SELECT virtual_seminar_start_time FROM admin_panel_settings LIMIT 1'
    )
    const startTimeRaw = rows[0]?.virtual_seminar_start_time ?? null
    if (!startTimeRaw) {
      return res.status(400).json({ error: 'সেমিনার সেট করা নেই' })
    }
    const startMs = new Date(startTimeRaw).getTime()
    if (startMs > Date.now()) {
      return res.status(400).json({ error: 'সেমিনার এখনো শুরু হয়নি' })
    }

    const token = crypto.randomUUID()
    await query(
      'INSERT INTO virtual_seminar_registrations (name, phone, token) VALUES (?, ?, ?)',
      [trimmedName, normalizedPhone, token]
    )

    res.json({ token })
  } catch (err) {
    console.error('Register for seminar error:', err)
    res.status(500).json({ error: 'রেজিস্ট্রেশন ব্যর্থ' })
  }
}

export async function getSeminarSettings(req, res) {
  try {
    const rows = await query(
      `SELECT virtual_seminar_start_time, virtual_seminar_timeline_id 
       FROM admin_panel_settings LIMIT 1`
    )
    const { getViewerCountSync } = await import('./virtualSeminarViewController.js')
    const startTime = rows[0]?.virtual_seminar_start_time
      ? new Date(rows[0].virtual_seminar_start_time).toISOString()
      : null
    res.json({
      start_time: startTime,
      timeline_id: rows[0]?.virtual_seminar_timeline_id ?? null,
      viewer_count: getViewerCountSync(),
    })
  } catch (err) {
    console.error('Get seminar settings error:', err)
    res.status(500).json({ error: 'Failed to get seminar settings' })
  }
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

export async function updateSeminarSettings(req, res) {
  try {
    const { start_time } = req.body || {}
    const value =
      start_time == null || start_time === '' ? null : toMysqlDatetime(start_time)

    const rows = await query('SELECT id FROM admin_panel_settings LIMIT 1')
    if (rows.length === 0) {
      await query(
        'INSERT INTO admin_panel_settings (admin_bg_video_id, virtual_seminar_timeline_id, virtual_seminar_start_time) VALUES (?, ?, ?)',
        [null, null, value]
      )
    } else {
      await query(
        'UPDATE admin_panel_settings SET virtual_seminar_start_time = ? WHERE id = ?',
        [value, rows[0].id]
      )
    }

    const storedTime = value ? new Date(value).toISOString() : null
    res.json({ start_time: storedTime })
  } catch (err) {
    console.error('Update seminar settings error:', err)
    res.status(500).json({ error: err.message || 'Failed to update seminar settings' })
  }
}

export async function getRegistrations(req, res) {
  try {
    const rows = await query(
      'SELECT id, name, phone, registered_at FROM virtual_seminar_registrations ORDER BY registered_at DESC'
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
