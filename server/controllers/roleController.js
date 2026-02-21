import { query } from '../config/database.js'

export async function getPermissions(req, res) {
  try {
    const rows = await query(
      'SELECT id, name, slug, module, description FROM permissions ORDER BY module, name'
    )
    const byModule = {}
    for (const p of rows) {
      if (!byModule[p.module]) byModule[p.module] = []
      byModule[p.module].push(p)
    }
    res.json({ permissions: rows, byModule })
  } catch (err) {
    console.error('Get permissions error:', err)
    res.status(500).json({ error: 'Failed to get permissions' })
  }
}

export async function getRoles(req, res) {
  try {
    const roles = await query('SELECT id, name, slug, description, created_at FROM roles ORDER BY id')
    const rolesWithPerms = await Promise.all(
      roles.map(async (r) => {
        const perms = await query(
          'SELECT p.id, p.slug FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
          [r.id]
        )
        return { ...r, permission_ids: perms.map((p) => p.id), permission_slugs: perms.map((p) => p.slug) }
      })
    )
    res.json(rolesWithPerms)
  } catch (err) {
    console.error('Get roles error:', err)
    res.status(500).json({ error: 'Failed to get roles' })
  }
}

export async function createRole(req, res) {
  try {
    const { name, slug, description, permission_ids } = req.body
    if (!name || !slug) {
      return res.status(400).json({ error: 'Name and slug required' })
    }
    const [existing] = await query('SELECT id FROM roles WHERE slug = ?', [slug])
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Role slug already exists' })
    }
    await query('INSERT INTO roles (name, slug, description) VALUES (?, ?, ?)', [
      name,
      slug,
      description || null,
    ])
    const [[role]] = await query('SELECT id FROM roles WHERE slug = ?', [slug])
    if (permission_ids && Array.isArray(permission_ids) && permission_ids.length > 0) {
      for (const pid of permission_ids) {
        await query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [
          role.id,
          pid,
        ])
      }
    }
    const [created] = await query(
      'SELECT id, name, slug, description, created_at FROM roles WHERE id = ?',
      [role.id]
    )
    const perms = await query(
      'SELECT p.id, p.slug FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
      [role.id]
    )
    res.status(201).json({
      ...created,
      permission_ids: perms.map((p) => p.id),
      permission_slugs: perms.map((p) => p.slug),
    })
  } catch (err) {
    console.error('Create role error:', err)
    res.status(500).json({ error: 'Failed to create role' })
  }
}

export async function updateRole(req, res) {
  try {
    const { id } = req.params
    const { name, description, permission_ids } = req.body
    const [role] = await query('SELECT id FROM roles WHERE id = ?', [id])
    if (!role) {
      return res.status(404).json({ error: 'Role not found' })
    }
    if (name) {
      await query('UPDATE roles SET name = ? WHERE id = ?', [name, id])
    }
    if (description !== undefined) {
      await query('UPDATE roles SET description = ? WHERE id = ?', [description, id])
    }
    if (Array.isArray(permission_ids)) {
      await query('DELETE FROM role_permissions WHERE role_id = ?', [id])
      for (const pid of permission_ids) {
        await query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [id, pid])
      }
    }
    const [updated] = await query(
      'SELECT id, name, slug, description, created_at FROM roles WHERE id = ?',
      [id]
    )
    const perms = await query(
      'SELECT p.id, p.slug FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
      [id]
    )
    res.json({
      ...updated,
      permission_ids: perms.map((p) => p.id),
      permission_slugs: perms.map((p) => p.slug),
    })
  } catch (err) {
    console.error('Update role error:', err)
    res.status(500).json({ error: 'Failed to update role' })
  }
}

export async function deleteRole(req, res) {
  try {
    const { id } = req.params
    const [role] = await query('SELECT slug FROM roles WHERE id = ?', [id])
    if (!role) {
      return res.status(404).json({ error: 'Role not found' })
    }
    if (['admin', 'manager', 'user'].includes(role.slug)) {
      return res.status(400).json({ error: 'Cannot delete system roles (admin, manager, user)' })
    }
    const [usersWithRole] = await query('SELECT id FROM users WHERE role = ?', [role.slug])
    if (usersWithRole.length > 0) {
      return res.status(400).json({
        error: `Cannot delete: ${usersWithRole.length} user(s) have this role. Assign them another role first.`,
      })
    }
    await query('DELETE FROM role_permissions WHERE role_id = ?', [id])
    await query('DELETE FROM roles WHERE id = ?', [id])
    res.json({ message: 'Role deleted' })
  } catch (err) {
    console.error('Delete role error:', err)
    res.status(500).json({ error: 'Failed to delete role' })
  }
}

export async function getRolePermissions(req, res) {
  try {
    const { id } = req.params
    const perms = await query(
      'SELECT p.id, p.name, p.slug, p.module FROM permissions p INNER JOIN role_permissions rp ON p.id = rp.permission_id WHERE rp.role_id = ?',
      [id]
    )
    res.json(perms)
  } catch (err) {
    console.error('Get role permissions error:', err)
    res.status(500).json({ error: 'Failed to get role permissions' })
  }
}
