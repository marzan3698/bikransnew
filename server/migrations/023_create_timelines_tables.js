export async function up(conn) {
  await conn.query(`
    CREATE TABLE timelines (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sort (sort_order)
    )
  `)

  await conn.query(`
    CREATE TABLE timeline_frames (
      id INT AUTO_INCREMENT PRIMARY KEY,
      timeline_id INT NOT NULL,
      duration_seconds INT DEFAULT 30,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE CASCADE,
      INDEX idx_timeline (timeline_id),
      INDEX idx_sort (sort_order)
    )
  `)

  await conn.query(`
    CREATE TABLE timeline_frame_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      frame_id INT NOT NULL,
      item_type ENUM('video', 'audio', 'poll', 'quiz', 'asset') NOT NULL,
      item_ref VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (frame_id) REFERENCES timeline_frames(id) ON DELETE CASCADE,
      INDEX idx_frame (frame_id),
      INDEX idx_sort (sort_order)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS timeline_frame_items')
  await conn.query('DROP TABLE IF EXISTS timeline_frames')
  await conn.query('DROP TABLE IF EXISTS timelines')
}
