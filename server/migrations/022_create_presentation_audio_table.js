export async function up(conn) {
  await conn.query(`
    CREATE TABLE presentation_audio (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_name (name),
      INDEX idx_sort (sort_order)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS presentation_audio')
}
