import { query } from '../config/database.js'

const TASK_STATUSES = ['pending', 'in_progress', 'submitted', 'revision', 'completed', 'cancelled']
const TASK_TYPES = ['tiktok_video', 'facebook_moderator']
const PRIORITIES = ['low', 'medium', 'high']

function mimeToFileType(mimetype) {
  if (!mimetype) return 'document'
  if (mimetype.startsWith('video/')) return 'video'
  if (mimetype.startsWith('audio/')) return 'audio'
  if (mimetype.startsWith('image/')) return 'image'
  return 'document'
}

// ----- Admin -----

export async function listTasks(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const type = req.query.type || ''
    const status = req.query.status || ''
    const assignedUserId = req.query.assigned_user_id || ''

    let where = []
    let params = []
    if (type) {
      where.push('t.type = ?')
      params.push(type)
    }
    if (status) {
      where.push('t.status = ?')
      params.push(status)
    }
    if (assignedUserId) {
      where.push('t.assigned_user_id = ?')
      params.push(assignedUserId)
    }
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
    const countParams = [...params]
    const listParams = [...params, limit, offset]

    const [countRow] = await query(
      `SELECT COUNT(*) as total FROM tasks t ${whereClause}`,
      countParams
    )
    const total = Number(countRow?.total ?? 0)

    const tasks = await query(
      `SELECT t.id, t.title, t.description, t.url, t.type, t.status, t.assigned_user_id, t.created_by, t.due_date, t.priority, t.created_at, t.updated_at,
        au.name AS assigned_user_name, au.phone AS assigned_user_phone,
        cb.name AS created_by_name
       FROM tasks t
       LEFT JOIN users au ON t.assigned_user_id = au.id
       LEFT JOIN users cb ON t.created_by = cb.id
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      listParams
    )

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('List tasks error:', err)
    const message = err.code === 'ER_NO_SUCH_TABLE'
      ? 'Tasks table not found. Run: npm run migrate'
      : (err.message || 'Failed to list tasks')
    res.status(500).json({ error: message })
  }
}

export async function createTask(req, res) {
  try {
    const { title, description, url, type, assigned_user_id, due_date, priority } = req.body
    if (!title || !type || !assigned_user_id) {
      return res.status(400).json({ error: 'Title, type, and assigned user are required' })
    }
    if (!TASK_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid task type' })
    }
    const prio = priority && PRIORITIES.includes(priority) ? priority : 'medium'
    const due = due_date || null
    const taskUrl = url && String(url).trim() ? String(url).trim() : null

    const result = await query(
      `INSERT INTO tasks (title, description, url, type, assigned_user_id, created_by, due_date, priority)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description || null, taskUrl, type, assigned_user_id, req.userId, due, prio]
    )
    const taskId = result.insertId
    const tasks = await query(
      `SELECT t.*, au.name AS assigned_user_name, au.phone AS assigned_user_phone
       FROM tasks t LEFT JOIN users au ON t.assigned_user_id = au.id WHERE t.id = ?`,
      [taskId]
    )
    res.status(201).json(tasks[0])
  } catch (err) {
    console.error('Create task error:', err)
    res.status(500).json({ error: 'Failed to create task' })
  }
}

export async function getTask(req, res) {
  try {
    const id = req.params.id
    const [task] = await query(
      `SELECT t.*, au.name AS assigned_user_name, au.phone AS assigned_user_phone, au.email AS assigned_user_email,
        cb.name AS created_by_name
       FROM tasks t
       LEFT JOIN users au ON t.assigned_user_id = au.id
       LEFT JOIN users cb ON t.created_by = cb.id
       WHERE t.id = ?`,
      [id]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const attachments = await query(
      `SELECT ta.*, u.name AS uploaded_by_name FROM task_attachments ta
       LEFT JOIN users u ON ta.uploaded_by = u.id WHERE ta.task_id = ? ORDER BY ta.created_at ASC`,
      [id]
    )
    const comments = await query(
      `SELECT tc.*, u.name AS user_name FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id WHERE tc.task_id = ? ORDER BY tc.created_at ASC`,
      [id]
    )
    res.json({ ...task, attachments, comments })
  } catch (err) {
    console.error('Get task error:', err)
    res.status(500).json({ error: 'Failed to get task' })
  }
}

export async function updateTask(req, res) {
  try {
    const id = req.params.id
    const { title, description, url, type, status, assigned_user_id, due_date, priority } = req.body
    const [existing] = await query('SELECT id FROM tasks WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const updates = []
    const params = []
    if (title !== undefined) {
      updates.push('title = ?')
      params.push(title)
    }
    if (description !== undefined) {
      updates.push('description = ?')
      params.push(description)
    }
    if (url !== undefined) {
      updates.push('url = ?')
      params.push(url && String(url).trim() ? String(url).trim() : null)
    }
    if (type !== undefined && TASK_TYPES.includes(type)) {
      updates.push('type = ?')
      params.push(type)
    }
    if (status !== undefined && TASK_STATUSES.includes(status)) {
      updates.push('status = ?')
      params.push(status)
    }
    if (assigned_user_id !== undefined) {
      updates.push('assigned_user_id = ?')
      params.push(assigned_user_id)
    }
    if (due_date !== undefined) {
      updates.push('due_date = ?')
      params.push(due_date || null)
    }
    if (priority !== undefined && PRIORITIES.includes(priority)) {
      updates.push('priority = ?')
      params.push(priority)
    }
    if (updates.length === 0) {
      const [task] = await query(
        `SELECT t.*, au.name AS assigned_user_name FROM tasks t LEFT JOIN users au ON t.assigned_user_id = au.id WHERE t.id = ?`,
        [id]
      )
      return res.json(task)
    }
    params.push(id)
    await query(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, params)
    const [task] = await query(
      `SELECT t.*, au.name AS assigned_user_name FROM tasks t LEFT JOIN users au ON t.assigned_user_id = au.id WHERE t.id = ?`,
      [id]
    )
    res.json(task)
  } catch (err) {
    console.error('Update task error:', err)
    res.status(500).json({ error: 'Failed to update task' })
  }
}

export async function deleteTask(req, res) {
  try {
    const id = req.params.id
    const [existing] = await query('SELECT id FROM tasks WHERE id = ?', [id])
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' })
    }
    await query('DELETE FROM tasks WHERE id = ?', [id])
    res.json({ message: 'Task deleted' })
  } catch (err) {
    console.error('Delete task error:', err)
    res.status(500).json({ error: 'Failed to delete task' })
  }
}

// ----- User (assigned user) -----

export async function getMyTasks(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(50, Math.max(10, parseInt(req.query.limit) || 20))
    const offset = (page - 1) * limit
    const type = req.query.type || ''
    const status = req.query.status || ''

    let where = ['t.assigned_user_id = ?']
    let params = [req.userId]
    if (type) {
      where.push('t.type = ?')
      params.push(type)
    }
    if (status) {
      where.push('t.status = ?')
      params.push(status)
    }
    const whereClause = 'WHERE ' + where.join(' AND ')
    const countParams = [...params]
    const listParams = [...params, limit, offset]

    const [countRow] = await query(
      `SELECT COUNT(*) as total FROM tasks t ${whereClause}`,
      countParams
    )
    const total = Number(countRow?.total ?? 0)

    const tasks = await query(
      `SELECT t.id, t.title, t.description, t.url, t.type, t.status, t.due_date, t.priority, t.created_at
       FROM tasks t
       ${whereClause}
       ORDER BY t.created_at DESC
       LIMIT ? OFFSET ?`,
      listParams
    )

    res.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    console.error('Get my tasks error:', err)
    const message = err.code === 'ER_NO_SUCH_TABLE'
      ? 'Tasks table not found. Run: npm run migrate'
      : (err.message || 'Failed to get tasks')
    res.status(500).json({ error: message })
  }
}

export async function getTaskForUser(req, res) {
  try {
    const id = req.params.id
    const [task] = await query(
      `SELECT t.*, cb.name AS created_by_name FROM tasks t
       LEFT JOIN users cb ON t.created_by = cb.id
       WHERE t.id = ? AND t.assigned_user_id = ?`,
      [id, req.userId]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const attachments = await query(
      `SELECT ta.*, u.name AS uploaded_by_name FROM task_attachments ta
       LEFT JOIN users u ON ta.uploaded_by = u.id WHERE ta.task_id = ? ORDER BY ta.created_at ASC`,
      [id]
    )
    const comments = await query(
      `SELECT tc.*, u.name AS user_name FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id WHERE tc.task_id = ? ORDER BY tc.created_at ASC`,
      [id]
    )
    res.json({ ...task, attachments, comments })
  } catch (err) {
    console.error('Get task for user error:', err)
    res.status(500).json({ error: 'Failed to get task' })
  }
}

export async function updateTaskStatus(req, res) {
  try {
    const id = req.params.id
    const { status } = req.body
    if (!status || !TASK_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Valid status required' })
    }
    const [task] = await query(
      'SELECT id FROM tasks WHERE id = ? AND assigned_user_id = ?',
      [id, req.userId]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    await query('UPDATE tasks SET status = ? WHERE id = ?', [status, id])
    const [updated] = await query('SELECT * FROM tasks WHERE id = ?', [id])
    res.json(updated)
  } catch (err) {
    console.error('Update task status error:', err)
    res.status(500).json({ error: 'Failed to update status' })
  }
}

export async function addTaskAttachment(req, res) {
  try {
    const taskId = req.params.id
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' })
    }
    const [task] = await query(
      'SELECT id FROM tasks WHERE id = ? AND assigned_user_id = ?',
      [taskId, req.userId]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const fileType = mimeToFileType(req.file.mimetype)
    const filePath = `/uploads/tasks/${req.file.filename}`
    await query(
      `INSERT INTO task_attachments (task_id, uploaded_by, file_name, file_path, file_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, req.userId, req.file.originalname || req.file.filename, filePath, fileType, req.file.size || 0]
    )
    const [row] = await query(
      `SELECT ta.*, u.name AS uploaded_by_name FROM task_attachments ta
       LEFT JOIN users u ON ta.uploaded_by = u.id WHERE ta.task_id = ? ORDER BY ta.id DESC LIMIT 1`,
      [taskId]
    )
    res.status(201).json(row)
  } catch (err) {
    console.error('Add task attachment error:', err)
    res.status(500).json({ error: 'Failed to add attachment' })
  }
}

export async function addTaskAttachmentAdmin(req, res) {
  try {
    const taskId = req.params.id
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' })
    }
    const [task] = await query('SELECT id FROM tasks WHERE id = ?', [taskId])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const fileType = mimeToFileType(req.file.mimetype)
    const filePath = `/uploads/tasks/${req.file.filename}`
    await query(
      `INSERT INTO task_attachments (task_id, uploaded_by, file_name, file_path, file_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [taskId, req.userId, req.file.originalname || req.file.filename, filePath, fileType, req.file.size || 0]
    )
    const [row] = await query(
      `SELECT ta.*, u.name AS uploaded_by_name FROM task_attachments ta
       LEFT JOIN users u ON ta.uploaded_by = u.id WHERE ta.task_id = ? ORDER BY ta.id DESC LIMIT 1`,
      [taskId]
    )
    res.status(201).json(row)
  } catch (err) {
    console.error('Add task attachment admin error:', err)
    res.status(500).json({ error: 'Failed to add attachment' })
  }
}

export async function listTaskAttachments(req, res) {
  try {
    const taskId = req.params.id
    const [task] = await query(
      'SELECT id FROM tasks WHERE id = ? AND assigned_user_id = ?',
      [taskId, req.userId]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const attachments = await query(
      `SELECT ta.*, u.name AS uploaded_by_name FROM task_attachments ta
       LEFT JOIN users u ON ta.uploaded_by = u.id WHERE ta.task_id = ? ORDER BY ta.created_at ASC`,
      [taskId]
    )
    res.json(attachments)
  } catch (err) {
    console.error('List task attachments error:', err)
    res.status(500).json({ error: 'Failed to list attachments' })
  }
}

export async function deleteTaskAttachment(req, res) {
  try {
    const { id: taskId, attachmentId } = req.params
    const [task] = await query(
      'SELECT id FROM tasks WHERE id = ? AND assigned_user_id = ?',
      [taskId, req.userId]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const [att] = await query(
      'SELECT id FROM task_attachments WHERE id = ? AND task_id = ? AND uploaded_by = ?',
      [attachmentId, taskId, req.userId]
    )
    if (!att) {
      return res.status(404).json({ error: 'Attachment not found or not yours' })
    }
    await query('DELETE FROM task_attachments WHERE id = ?', [attachmentId])
    res.json({ message: 'Attachment deleted' })
  } catch (err) {
    console.error('Delete task attachment error:', err)
    res.status(500).json({ error: 'Failed to delete attachment' })
  }
}

export async function deleteTaskAttachmentAdmin(req, res) {
  try {
    const { id: taskId, attachmentId } = req.params
    const [task] = await query('SELECT id FROM tasks WHERE id = ?', [taskId])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    await query('DELETE FROM task_attachments WHERE id = ? AND task_id = ?', [attachmentId, taskId])
    res.json({ message: 'Attachment deleted' })
  } catch (err) {
    console.error('Delete task attachment admin error:', err)
    res.status(500).json({ error: 'Failed to delete attachment' })
  }
}

export async function addTaskComment(req, res) {
  try {
    const taskId = req.params.id
    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    const [task] = await query(
      'SELECT id FROM tasks WHERE id = ? AND assigned_user_id = ?',
      [taskId, req.userId]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    await query(
      'INSERT INTO task_comments (task_id, user_id, message) VALUES (?, ?, ?)',
      [taskId, req.userId, message.trim()]
    )
    const [row] = await query(
      `SELECT tc.*, u.name AS user_name FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id WHERE tc.task_id = ? ORDER BY tc.id DESC LIMIT 1`,
      [taskId]
    )
    res.status(201).json(row)
  } catch (err) {
    console.error('Add task comment error:', err)
    res.status(500).json({ error: 'Failed to add comment' })
  }
}

export async function addTaskCommentAdmin(req, res) {
  try {
    const taskId = req.params.id
    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' })
    }
    const [task] = await query('SELECT id FROM tasks WHERE id = ?', [taskId])
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    await query(
      'INSERT INTO task_comments (task_id, user_id, message) VALUES (?, ?, ?)',
      [taskId, req.userId, message.trim()]
    )
    const [row] = await query(
      `SELECT tc.*, u.name AS user_name FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id WHERE tc.task_id = ? ORDER BY tc.id DESC LIMIT 1`,
      [taskId]
    )
    res.status(201).json(row)
  } catch (err) {
    console.error('Add task comment admin error:', err)
    res.status(500).json({ error: 'Failed to add comment' })
  }
}

export async function listTaskComments(req, res) {
  try {
    const taskId = req.params.id
    const [task] = await query(
      'SELECT id FROM tasks WHERE id = ? AND assigned_user_id = ?',
      [taskId, req.userId]
    )
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }
    const comments = await query(
      `SELECT tc.*, u.name AS user_name FROM task_comments tc
       LEFT JOIN users u ON tc.user_id = u.id WHERE tc.task_id = ? ORDER BY tc.created_at ASC`,
      [taskId]
    )
    res.json(comments)
  } catch (err) {
    console.error('List task comments error:', err)
    res.status(500).json({ error: 'Failed to list comments' })
  }
}
