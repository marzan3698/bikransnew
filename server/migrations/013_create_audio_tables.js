export async function up(conn) {
  await conn.query(`
    CREATE TABLE audio_tracks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      file_path VARCHAR(500) NOT NULL,
      duration_seconds INT DEFAULT NULL,
      file_size_bytes INT DEFAULT NULL,
      mime_type VARCHAR(100) DEFAULT NULL,
      category VARCHAR(100) DEFAULT NULL,
      tags TEXT DEFAULT NULL,
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_category (category),
      INDEX idx_created_at (created_at)
    )
  `)

  await conn.query(`
    CREATE TABLE audio_play_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      audio_id INT NOT NULL,
      user_id INT DEFAULT NULL,
      source ENUM('editor', 'preview', 'other') DEFAULT 'other',
      ip_address VARCHAR(45) DEFAULT NULL,
      user_agent VARCHAR(500) DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audio_id) REFERENCES audio_tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_audio_id (audio_id),
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS audio_play_logs')
  await conn.query('DROP TABLE IF EXISTS audio_tracks')
}
