export async function up(conn) {
  await conn.query(`
    CREATE TABLE presentation_quizzes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      question VARCHAR(500) NOT NULL,
      option_a VARCHAR(255) NOT NULL,
      option_b VARCHAR(255) DEFAULT NULL,
      option_c VARCHAR(255) DEFAULT NULL,
      option_d VARCHAR(255) DEFAULT NULL,
      answer CHAR(1) NOT NULL,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_sort (sort_order)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS presentation_quizzes')
}
