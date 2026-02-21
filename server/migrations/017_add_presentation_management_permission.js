export async function up(conn) {
  await conn.query(
    'INSERT INTO permissions (name, slug, module, description) VALUES (?, ?, ?, ?)',
    ['প্রেজেন্টেশন ম্যানেজমেন্ট', 'presentation-management', 'presentation', 'প্রেজেন্টেশন সেকশনের সম্পূর্ণ অ্যাক্সেস']
  )

  const [[perm]] = await conn.query('SELECT id FROM permissions WHERE slug = ?', ['presentation-management'])
  const [adminRoles] = await conn.query('SELECT id FROM roles WHERE slug IN (?, ?, ?)', [
    'admin',
    'manager',
    'presentation_manager',
  ])
  for (const role of adminRoles) {
    await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [
      role.id,
      perm.id,
    ])
  }
}

export async function down(conn) {
  const [[perm]] = await conn.query('SELECT id FROM permissions WHERE slug = ?', ['presentation-management'])
  if (perm) {
    await conn.query('DELETE FROM role_permissions WHERE permission_id = ?', [perm.id])
    await conn.query('DELETE FROM permissions WHERE id = ?', [perm.id])
  }
}
