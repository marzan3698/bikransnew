export async function up(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS virtual_seminar_registrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      token VARCHAR(64) NOT NULL UNIQUE,
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS virtual_seminar_registrations')
}
