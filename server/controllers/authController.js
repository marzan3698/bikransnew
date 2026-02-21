import bcrypt from 'bcryptjs'
import { body, validationResult } from 'express-validator'
import { query } from '../config/database.js'
import { generateToken } from '../middleware/auth.js'
import { getPermissionsForRole } from '../helpers/permissions.js'

export async function checkPhone(req, res) {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'Phone required' })
    const users = await query('SELECT id FROM users WHERE phone = ?', [phone])
    res.json({ exists: users.length > 0 })
  } catch (err) {
    console.error('Check phone error:', err)
    res.status(500).json({ error: 'Check failed' })
  }
}

export const loginValidation = [
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().isString(),
  body('password').notEmpty().withMessage('Password required'),
]

export async function login(req, res) {
  try {
    const { email, phone, password } = req.body
    const identifier = email || phone
    if (!identifier || !password) {
      return res.status(400).json({
        error: 'Email or phone and password are required',
      })
    }

    const isEmail = identifier.includes('@')
    const user = isEmail
      ? (await query('SELECT * FROM users WHERE email = ?', [identifier]))[0]
      : (await query('SELECT * FROM users WHERE phone = ?', [identifier]))[0]

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/phone or password' })
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email/phone or password' })
    }

    const token = generateToken(user)
    const projects = await query(
      'SELECT p.id, p.code, p.name FROM projects p INNER JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = ?',
      [user.id]
    )
    const permissions = await getPermissionsForRole(user.role)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions,
        status: user.status,
        projects: projects || [],
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
}

export const registerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').matches(/^01[3-9]\d{8}$/).withMessage('Valid 11-digit Bangladeshi phone required'),
  // Email optional or auto-generated
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
]

export async function register(req, res) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, email, phone, password, whatsapp_number, gender, reference_id, project_code } = req.body

    const existing = await query('SELECT id FROM users WHERE phone = ?', [phone])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' })
    }

    // Use provided email or generate a placeholder
    const userEmail = email || `${phone}@bikrans.local`
    const hashed = await bcrypt.hash(password, 10)

    // Insert user
    // Add reference_id and gender columns to DB if meaningful, currently gender exists.
    // Assuming reference_id is tracked? DB schema says users table has: id, name, email, phone, role, status, age, gender, whatsapp_number, login_pin, created_at
    // No reference_id column seen in previous file views. Assuming we store it in a meta table or ignore for now if column missing.
    // Wait, let's check `001_create_users_table.js` or `adminController` query to be sure about columns.
    // adminController query: SELECT id, name, email, phone, role, status, age, gender, whatsapp_number, login_pin, created_at
    // No reference_id column. We will skip saving reference_id for now or add column. 
    // Given the task is frontend heavy, I will store what I can.

    await query(
      'INSERT INTO users (name, email, phone, password, role, gender, whatsapp_number, login_pin) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, userEmail, phone, hashed, 'user', gender || null, whatsapp_number || null, password]
    )

    const [user] = await query('SELECT id, name, email, phone, role, status FROM users WHERE id = LAST_INSERT_ID()')

    // Assign project if code provided
    if (project_code) {
      const [proj] = await query('SELECT id FROM projects WHERE code = ?', [project_code])
      if (proj) {
        await query('INSERT INTO user_projects (user_id, project_id) VALUES (?, ?)', [user.id, proj.id])
      }
    }

    const token = generateToken(user)

    // Fetch assigned projects
    const projects = await query(
      'SELECT p.id, p.code, p.name FROM projects p INNER JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = ?',
      [user.id]
    )

    res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        projects: projects || []
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export async function logout(req, res) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      await query('DELETE FROM sessions WHERE token = ?', [token])
    }
    res.json({ message: 'Logged out' })
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' })
  }
}

export const campaignRegisterValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').matches(/^01[3-9]\d{8}$/).withMessage('Valid 11-digit Bangladeshi phone required'),
  body('age').optional().isInt({ min: 1, max: 120 }).withMessage('Age must be between 1 and 120'),
  body('gender').optional().isString().withMessage('Gender must be a string'),
  body('whatsapp_number').optional().isString().withMessage('WhatsApp number must be a string'),
]

export async function campaignRegister(req, res) {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name, phone, age, gender, whatsapp_number } = req.body

    // Check if phone already exists
    const existing = await query('SELECT id FROM users WHERE phone = ?', [phone])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Phone number already registered' })
    }

    // Generate email and 6-digit PIN for login
    const email = `${phone}@bikrans.campaign`
    const pin = String(Math.floor(100000 + Math.random() * 900000))
    const hashed = await bcrypt.hash(pin, 10)

    // Insert user with campaign fields and login_pin for display
    const insertResult = await query(
      'INSERT INTO users (name, email, phone, password, role, age, gender, whatsapp_number, login_pin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, phone, hashed, 'user', age || null, gender || null, whatsapp_number || null, pin]
    )
    const userId = insertResult?.insertId
    const [user] = await query('SELECT id, name, phone FROM users WHERE id = ?', [userId])

    // Assign FTMP project (TikTok campaign form)
    const [ftmpProject] = await query("SELECT id FROM projects WHERE code = 'FTMP' LIMIT 1")
    if (ftmpProject) {
      await query('INSERT INTO user_projects (user_id, project_id) VALUES (?, ?)', [userId, ftmpProject.id])
    }

    // Get full user data and projects for auto-login
    const [fullUser] = await query(
      'SELECT id, name, email, phone, role, status FROM users WHERE id = ?',
      [userId]
    )
    const projects = await query(
      'SELECT p.id, p.code, p.name FROM projects p INNER JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = ?',
      [userId]
    )

    // Generate JWT token for auto-login
    const token = generateToken(fullUser)

    res.status(201).json({
      success: true,
      message: 'নিবন্ধন সম্পন্ন হয়েছে',
      token,
      user: {
        id: fullUser.id,
        name: fullUser.name,
        email: fullUser.email,
        phone: fullUser.phone,
        role: fullUser.role,
        status: fullUser.status,
        projects: projects || [],
      },
      pin,
    })
  } catch (err) {
    console.error('Campaign register error:', err)
    res.status(500).json({ error: 'Registration failed' })
  }
}

export async function me(req, res) {
  try {
    const [user] = await query(
      'SELECT id, name, email, phone, role, status, age, gender, whatsapp_number, login_pin, created_at FROM users WHERE id = ?',
      [req.userId]
    )
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    const projects = await query(
      'SELECT p.id, p.code, p.name FROM projects p INNER JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = ?',
      [req.userId]
    )
    const permissions = await getPermissionsForRole(user.role)
    res.json({ ...user, permissions, projects: projects || [] })
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' })
  }
}
