import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { query } from '../config/database.js'

export async function getDashboard(req, res) {
  try {
    const [r1] = await query('SELECT COUNT(*) as totalUsers FROM users')
    const [r2] = await query(
      "SELECT COUNT(*) as activeUsers FROM users WHERE status = 'active'"
    )
    const [r3] = await query(
      "SELECT COUNT(*) as admins FROM users WHERE role = 'admin'"
    )
    const [r4] = await query(
      "SELECT COUNT(*) as managers FROM users WHERE role = 'manager'"
    )
    const totalUsers = r1?.totalUsers ?? 0
    const activeUsers = r2?.activeUsers ?? 0
    const admins = r3?.admins ?? 0
    const managers = r4?.managers ?? 0
    const recentUsers = await query(
      'SELECT id, name, email, phone, role, status, age, gender, whatsapp_number, login_pin, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    )

    res.json({
      stats: {
        totalUsers,
        activeUsers,
        admins,
        managers,
      },
      recentUsers,
    })
  } catch (err) {
    console.error('Dashboard error:', err)
    res.status(500).json({ error: 'Failed to get dashboard data' })
  }
}

export async function getUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const search = req.query.search || ''
    const role = req.query.role || ''
    const status = req.query.status || ''

    let where = []
    let params = []

    if (search) {
      where.push('(name LIKE ? OR email LIKE ? OR phone LIKE ?)')
      const like = `%${search}%`
      params.push(like, like, like)
    }
    if (role) {
      where.push('role = ?')
      params.push(role)
    }
    if (status) {
      where.push('status = ?')
      params.push(status)
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const countParams = [...params]
    const listParams = [...params, limit, offset]

    const [countRow] = await query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      countParams
    )
    const total = countRow?.total ?? 0

    const users = await query(
      `SELECT id, name, email, phone, role, status, age, gender, whatsapp_number, login_pin, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      listParams
    )

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Get users error:', err)
    res.status(500).json({ error: 'Failed to get users' })
  }
}

export const createUserValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Valid email required'),
  body('phone').matches(/^01[3-9]\d{8}$/).withMessage('Valid 11-digit phone required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'manager', 'user', 'presentation_manager']).withMessage('Invalid role'),
]

export async function createUser(req, res) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, phone, password, role = 'user' } = req.body

    const existing = await query('SELECT id FROM users WHERE email = ? OR phone = ?', [
      email,
      phone,
    ])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email or phone already exists' })
    }

    const hashed = await bcrypt.hash(password, 10)
    await query(
      'INSERT INTO users (name, email, phone, password, role, login_pin) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, phone, hashed, role, password]
    )

    const [user] = await query(
      'SELECT id, name, email, phone, role, status, age, gender, whatsapp_number, login_pin, created_at FROM users WHERE id = LAST_INSERT_ID()'
    )
    res.status(201).json(user)
  } catch (err) {
    console.error('Create user error:', err)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

export async function updateUser(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { name, email, phone, status } = req.body
    const updates = []
    const params = []

    if (name !== undefined) {
      updates.push('name = ?')
      params.push(name)
    }
    if (email !== undefined) {
      updates.push('email = ?')
      params.push(email)
    }
    if (phone !== undefined) {
      updates.push('phone = ?')
      params.push(phone)
    }
    if (status !== undefined && ['active', 'inactive', 'suspended'].includes(status)) {
      updates.push('status = ?')
      params.push(status)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    params.push(id)
    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)

    const users = await query(
      'SELECT id, name, email, phone, role, status, age, gender, whatsapp_number, created_at FROM users WHERE id = ?',
      [id]
    )
    const user = users[0]
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json(user)
  } catch (err) {
    console.error('Update user error:', err)
    res.status(500).json({ error: 'Failed to update user' })
  }
}

export async function deleteUser(req, res) {
  try {
    const id = parseInt(req.params.id)
    if (id === req.userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' })
    }

    const result = await query('DELETE FROM users WHERE id = ?', [id])
    const affectedRows = result?.affectedRows ?? 0
    if (affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    res.json({ message: 'User deleted' })
  } catch (err) {
    console.error('Delete user error:', err)
    res.status(500).json({ error: 'Failed to delete user' })
  }
}

export async function updateUserRole(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { role } = req.body
    const validRoles = ['admin', 'manager', 'user', 'presentation_manager']
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const [result] = await query('UPDATE users SET role = ? WHERE id = ?', [role, id])
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const [user] = await query(
      'SELECT id, name, email, phone, role, status, age, gender, whatsapp_number FROM users WHERE id = ?',
      [id]
    )
    res.json(user)
  } catch (err) {
    console.error('Update role error:', err)
    res.status(500).json({ error: 'Failed to update role' })
  }
}

export async function getAnalytics(req, res) {
  try {
    const last7Days = await query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `)

    const byRole = await query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    )
    const byStatus = await query(
      "SELECT status, COUNT(*) as count FROM users GROUP BY status"
    )

    res.json({
      userGrowth: last7Days,
      byRole,
      byStatus,
    })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
}

// Project Management
export async function getProjects(req, res) {
  try {
    const projects = await query(`
      SELECT id, code, name, youtube_url,
        mcq1_question, mcq1_option_a, mcq1_option_b, mcq1_option_c, mcq1_option_d, mcq1_answer,
        mcq2_question, mcq2_option_a, mcq2_option_b, mcq2_option_c, mcq2_option_d, mcq2_answer,
        mcq3_question, mcq3_option_a, mcq3_option_b, mcq3_option_c, mcq3_option_d, mcq3_answer,
        created_at
      FROM projects ORDER BY created_at DESC
    `)
    res.json(projects)
  } catch (err) {
    console.error('Get projects error:', err)
    res.status(500).json({ error: 'Failed to get projects' })
  }
}

export async function createProject(req, res) {
  try {
    const {
      code, name, youtube_url,
      mcq1_question, mcq1_option_a, mcq1_option_b, mcq1_option_c, mcq1_option_d, mcq1_answer,
      mcq2_question, mcq2_option_a, mcq2_option_b, mcq2_option_c, mcq2_option_d, mcq2_answer,
      mcq3_question, mcq3_option_a, mcq3_option_b, mcq3_option_c, mcq3_option_d, mcq3_answer
    } = req.body

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' })
    }

    // Check if code already exists
    const existing = await query('SELECT id FROM projects WHERE code = ?', [code])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Project code already exists' })
    }

    await query(`
      INSERT INTO projects (
        code, name, youtube_url,
        mcq1_question, mcq1_option_a, mcq1_option_b, mcq1_option_c, mcq1_option_d, mcq1_answer,
        mcq2_question, mcq2_option_a, mcq2_option_b, mcq2_option_c, mcq2_option_d, mcq2_answer,
        mcq3_question, mcq3_option_a, mcq3_option_b, mcq3_option_c, mcq3_option_d, mcq3_answer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      code, name, youtube_url || null,
      mcq1_question || null, mcq1_option_a || null, mcq1_option_b || null, mcq1_option_c || null, mcq1_option_d || null, mcq1_answer || null,
      mcq2_question || null, mcq2_option_a || null, mcq2_option_b || null, mcq2_option_c || null, mcq2_option_d || null, mcq2_answer || null,
      mcq3_question || null, mcq3_option_a || null, mcq3_option_b || null, mcq3_option_c || null, mcq3_option_d || null, mcq3_answer || null
    ])

    const [project] = await query(
      'SELECT id, code, name, youtube_url, created_at FROM projects WHERE id = LAST_INSERT_ID()'
    )
    res.status(201).json(project)
  } catch (err) {
    console.error('Create project error:', err)
    res.status(500).json({ error: 'Failed to create project' })
  }
}

export async function updateProject(req, res) {
  try {
    const id = parseInt(req.params.id)
    const {
      name, youtube_url,
      mcq1_question, mcq1_option_a, mcq1_option_b, mcq1_option_c, mcq1_option_d, mcq1_answer,
      mcq2_question, mcq2_option_a, mcq2_option_b, mcq2_option_c, mcq2_option_d, mcq2_answer,
      mcq3_question, mcq3_option_a, mcq3_option_b, mcq3_option_c, mcq3_option_d, mcq3_answer
    } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    const result = await query(`
      UPDATE projects SET
        name = ?, youtube_url = ?,
        mcq1_question = ?, mcq1_option_a = ?, mcq1_option_b = ?, mcq1_option_c = ?, mcq1_option_d = ?, mcq1_answer = ?,
        mcq2_question = ?, mcq2_option_a = ?, mcq2_option_b = ?, mcq2_option_c = ?, mcq2_option_d = ?, mcq2_answer = ?,
        mcq3_question = ?, mcq3_option_a = ?, mcq3_option_b = ?, mcq3_option_c = ?, mcq3_option_d = ?, mcq3_answer = ?
      WHERE id = ?
    `, [
      name, youtube_url || null,
      mcq1_question || null, mcq1_option_a || null, mcq1_option_b || null, mcq1_option_c || null, mcq1_option_d || null, mcq1_answer || null,
      mcq2_question || null, mcq2_option_a || null, mcq2_option_b || null, mcq2_option_c || null, mcq2_option_d || null, mcq2_answer || null,
      mcq3_question || null, mcq3_option_a || null, mcq3_option_b || null, mcq3_option_c || null, mcq3_option_d || null, mcq3_answer || null,
      id
    ])
    const affectedRows = result?.affectedRows ?? 0

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    const [project] = await query(
      `SELECT id, code, name, youtube_url,
        mcq1_question, mcq1_option_a, mcq1_option_b, mcq1_option_c, mcq1_option_d, mcq1_answer,
        mcq2_question, mcq2_option_a, mcq2_option_b, mcq2_option_c, mcq2_option_d, mcq2_answer,
        mcq3_question, mcq3_option_a, mcq3_option_b, mcq3_option_c, mcq3_option_d, mcq3_answer,
        created_at FROM projects WHERE id = ?`,
      [id]
    )
    res.json(project)
  } catch (err) {
    console.error('Update project error:', err)
    res.status(500).json({ error: 'Failed to update project' })
  }
}

export async function deleteProject(req, res) {
  try {
    const id = parseInt(req.params.id)

    const result = await query('DELETE FROM projects WHERE id = ?', [id])
    const affectedRows = result?.affectedRows ?? 0

    if (affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' })
    }

    res.json({ message: 'Project deleted successfully' })
  } catch (err) {
    console.error('Delete project error:', err)
    res.status(500).json({ error: 'Failed to delete project' })
  }
}
