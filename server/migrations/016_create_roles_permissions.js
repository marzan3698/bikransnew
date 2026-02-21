export async function up(conn) {
  await conn.query(`
    CREATE TABLE roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)

  await conn.query(`
    CREATE TABLE permissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      slug VARCHAR(80) NOT NULL UNIQUE,
      module VARCHAR(50) NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await conn.query(`
    CREATE TABLE role_permissions (
      role_id INT NOT NULL,
      permission_id INT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `)

  const roles = [
    { name: 'Admin', slug: 'admin', description: 'সব অ্যাক্সেস' },
    { name: 'Manager', slug: 'manager', description: 'ম্যানেজার অ্যাক্সেস' },
    { name: 'User', slug: 'user', description: 'সাধারণ ইউজার' },
    { name: 'প্রেজেন্টেশন ম্যানেজার', slug: 'presentation_manager', description: 'প্রেজেন্টেশন ও ভিডিও এডিটর ম্যানেজমেন্ট' },
  ]
  for (const r of roles) {
    await conn.query('INSERT INTO roles (name, slug, description) VALUES (?, ?, ?)', [r.name, r.slug, r.description])
  }

  const permissions = [
    { name: 'Dashboard', slug: 'dashboard', module: 'admin' },
    { name: 'User Management', slug: 'users', module: 'admin' },
    { name: 'Task Management', slug: 'tasks', module: 'admin' },
    { name: 'প্রজেক্ট ম্যানেজমেন্ট', slug: 'projects', module: 'admin' },
    { name: 'Analytics', slug: 'analytics', module: 'admin' },
    { name: 'Slider Management', slug: 'theme-sliders', module: 'theme' },
    { name: 'Header Management', slug: 'theme-header', module: 'theme' },
    { name: 'Footer Management', slug: 'theme-footer', module: 'theme' },
    { name: 'ল্যান্ডিং পেজ ডিজাইন', slug: 'theme-landing', module: 'theme' },
    { name: 'Admin Panel Background Video', slug: 'theme-admin-bg', module: 'theme' },
    { name: 'মিউজিক অ্যাড', slug: 'music-add', module: 'video-editor' },
    { name: 'মিউজিক তালিকা', slug: 'music-list', module: 'video-editor' },
    { name: 'ফ্রেম অ্যাড', slug: 'frame-add', module: 'video-editor' },
    { name: 'ফ্রেম তালিকা', slug: 'frame-list', module: 'video-editor' },
    { name: 'ইউজার মনিটরিং (ব্যবহার করেছে)', slug: 'user-monitor-used', module: 'video-editor' },
    { name: 'ইউজার মনিটরিং (আংশিক)', slug: 'user-monitor-partial', module: 'video-editor' },
    { name: 'Plex Deployment', slug: 'plex-deployment', module: 'admin' },
    { name: 'Settings', slug: 'settings', module: 'admin' },
    { name: 'রোল ও পারমিশন ম্যানেজমেন্ট', slug: 'roles-permissions', module: 'admin' },
  ]
  for (const p of permissions) {
    await conn.query('INSERT INTO permissions (name, slug, module, description) VALUES (?, ?, ?, ?)', [p.name, p.slug, p.module, p.description || null])
  }

  const [[adminRole]] = await conn.query('SELECT id FROM roles WHERE slug = ?', ['admin'])
  const [[managerRole]] = await conn.query('SELECT id FROM roles WHERE slug = ?', ['manager'])
  const [[presentationManagerRole]] = await conn.query('SELECT id FROM roles WHERE slug = ?', ['presentation_manager'])

  const [allPerms] = await conn.query('SELECT id, slug FROM permissions')

  for (const p of allPerms) {
    await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [adminRole.id, p.id])
    if (p.slug !== 'roles-permissions') {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [managerRole.id, p.id])
    }
  }

  const presentationPerms = ['dashboard', 'projects', 'music-add', 'music-list', 'frame-add', 'frame-list', 'theme-sliders', 'theme-header']
  for (const slug of presentationPerms) {
    const [[perm]] = await conn.query('SELECT id FROM permissions WHERE slug = ?', [slug])
    if (perm) {
      await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [presentationManagerRole.id, perm.id])
    }
  }

  await conn.query(`
    ALTER TABLE users
    MODIFY COLUMN role VARCHAR(50) NOT NULL DEFAULT 'user'
  `)
}

export async function down(conn) {
  await conn.query('ALTER TABLE users MODIFY COLUMN role ENUM(\'admin\', \'manager\', \'user\') NOT NULL DEFAULT \'user\'')
  await conn.query('DROP TABLE IF EXISTS role_permissions')
  await conn.query('DROP TABLE IF EXISTS permissions')
  await conn.query('DROP TABLE IF EXISTS roles')
}
