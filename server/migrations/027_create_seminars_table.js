export async function up(conn) {
  await conn.query(`
    CREATE TABLE IF NOT EXISTS seminars (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      start_time DATETIME NOT NULL,
      end_time DATETIME NULL,
      timeline_id INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_seminar_timeline FOREIGN KEY (timeline_id) REFERENCES timelines(id) ON DELETE SET NULL
    )
  `)

  const [aps] = await conn.query(
    `SELECT virtual_seminar_start_time, virtual_seminar_timeline_id FROM admin_panel_settings LIMIT 1`
  )
  if (aps && aps.length > 0 && (aps[0].virtual_seminar_start_time || aps[0].virtual_seminar_timeline_id)) {
    const startTime = aps[0].virtual_seminar_start_time || new Date()
    const timelineId = aps[0].virtual_seminar_timeline_id ?? null
    await conn.query(
      'INSERT INTO seminars (title, start_time, end_time, timeline_id) VALUES (?, ?, ?, ?)',
      ['Virtual Seminar', startTime, null, timelineId]
    )
  }
}

export async function down(conn) {
  await conn.query('ALTER TABLE seminars DROP FOREIGN KEY fk_seminar_timeline')
  await conn.query('DROP TABLE IF EXISTS seminars')
}
