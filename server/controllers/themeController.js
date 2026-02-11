import { query } from '../config/database.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOGO_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos')

function ensureLogoUploadDir() {
  if (!fs.existsSync(LOGO_UPLOAD_DIR)) {
    fs.mkdirSync(LOGO_UPLOAD_DIR, { recursive: true })
  }
}

// ===== HEADER SETTINGS =====

export async function getHeaderSettings(req, res) {
  try {
    const rows = await query('SELECT * FROM header_settings LIMIT 1')
    if (rows.length === 0) {
      // Return default values if not found
      return res.json({
        logo_image: '/BIKRANS-FINAL.png',
        logo_height: 36,
        header_height: 56,
        header_bg_color: '#ffffff',
        show_search_btn: 1,
        app_btn_text: 'বিক্রান্স অ্যাপ',
        app_btn_link: '',
        app_btn_bg_color: '#52B788',
        show_menu_btn: 1,
        show_footer: 1,
      })
    }
    res.json(rows[0])
  } catch (err) {
    console.error('Get header settings error:', err)
    res.status(500).json({ error: 'Failed to get header settings' })
  }
}

export async function updateHeaderSettings(req, res) {
  try {
    const body = req.body || {}
    const {
      logo_image,
      logo_height,
      header_height,
      header_bg_color,
      show_search_btn,
      app_btn_text,
      app_btn_link,
      app_btn_bg_color,
      show_menu_btn,
    } = body
    const show_footer = body.show_footer !== undefined ? body.show_footer : body.showFooter

    const updates = []
    const params = []

    if (logo_image !== undefined) {
      updates.push('logo_image = ?')
      params.push(logo_image)
    }
    if (logo_height !== undefined) {
      updates.push('logo_height = ?')
      params.push(parseInt(logo_height))
    }
    if (header_height !== undefined) {
      updates.push('header_height = ?')
      params.push(parseInt(header_height))
    }
    if (header_bg_color !== undefined) {
      updates.push('header_bg_color = ?')
      params.push(header_bg_color)
    }
    if (show_search_btn !== undefined) {
      updates.push('show_search_btn = ?')
      params.push(show_search_btn ? 1 : 0)
    }
    if (app_btn_text !== undefined) {
      updates.push('app_btn_text = ?')
      params.push(app_btn_text)
    }
    if (app_btn_link !== undefined) {
      updates.push('app_btn_link = ?')
      params.push(app_btn_link)
    }
    if (app_btn_bg_color !== undefined) {
      updates.push('app_btn_bg_color = ?')
      params.push(app_btn_bg_color)
    }
    if (show_menu_btn !== undefined) {
      updates.push('show_menu_btn = ?')
      params.push(show_menu_btn ? 1 : 0)
    }
    if (show_footer !== undefined) {
      updates.push('show_footer = ?')
      params.push(show_footer ? 1 : 0)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    // Check if settings exist
    const rows = await query('SELECT id FROM header_settings LIMIT 1')
    
    if (rows.length === 0) {
      // Insert new settings
      await query(`
        INSERT INTO header_settings 
        (logo_image, logo_height, header_height, header_bg_color, show_search_btn, app_btn_text, app_btn_link, app_btn_bg_color, show_menu_btn, show_footer)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        logo_image || '/BIKRANS-FINAL.png',
        logo_height || 36,
        header_height || 56,
        header_bg_color || '#ffffff',
        show_search_btn !== undefined ? (show_search_btn ? 1 : 0) : 1,
        app_btn_text || 'বিক্রান্স অ্যাপ',
        app_btn_link || '',
        app_btn_bg_color || '#52B788',
        show_menu_btn !== undefined ? (show_menu_btn ? 1 : 0) : 1,
        show_footer !== undefined ? (show_footer ? 1 : 0) : 1,
      ])
    } else {
      // Update existing settings
      await query(`UPDATE header_settings SET ${updates.join(', ')} WHERE id = ?`, [...params, rows[0].id])
    }

    const updated = await query('SELECT * FROM header_settings LIMIT 1')
    res.json(updated[0])
  } catch (err) {
    console.error('Update header settings error:', err)
    res.status(500).json({ error: 'Failed to update header settings' })
  }
}

export async function uploadLogo(req, res) {
  try {
    ensureLogoUploadDir()

    if (!req.file) {
      return res.status(400).json({ error: 'Logo file is required' })
    }

    const ext = path.extname(req.file.originalname) || '.png'
    const newName = `logo_${Date.now()}${ext}`
    const destPath = path.join(LOGO_UPLOAD_DIR, newName)
    fs.renameSync(req.file.path, destPath)
    
    const logoPath = `/uploads/logos/${newName}`

    // Update header settings with new logo
    const rows = await query('SELECT id FROM header_settings LIMIT 1')
    if (rows.length === 0) {
      await query('INSERT INTO header_settings (logo_image) VALUES (?)', [logoPath])
    } else {
      // Delete old logo if it's an uploaded one
      const [oldSettings] = await query('SELECT logo_image FROM header_settings LIMIT 1')
      if (oldSettings && oldSettings.logo_image && oldSettings.logo_image.startsWith('/uploads/')) {
        const oldPath = path.join(process.cwd(), 'public', oldSettings.logo_image)
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
      }
      
      await query('UPDATE header_settings SET logo_image = ? WHERE id = ?', [logoPath, rows[0].id])
    }

    res.json({ success: true, logo_path: logoPath })
  } catch (err) {
    console.error('Upload logo error:', err)
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }
    res.status(500).json({ error: 'Failed to upload logo' })
  }
}

// ===== FOOTER VISIBILITY (enable/disable footer on site) =====
export async function updateFooterVisibility(req, res) {
  try {
    const body = req.body || {}
    let show = body.show_footer !== undefined ? body.show_footer : body.showFooter
    if (show === undefined) show = true
    const value = show === true || show === 1 || show === '1' || show === 'true' ? 1 : 0

    const rows = await query('SELECT id FROM header_settings LIMIT 1')
    if (rows.length === 0) {
      await query(`
        INSERT INTO header_settings (logo_image, show_footer) VALUES (?, ?)
      `, ['/BIKRANS-FINAL.png', value])
    } else {
      await query('UPDATE header_settings SET show_footer = ? WHERE id = ?', [value, rows[0].id])
    }
    const [updated] = await query('SELECT show_footer FROM header_settings LIMIT 1')
    res.json({ show_footer: Boolean(updated?.show_footer) })
  } catch (err) {
    console.error('Update footer visibility error:', err)
    res.status(500).json({ error: 'Failed to update footer visibility' })
  }
}

// ===== FOOTER NAV ITEMS =====

export async function getFooterNavItems(req, res) {
  try {
    const items = await query(
      'SELECT id, icon, label, link FROM footer_nav_items WHERE is_active = 1 ORDER BY sort_order ASC'
    )
    res.json(items)
  } catch (err) {
    console.error('Get footer nav items error:', err)
    res.status(500).json({ error: 'Failed to get footer nav items' })
  }
}

export async function getAdminFooterNavItems(req, res) {
  try {
    const items = await query(
      'SELECT * FROM footer_nav_items ORDER BY sort_order ASC'
    )
    res.json(items)
  } catch (err) {
    console.error('Get admin footer nav items error:', err)
    res.status(500).json({ error: 'Failed to get footer nav items' })
  }
}

export async function createFooterNavItem(req, res) {
  try {
    const { icon, label, link, sort_order, is_active } = req.body

    if (!icon || !label || !link) {
      return res.status(400).json({ error: 'Icon, label, and link are required' })
    }

    await query(
      'INSERT INTO footer_nav_items (icon, label, link, sort_order, is_active) VALUES (?, ?, ?, ?, ?)',
      [icon, label, link, sort_order || 0, is_active !== undefined ? (is_active ? 1 : 0) : 1]
    )

    const [item] = await query('SELECT * FROM footer_nav_items WHERE id = LAST_INSERT_ID()')
    res.status(201).json(item)
  } catch (err) {
    console.error('Create footer nav item error:', err)
    res.status(500).json({ error: 'Failed to create footer nav item' })
  }
}

export async function updateFooterNavItem(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { icon, label, link, sort_order, is_active } = req.body

    const updates = []
    const params = []

    if (icon !== undefined) {
      updates.push('icon = ?')
      params.push(icon)
    }
    if (label !== undefined) {
      updates.push('label = ?')
      params.push(label)
    }
    if (link !== undefined) {
      updates.push('link = ?')
      params.push(link)
    }
    if (sort_order !== undefined) {
      updates.push('sort_order = ?')
      params.push(parseInt(sort_order))
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?')
      params.push(is_active ? 1 : 0)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    params.push(id)
    await query(`UPDATE footer_nav_items SET ${updates.join(', ')} WHERE id = ?`, params)

    const [item] = await query('SELECT * FROM footer_nav_items WHERE id = ?', [id])
    if (!item) {
      return res.status(404).json({ error: 'Footer nav item not found' })
    }

    res.json(item)
  } catch (err) {
    console.error('Update footer nav item error:', err)
    res.status(500).json({ error: 'Failed to update footer nav item' })
  }
}

export async function deleteFooterNavItem(req, res) {
  try {
    const id = parseInt(req.params.id)
    const rows = await query('SELECT id FROM footer_nav_items WHERE id = ?', [id])
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Footer nav item not found' })
    }

    await query('DELETE FROM footer_nav_items WHERE id = ?', [id])
    res.json({ message: 'Footer nav item deleted' })
  } catch (err) {
    console.error('Delete footer nav item error:', err)
    res.status(500).json({ error: 'Failed to delete footer nav item' })
  }
}

export async function reorderFooterNavItems(req, res) {
  try {
    const { order } = req.body

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be array of {id, sort_order}' })
    }

    for (const { id, sort_order } of order) {
      await query('UPDATE footer_nav_items SET sort_order = ? WHERE id = ?', [sort_order, id])
    }

    res.json({ message: 'Footer nav items reordered' })
  } catch (err) {
    console.error('Reorder footer nav items error:', err)
    res.status(500).json({ error: 'Failed to reorder footer nav items' })
  }
}

// ===== ADMIN PANEL BACKGROUND VIDEO =====

const DEFAULT_ADMIN_BG_VIDEO_ID = 'mfoRx20c7Us'

function extractYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/)
  return match ? match[1] : null
}

export async function getAdminBgVideo(req, res) {
  try {
    const rows = await query('SELECT admin_bg_video_id FROM admin_panel_settings LIMIT 1')
    const videoId = rows.length > 0 ? rows[0].admin_bg_video_id : null
    res.json({
      admin_bg_video_id: videoId || DEFAULT_ADMIN_BG_VIDEO_ID,
      youtube_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
    })
  } catch (err) {
    console.error('Get admin bg video error:', err)
    res.status(500).json({ error: 'Failed to get admin background video' })
  }
}

export async function updateAdminBgVideo(req, res) {
  try {
    const { youtube_url, admin_bg_video_id } = req.body || {}
    let videoId = admin_bg_video_id || extractYouTubeVideoId(youtube_url)
    if (!videoId) {
      return res.status(400).json({ error: 'Valid YouTube URL or video ID required' })
    }
    videoId = videoId.slice(0, 20)

    const rows = await query('SELECT id FROM admin_panel_settings LIMIT 1')
    if (rows.length === 0) {
      await query('INSERT INTO admin_panel_settings (admin_bg_video_id) VALUES (?)', [videoId])
    } else {
      await query('UPDATE admin_panel_settings SET admin_bg_video_id = ? WHERE id = ?', [
        videoId,
        rows[0].id,
      ])
    }

    res.json({ admin_bg_video_id: videoId })
  } catch (err) {
    console.error('Update admin bg video error:', err)
    res.status(500).json({ error: 'Failed to update admin background video' })
  }
}
