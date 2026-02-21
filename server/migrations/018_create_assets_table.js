export async function up(conn) {
  await conn.query(`
    CREATE TABLE assets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_path VARCHAR(500) NOT NULL,
      file_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100),
      file_size INT DEFAULT 0,
      file_type ENUM('image','video','audio','document') NOT NULL,
      uploaded_by INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_file_type (file_type),
      INDEX idx_created_at (created_at)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS assets')
}
