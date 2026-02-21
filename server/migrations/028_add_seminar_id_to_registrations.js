export async function up(conn) {
  await conn.query(`
    ALTER TABLE virtual_seminar_registrations
    ADD COLUMN seminar_id INT NULL
  `)
  await conn.query(`
    ALTER TABLE virtual_seminar_registrations
    ADD CONSTRAINT fk_registration_seminar
    FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE SET NULL
  `)
  const [first] = await conn.query('SELECT id FROM seminars ORDER BY id ASC LIMIT 1')
  if (first && first.length > 0) {
    await conn.query('UPDATE virtual_seminar_registrations SET seminar_id = ? WHERE seminar_id IS NULL', [
      first[0].id,
    ])
  }
}

export async function down(conn) {
  await conn.query('ALTER TABLE virtual_seminar_registrations DROP FOREIGN KEY fk_registration_seminar')
  await conn.query('ALTER TABLE virtual_seminar_registrations DROP COLUMN seminar_id')
}
