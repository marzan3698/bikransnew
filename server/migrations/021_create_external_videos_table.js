export async function up(conn) {
  await conn.query(`
    CREATE TABLE external_videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      youtube_url VARCHAR(500) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_name (name),
      INDEX idx_sort (sort_order)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS external_videos')
}
