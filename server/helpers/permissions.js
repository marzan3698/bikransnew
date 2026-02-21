import { query } from '../config/database.js'

export async function getPermissionsForRole(roleSlug) {
  if (!roleSlug) return []
  try {
    const rows = await query(
      `SELECT p.slug FROM permissions p 
       INNER JOIN role_permissions rp ON p.id = rp.permission_id 
       INNER JOIN roles r ON r.id = rp.role_id 
       WHERE r.slug = ?`,
      [roleSlug]
    )
    return rows.map((r) => r.slug)
  } catch {
    return []
  }
}
