export async function up(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS admin_panel_settings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      admin_bg_video_id VARCHAR(20) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS admin_panel_settings')
}
