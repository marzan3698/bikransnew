export async function up(conn) {
  await conn.query(`
    CREATE TABLE frames (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      category VARCHAR(100) DEFAULT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size_bytes INT DEFAULT NULL,
      mime_type VARCHAR(100) DEFAULT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS frames')
}

