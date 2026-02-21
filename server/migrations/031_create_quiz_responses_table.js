export async function up(conn) {
  await conn.query(`
    CREATE TABLE quiz_responses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT NOT NULL,
      voter_identifier VARCHAR(100) NOT NULL,
      selected_option CHAR(1) NOT NULL,
      is_correct TINYINT(1) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES presentation_quizzes(id) ON DELETE CASCADE,
      UNIQUE KEY unique_quiz_voter (quiz_id, voter_identifier),
      INDEX idx_quiz (quiz_id)
    )
  `)
}

export async function down(conn) {
  await conn.query('DROP TABLE IF EXISTS quiz_responses')
}
