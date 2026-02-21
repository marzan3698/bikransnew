export async function up(conn) {
  await conn.query(`
    CREATE TABLE polls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question VARCHAR(500) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sort (sort_order)
    )
  `)

  await conn.query(`
    CREATE TABLE poll_options (
      id INT AUTO_INCREMENT PRIMARY KEY,
      poll_id INT NOT NULL,
      label VARCHAR(255) NOT NULL,
      sort_order INT DEFAULT 0,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
      INDEX idx_poll (poll_id)
    )
  `)

  await conn.query(`
    CREATE TABLE poll_votes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      poll_id INT NOT NULL,
      option_id INT NOT NULL,
      voter_identifier VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
      FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
      UNIQUE KEY unique_vote (poll_id, voter_identifier),
      INDEX idx_poll (poll_id)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS poll_votes')
  await conn.query('DROP TABLE IF EXISTS poll_options')
  await conn.query('DROP TABLE IF EXISTS polls')
}
